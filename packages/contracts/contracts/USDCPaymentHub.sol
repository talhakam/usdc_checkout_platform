// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


// This is the main contract


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract USDCPaymentHub is AccessControl {
    // ---- Roles ----
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");

    // ---- State ----
    IERC20 public usdc;
    address public platformFeeWallet;
    address public taxWallet;

    uint256 public platformFeeBps; // fee in basis points (100 = 1%)
    mapping(uint256 => address) public merchants; // merchantId -> wallet

    // ---- Events ----
    event MerchantOnboarded(uint256 merchantId, address wallet);
    event PaymentProcessed(address consumer, uint256 merchantId, uint256 amount, uint256 fee, uint256 tax);
    event RefundIssued(address consumer, uint256 merchantId, uint256 amount);

    // ---- Constructor ----
    constructor(address _usdc, address _platformFeeWallet, address _taxWallet) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        usdc = IERC20(_usdc);
        platformFeeWallet = _platformFeeWallet;
        taxWallet = _taxWallet;
        platformFeeBps = 100; // default 1%
    }

    // ---- Merchant functions ----
    function onboardMerchant(uint256 merchantId, address wallet) external onlyRole(ADMIN_ROLE) {
        merchants[merchantId] = wallet;
        emit MerchantOnboarded(merchantId, wallet);
    }

    // ---- Payment function (skeleton) ----
    function checkout(uint256 merchantId, uint256 amount) external {
        // TODO: add logic later
        emit PaymentProcessed(msg.sender, merchantId, amount, 0, 0);
    }

    // ---- Refund function (skeleton) ----
    function refund(uint256 merchantId, address consumer, uint256 amount) external {
        // TODO: add logic later
        emit RefundIssued(consumer, merchantId, amount);
    }
}
