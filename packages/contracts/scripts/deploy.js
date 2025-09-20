const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy Mock USDC
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.deployed();
  console.log("MockUSDC deployed to:", usdc.address);

  // Deploy PaymentHub
  const feeAccount = deployer.address;
  const Hub = await hre.ethers.getContractFactory("USDCPaymentHub");
  const hub = await Hub.deploy(usdc.address, feeAccount, 200); // 2% fee
  await hub.deployed();
  console.log("USDCPaymentHub deployed to:", hub.address);

  // Save deployments
  const deployments = {
    MockUSDC: usdc.address,
    USDCPaymentHub: hub.address,
    network: hre.network.name,
  };
  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
  console.log("Deployment info saved to deployments.json");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
// npx hardhat run scripts/deploy.js --network amoy