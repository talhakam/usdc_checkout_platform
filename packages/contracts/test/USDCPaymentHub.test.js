// Register Hardhat toolbox (includes chai matchers)
require("@nomicfoundation/hardhat-toolbox");
// Ensure chai matchers are attached to the chai instance used in this test file.
// This is defensive for monorepo/hoisting setups where the plugin may attach
// to a different chai instance. We apply the plugin to our local chai copy
// and fall back to the internal export if necessary.
const chai = require("chai");
try {
  // Try the public package first
  const publicPlugin = require("@nomicfoundation/hardhat-chai-matchers");
  if (typeof publicPlugin === "function") chai.use(publicPlugin);
  else if (publicPlugin && typeof publicPlugin.default === "function") chai.use(publicPlugin.default);
} catch (e) {
  // ignore — we'll try the internal path below
}
// If the matchers haven't been added, try the internal export path
try {
  // internal/hardhatChaiMatchers exports `hardhatChaiMatchers`
  const path = require("path");
  const pluginIndex = require.resolve("@nomicfoundation/hardhat-chai-matchers");
  const pluginDir = path.dirname(pluginIndex);
  const internalMatchersPath = path.join(pluginDir, "internal", "hardhatChaiMatchers");
  const internal = require(internalMatchersPath);
  if (internal && typeof internal.hardhatChaiMatchers === "function") chai.use(internal.hardhatChaiMatchers);
} catch (e) {
  // last-resort: do nothing — tests will fail and we can inspect errors
}
const { expect } = chai;
const { ethers } = require("hardhat");

