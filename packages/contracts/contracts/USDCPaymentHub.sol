// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// USDCPaymentHub
/// - Non-custodial checkout using ERC20 USDC (consumer approves hub)
/// - paymentId stored on-chain with minimal metadata (consumer, merchant, amounts, flags)
/// - Consumer initiates refund request on-chain (RefundRequested event)
/// - Merchant or ADMIN executes refund by providing funds from their wallet (must approve hub)
/// - Idempotent payments and refunds. Emergency pause. SafeERC20 used for token calls.
/// - AccessControl: ADMIN_ROLE to manage merchants and config.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract USDCPaymentHub is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");

    /// Token + fee config
    IERC20 public immutable usdc;
    address public platformFeeAccount;
    uint16 public platformFeeBps; // basis points (0..10000)

    /// Payment metadata stored on-chain (kept minimal)
    struct PaymentInfo {
        address consumer;      // who paid
        address merchant;      // merchant who received funds
        uint128 grossAmount;   // total amount consumer paid (fits 128 for typical fiat scaled amounts)
        uint128 merchantAmount; // amount merchant received (gross - fee)
        uint32  timestamp;     // block timestamp of processing
        bool    processed;     // payment processed
        bool    refunded;      // refunded flag
    }

    mapping(bytes32 => PaymentInfo) public payments;
    mapping(bytes32 => bool) public refundRequested;

    /// Events
    event MerchantRegistered(address indexed merchant);
    event MerchantRevoked(address indexed merchant);
    event PlatformFeeUpdated(uint16 oldBps, uint16 newBps);
    event PlatformFeeAccountUpdated(address indexed oldAccount, address indexed newAccount);

    event PaymentProcessed(
        bytes32 indexed paymentId,
        address indexed consumer,
        address indexed merchant,
        uint256 grossAmount,
        uint256 fee,
        uint256 merchantAmount
    );

    event RefundRequested(bytes32 indexed paymentId, address indexed consumer, string reason);
    event RefundIssued(bytes32 indexed paymentId, address indexed initiatedBy, address indexed consumer, uint256 amount);

    /// Errors (cheaper than strings)
    error ZeroAddress();
    error FeeTooHigh();
    error NotMerchant();
    error InvalidAmount();
    error PaymentAlreadyProcessed();
    error PaymentNotProcessed();
    error AlreadyRefunded();
    error RefundNotRequested();
    error NotPaymentConsumer();
    error NotPaymentMerchant();

    /// Constructor
    /// @param _usdc ERC20 token address (mock or real)
    /// @param _platformFeeAccount address to receive platform fees
    /// @param _platformFeeBps fee in bps (0..10000)
    constructor(address _usdc, address _platformFeeAccount, uint16 _platformFeeBps) {
        if (_usdc == address(0) || _platformFeeAccount == address(0)) revert ZeroAddress();
        if (_platformFeeBps > 10000) revert FeeTooHigh();

        usdc = IERC20(_usdc);
        platformFeeAccount = _platformFeeAccount;
        platformFeeBps = _platformFeeBps;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // -----------------------
    // Admin / Merchant APIs
    // -----------------------

    /// Register a merchant (grant MERCHANT_ROLE)
    function registerMerchant(address merchant) external onlyRole(ADMIN_ROLE) {
        if (merchant == address(0)) revert ZeroAddress();
        grantRole(MERCHANT_ROLE, merchant);
        emit MerchantRegistered(merchant);
    }

    /// Revoke merchant
    function revokeMerchant(address merchant) external onlyRole(ADMIN_ROLE) {
        if (merchant == address(0)) revert ZeroAddress();
        revokeRole(MERCHANT_ROLE, merchant);
        emit MerchantRevoked(merchant);
    }

    /// Update platform fee
    function setPlatformFee(uint16 newBps) external onlyRole(ADMIN_ROLE) {
        if (newBps > 10000) revert FeeTooHigh();
        uint16 old = platformFeeBps;
        platformFeeBps = newBps;
        emit PlatformFeeUpdated(old, newBps);
    }

    /// Update platform fee recipient
    function setPlatformFeeAccount(address newAccount) external onlyRole(ADMIN_ROLE) {
        if (newAccount == address(0)) revert ZeroAddress();
        address old = platformFeeAccount;
        platformFeeAccount = newAccount;
        emit PlatformFeeAccountUpdated(old, newAccount);
    }

    /// Pause new checkouts
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /// Unpause
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // -----------------------
    // Core payment flow
    // -----------------------

    /// checkout: consumer pays grossAmount; hub pulls tokens from consumer and transfers instantly:
    /// - merchant receives grossAmount - fee
    /// - platform receives fee
    /// Requirements:
    ///  - merchant must have MERCHANT_ROLE
    ///  - consumer must have approved hub to spend grossAmount
    ///  - paymentId unique
    function checkout(
        bytes32 paymentId,
        address merchant,
        uint256 grossAmount
    ) external whenNotPaused nonReentrant {
        if (merchant == address(0)) revert ZeroAddress();
        if (grossAmount == 0) revert InvalidAmount();
        if (!hasRole(MERCHANT_ROLE, merchant)) revert NotMerchant();

        PaymentInfo storage p = payments[paymentId];
        if (p.processed) revert PaymentAlreadyProcessed();

        // compute fee and merchant amount (use local vars for gas)
        uint16 feeBps = platformFeeBps;
        uint256 fee = (grossAmount * feeBps) / 10000;
        uint256 merchantAmount = grossAmount - fee;

        // mark processed and store metadata before external calls (reentrancy guard + nonReentrant)
        p.consumer = msg.sender;
        p.merchant = merchant;
        p.grossAmount = uint128(grossAmount);
        p.merchantAmount = uint128(merchantAmount);
        p.timestamp = uint32(block.timestamp);
        p.processed = true;
        p.refunded = false;

        // transfers: consumer -> merchant, consumer -> fee account
        // require consumer has approved hub; SafeERC20 will revert on failure.
        usdc.safeTransferFrom(msg.sender, merchant, merchantAmount);

        if (fee > 0) {
            usdc.safeTransferFrom(msg.sender, platformFeeAccount, fee);
        }

        emit PaymentProcessed(paymentId, msg.sender, merchant, grossAmount, fee, merchantAmount);
    }

    // -----------------------
    // Refund request + execution
    // -----------------------

    /// Consumer requests a refund for a processed payment. This merely creates an on-chain request and emits an event.
    /// Only the original consumer can request a refund for that payment.
    function requestRefund(bytes32 paymentId, string calldata reason) external {
        PaymentInfo storage p = payments[paymentId];
        if (!p.processed) revert PaymentNotProcessed();
        if (p.consumer != msg.sender) revert NotPaymentConsumer();
        if (p.refunded) revert AlreadyRefunded();

        refundRequested[paymentId] = true;
        emit RefundRequested(paymentId, msg.sender, reason);
    }

    /// Merchant executes refund by pulling funds from their own wallet to the consumer.
    /// Merchant must have approved the hub for the refund amount beforehand.
    function merchantRefund(
        bytes32 paymentId,
        uint256 amount
    ) external nonReentrant onlyRole(MERCHANT_ROLE) {
        PaymentInfo storage p = payments[paymentId];
        if (!p.processed) revert PaymentNotProcessed();
        if (p.refunded) revert AlreadyRefunded();
        if (!refundRequested[paymentId]) revert RefundNotRequested();
        if (msg.sender != p.merchant) revert NotPaymentMerchant();

        // mark refunded first to prevent double refunds
        p.refunded = true;

        usdc.safeTransferFrom(msg.sender, p.consumer, amount);

        emit RefundIssued(paymentId, msg.sender, p.consumer, amount);
    }

    /// Admin executes refund (admin must approve hub to move funds from admin wallet).
    /// Admin refunds also require that consumer initiated a refund request as per MVP.
    function adminRefund(
        bytes32 paymentId,
        uint256 amount
    ) external nonReentrant onlyRole(ADMIN_ROLE) {
        PaymentInfo storage p = payments[paymentId];
        if (!p.processed) revert PaymentNotProcessed();
        if (p.refunded) revert AlreadyRefunded();
        if (!refundRequested[paymentId]) revert RefundNotRequested();

        // mark refunded first
        p.refunded = true;

        usdc.safeTransferFrom(msg.sender, p.consumer, amount);

        emit RefundIssued(paymentId, msg.sender, p.consumer, amount);
    }

    // -----------------------
    // Views / helpers
    // -----------------------

    function isProcessed(bytes32 paymentId) external view returns (bool) {
        return payments[paymentId].processed;
    }

    function isRefundRequested(bytes32 paymentId) external view returns (bool) {
        return refundRequested[paymentId];
    }

    function isRefunded(bytes32 paymentId) external view returns (bool) {
        return payments[paymentId].refunded;
    }

    /// Compute fee and merchant net for a gross amount (pure view)
    function computeFeeAndNet(uint256 grossAmount) external view returns (uint256 fee, uint256 net) {
        fee = (grossAmount * platformFeeBps) / 10000;
        net = grossAmount - fee;
    }

    /// Return full payment info (convenience)
    function getPaymentInfo(bytes32 paymentId) external view returns (
        address consumer,
        address merchant,
        uint256 grossAmount,
        uint256 merchantAmount,
        uint32 timestamp,
        bool processed,
        bool refunded
    ) {
        PaymentInfo storage p = payments[paymentId];
        return (p.consumer, p.merchant, p.grossAmount, p.merchantAmount, p.timestamp, p.processed, p.refunded);
    }
}
