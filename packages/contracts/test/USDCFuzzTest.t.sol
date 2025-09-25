// This file contains a fuzz test for the USDCPaymentHub contract using Foundry.
// To run the tests, use the following command:
// forge test --fuzz-runs 1000 -vvvv --match-path packages/contracts/test/USDCFuzzTest.t.sol

pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/MockUSDC.sol";
import "../contracts/USDCPaymentHub.sol";

contract USDCFuzzTest is Test {
    MockUSDC mockUsdc;
    USDCPaymentHub hub;
    address merchant = address(0xBEEF);
    address consumer = address(0xCAFE);
    address feeAccount = address(this);

    function setUp() public {
        mockUsdc = new MockUSDC();
        hub = new USDCPaymentHub(address(mockUsdc), feeAccount, 200); // 2% fee
        hub.registerMerchant(merchant);
        mockUsdc.faucet(consumer, 1_000_000 ether);
    }

    // property: fee + net == amount and fee matches bps
    function testFuzz_computeFeeAndNet(uint256 amount) public {
        vm.assume(amount > 0 && amount < type(uint128).max);
        (uint256 fee, uint256 net) = hub.computeFeeAndNet(amount);
        assertEq(fee + net, amount);
        assertEq(fee, (amount * 200) / 10000);
    }

    // property: after checkout, balances invariant holds
    function testFuzz_checkout_invariant(uint256 amount) public {
        vm.assume(amount >= 1e6 && amount <= 1_000_000 ether);
        bytes32 pid = keccak256(abi.encodePacked(amount, block.timestamp));

        // record balances before checkout (test contract or other accounts may hold tokens)
        uint256 beforeMerchant = mockUsdc.balanceOf(merchant);
        uint256 beforeFee = mockUsdc.balanceOf(feeAccount);

        vm.prank(consumer);
        mockUsdc.approve(address(hub), amount);
        vm.prank(consumer);
        hub.checkout(pid, merchant, amount);

        uint256 expectedFee = (amount * 200) / 10000;
        uint256 expectedNet = amount - expectedFee;

        // assert the change in balances equals expected amounts
        assertEq(mockUsdc.balanceOf(merchant) - beforeMerchant, expectedNet);
        assertEq(mockUsdc.balanceOf(feeAccount) - beforeFee, expectedFee);
    }

    // -----------------------------
    // Boundary & limit tests
    // -----------------------------

    /// computeFeeAndNet should revert if multiplication overflows (very large amount with high fee)
    function test_computeFeeAndNet_overflow_reverts() public {
        // deploy hub with maximum fee (10000 bps) to maximize multiplication
        USDCPaymentHub hubMaxFee = new USDCPaymentHub(address(mockUsdc), feeAccount, 10000);
        // amount that will overflow when multiplied by 10000: choose uint256.max / 10000 + 1
        uint256 overflowAmount = (type(uint256).max / 10000) + 1;
        vm.expectRevert();
        hubMaxFee.computeFeeAndNet(overflowAmount);
    }

    /// computeFeeAndNet works at extreme values within safe multiplication bounds
    function test_computeFeeAndNet_extreme_values() public {
        USDCPaymentHub hub0 = new USDCPaymentHub(address(mockUsdc), feeAccount, 0);
        (uint256 f0, uint256 n0) = hub0.computeFeeAndNet(type(uint128).max);
        assertEq(f0, 0);
        assertEq(n0, type(uint128).max);

        USDCPaymentHub hubFull = new USDCPaymentHub(address(mockUsdc), feeAccount, 10000);
        // small value for 100% fee
        (uint256 f1, uint256 n1) = hubFull.computeFeeAndNet(1000);
        assertEq(f1, 1000);
        assertEq(n1, 0);
    }

    /// Checkout stores amounts into uint128 fields — verify truncation behavior when amount > uint128
    function test_checkout_uint128_truncation() public {
        // amount one greater than uint128 max
        uint256 big = uint256(type(uint128).max) + 1;

        // ensure consumer has enough funds
        mockUsdc.faucet(consumer, big);
        bytes32 pid = keccak256(abi.encodePacked("big-order"));

        vm.prank(consumer);
        mockUsdc.approve(address(hub), big);
        vm.prank(consumer);
        hub.checkout(pid, merchant, big);

    // Read stored payment info (now includes refundedAmount)
    (address c, address m, uint256 storedGross, uint256 storedMerchantAmount, uint256 storedRefundedAmount, uint32 storedTimestamp, bool storedProcessed, bool storedRefunded) = hub.getPaymentInfo(pid);

        // Stored gross/merchantAmount are truncated to uint128 — ensure truncation occurred
        assertEq(uint256(uint128(big)), storedGross);
        // But the actual transfer to merchant used the original computed merchantAmount
        uint256 fee = (big * uint256(hub.platformFeeBps())) / 10000;
        uint256 expectedMerchantNet = big - fee;
        assertEq(mockUsdc.balanceOf(merchant), expectedMerchantNet);
    }

    /// Merchant refund should revert when merchant has insufficient balance (no faucet called)
    function test_merchantRefund_insufficient_balance_reverts() public {
        uint256 amount = 1 ether;
        bytes32 pid = keccak256(abi.encodePacked("refund-insufficient"));

        // give consumer funds and perform checkout
        mockUsdc.faucet(consumer, amount);
        vm.prank(consumer);
        mockUsdc.approve(address(hub), amount);
        vm.prank(consumer);
        hub.checkout(pid, merchant, amount);

        // consumer requests refund
        vm.prank(consumer);
        hub.requestRefund(pid, "please");

        // merchant has no tokens (didn't faucet) and attempts refund -> transferFrom will revert
        vm.prank(merchant);
        vm.expectRevert();
        hub.merchantRefund(pid, amount);
    }

    /// Ensure double refunds are prevented (adminRefund path)
    function test_double_refund_prevented_admin() public {
        uint256 amount = 2 ether;
        bytes32 pid = keccak256(abi.encodePacked("double-admin"));

        mockUsdc.faucet(consumer, amount);
        vm.prank(consumer);
        mockUsdc.approve(address(hub), amount);
        vm.prank(consumer);
        hub.checkout(pid, merchant, amount);

        vm.prank(consumer);
        hub.requestRefund(pid, "admin please");

        // admin (this contract) must approve hub to pull funds
        mockUsdc.faucet(address(this), amount);
        mockUsdc.approve(address(hub), amount);

        // first refund succeeds
        hub.adminRefund(pid, amount);

        // second refund should revert with AlreadyRefunded
        vm.expectRevert(abi.encodeWithSelector(USDCPaymentHub.AlreadyRefunded.selector));
        hub.adminRefund(pid, amount);
    }
}

