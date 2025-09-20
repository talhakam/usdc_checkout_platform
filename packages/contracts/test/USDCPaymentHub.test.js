const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("USDCPaymentHub", () => {
  let usdc, hub, deployer, merchant, consumer, feeAccount;

  beforeEach(async () => {
    [deployer, merchant, consumer, feeAccount] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const Hub = await ethers.getContractFactory("USDCPaymentHub");
    hub = await Hub.deploy(usdc.address, feeAccount.address, 200);

    const MERCHANT_ROLE = await hub.MERCHANT_ROLE();
    await hub.grantRole(MERCHANT_ROLE, merchant.address);

    await usdc.faucet(consumer.address, ethers.utils.parseUnits("1000", 18));
  });

  it("checkout splits fee correctly", async () => {
    const amount = ethers.utils.parseUnits("100", 18);
    const paymentId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`${Date.now()}`));

    await usdc.connect(consumer).approve(hub.address, amount);

    await hub.connect(consumer).checkout(paymentId, merchant.address, amount);

    const fee = amount.mul(200).div(10000);
    expect(await usdc.balanceOf(feeAccount.address)).to.equal(fee);
  });
});