describe("USDCPaymentHub MVP", function () {
  let deployer, admin, merchant, consumer, feeAccount;
  let mockUsdc, hub;

  beforeEach(async function () {
    [deployer, admin, merchant, consumer, feeAccount] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();

    // Deploy Hub
    const USDCPaymentHub = await ethers.getContractFactory("USDCPaymentHub");
    const usdcAddress = await mockUsdc.getAddress();
    hub = await USDCPaymentHub.deploy(
      usdcAddress,
      feeAccount.address,
      200 // 2% fee
    );
    await hub.waitForDeployment();

    // Register merchant
    await hub.connect(deployer).registerMerchant(merchant.address);

  // grant ADMIN_ROLE to admin signer so admin can call adminRefund in tests
  const ADMIN_ROLE = await hub.ADMIN_ROLE();
  await hub.connect(deployer).grantRole(ADMIN_ROLE, admin.address);

  // Mint tokens for consumer
  await mockUsdc.faucet(consumer.address, ethers.parseUnits("1000", 6));
  });

  it("should allow checkout and distribute funds", async function () {
  const netAmount = ethers.parseUnits("100", 6);
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("order-1"));
    const hubAddress = await hub.getAddress();

    // Approve hub
    await mockUsdc.connect(consumer).approve(hubAddress, netAmount);

    // Checkout
    await expect(hub.connect(consumer).checkout(paymentId, merchant.address, netAmount))
      .to.emit(hub, "PaymentProcessed");

    // Balances check
    const merchantBal = await mockUsdc.balanceOf(merchant.address);
    const feeBal = await mockUsdc.balanceOf(feeAccount.address);
  expect(merchantBal).to.equal(ethers.parseUnits("98", 6));
  expect(feeBal).to.equal(ethers.parseUnits("2", 6));
  });

  it("should prevent duplicate paymentId", async function () {
  const netAmount = ethers.parseUnits("50", 6);
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("dup-test"));
    const hubAddress = await hub.getAddress();

    await mockUsdc.connect(consumer).approve(hubAddress, netAmount * 2n);

    await hub.connect(consumer).checkout(paymentId, merchant.address, netAmount);

    await expect(
      hub.connect(consumer).checkout(paymentId, merchant.address, netAmount)
    ).to.be.revertedWithCustomError(hub, "PaymentAlreadyProcessed");
  });

  it("should allow consumer to request refund", async function () {
  const netAmount = ethers.parseUnits("60", 6);
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("refund-req"));
    const hubAddress = await hub.getAddress();

    await mockUsdc.connect(consumer).approve(hubAddress, netAmount);
    await hub.connect(consumer).checkout(paymentId, merchant.address, netAmount);

    await expect(hub.connect(consumer).requestRefund(paymentId, "Product defect"))
      .to.emit(hub, "RefundRequested")
      .withArgs(paymentId, consumer.address, "Product defect");

    const requested = await hub.isRefundRequested(paymentId);
    expect(requested).to.be.true;
  });

  it("should allow merchant to issue refund", async function () {
  const amount = ethers.parseUnits("80", 6);
    const feeBps = 200n; // 2%
    const merchantAmount = amount - (amount * feeBps) / 10000n; // merchant nets after fee
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("merchant-refund"));
    const hubAddress = await hub.getAddress();

    await mockUsdc.connect(consumer).approve(hubAddress, amount);
    await hub.connect(consumer).checkout(paymentId, merchant.address, amount);

    await hub.connect(consumer).requestRefund(paymentId, "Refund test");

    // Merchant must approve Hub for refund amount 
    await mockUsdc.connect(merchant).approve(hubAddress, merchantAmount);

    await expect(hub.connect(merchant).merchantRefund(paymentId, merchantAmount))
      .to.emit(hub, "RefundIssued")
      .withArgs(paymentId, merchant.address, consumer.address, merchantAmount);

    const refunded = await hub.isRefunded(paymentId);
    expect(refunded).to.be.true;
  });

  it("should allow admin to issue refund", async function () {
  const netAmount = ethers.parseUnits("90", 6);
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("admin-refund"));
    const hubAddress = await hub.getAddress();

    await mockUsdc.connect(consumer).approve(hubAddress, netAmount);
    await hub.connect(consumer).checkout(paymentId, merchant.address, netAmount);

    await hub.connect(consumer).requestRefund(paymentId, "Admin refund case");

    // Admin must approve Hub for refund
    await mockUsdc.faucet(admin.address, netAmount);
    await mockUsdc.connect(admin).approve(hubAddress, netAmount);

    await expect(hub.connect(admin).adminRefund(paymentId, netAmount))
      .to.emit(hub, "RefundIssued")
      .withArgs(paymentId, admin.address, consumer.address, netAmount);

    const refunded = await hub.isRefunded(paymentId);
    expect(refunded).to.be.true;
  });

  // Negative / edge-case tests
  it("should revert checkout with zero amount", async function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("zero-amount"));
    await expect(hub.connect(consumer).checkout(paymentId, merchant.address, 0n))
      .to.be.revertedWithCustomError(hub, "InvalidAmount");
  });

  it("should revert checkout to unregistered merchant", async function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("not-merchant"));
    // use admin (not registered as merchant) as recipient
  await mockUsdc.connect(consumer).approve(await hub.getAddress(), ethers.parseUnits("10", 6));
  await expect(hub.connect(consumer).checkout(paymentId, admin.address, ethers.parseUnits("10", 6)))
      .to.be.revertedWithCustomError(hub, "NotMerchant");
  });

  it("should revert checkout when paused", async function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("paused"));
    await hub.connect(deployer).pause();
    // Sanity: ensure contract reports paused state
    expect(await hub.paused()).to.equal(true);

  await mockUsdc.connect(consumer).approve(await hub.getAddress(), ethers.parseUnits("10", 6));
    // Expect a revert due to paused state. Use a generic revert assertion to avoid
    // brittle dependence on the exact revert string (varies by OZ version).
  await expect(hub.connect(consumer).checkout(paymentId, merchant.address, ethers.parseUnits("10", 6)))
      .to.be.reverted;

    await hub.connect(deployer).unpause();
  });

  it("should revert requestRefund when called by non-consumer", async function () {
  const amount = ethers.parseUnits("20", 6);
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("req-non-consumer"));
    await mockUsdc.connect(consumer).approve(await hub.getAddress(), amount);
    await hub.connect(consumer).checkout(paymentId, merchant.address, amount);

    // admin tries to request refund for consumer's payment
    await expect(hub.connect(admin).requestRefund(paymentId, "Not allowed"))
      .to.be.revertedWithCustomError(hub, "NotPaymentConsumer");
  });

  it("should revert merchantRefund when refund not requested", async function () {
  const amount = ethers.parseUnits("30", 6);
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("no-refund-request"));
    await mockUsdc.connect(consumer).approve(await hub.getAddress(), amount);
    await hub.connect(consumer).checkout(paymentId, merchant.address, amount);

    // merchant attempts refund without a request
    await mockUsdc.connect(merchant).approve(await hub.getAddress(), amount);
    await expect(hub.connect(merchant).merchantRefund(paymentId, amount)).to.be.revertedWithCustomError(hub, "RefundNotRequested");
  });

  it("should revert adminRefund when refund not requested", async function () {
  const amount = ethers.parseUnits("35", 6);
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("admin-no-request"));
    await mockUsdc.connect(consumer).approve(await hub.getAddress(), amount);
    await hub.connect(consumer).checkout(paymentId, merchant.address, amount);

    await mockUsdc.faucet(admin.address, amount);
    await mockUsdc.connect(admin).approve(await hub.getAddress(), amount);
    await expect(hub.connect(admin).adminRefund(paymentId, amount)).to.be.revertedWithCustomError(hub, "RefundNotRequested");
  });

  it("should prevent double refunds", async function () {
  const amount = ethers.parseUnits("40", 6);
    const feeBps = 200n;
    const merchantAmount = amount - (amount * feeBps) / 10000n;
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("double-refund"));

    await mockUsdc.connect(consumer).approve(await hub.getAddress(), amount);
    await hub.connect(consumer).checkout(paymentId, merchant.address, amount);
    await hub.connect(consumer).requestRefund(paymentId, "Please refund");

    // Merchant performs refund
    await mockUsdc.connect(merchant).approve(await hub.getAddress(), merchantAmount);
    await hub.connect(merchant).merchantRefund(paymentId, merchantAmount);

    // Second refund attempt should fail
    await expect(hub.connect(merchant).merchantRefund(paymentId, merchantAmount)).to.be.revertedWithCustomError(hub, "AlreadyRefunded");
  });

  it("should revert deploy when fee too high", async function () {
    const USDCPaymentHub = await ethers.getContractFactory("USDCPaymentHub");
    const usdcAddress = await mockUsdc.getAddress();
    await expect(USDCPaymentHub.deploy(usdcAddress, feeAccount.address, 10001)).to.be.revertedWithCustomError(USDCPaymentHub, "FeeTooHigh");
  });

  it("computeFeeAndNet returns correct values", async function () {
  const amount = ethers.parseUnits("100", 6);
  const [fee, net] = await hub.computeFeeAndNet(amount);
  expect(fee).to.equal(ethers.parseUnits("2", 6));
  expect(net).to.equal(ethers.parseUnits("98", 6));
  });
});
// npx hardhat test test/USDCPaymentHub.test.js --network hardhat