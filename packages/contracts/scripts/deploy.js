const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy Mock USDC
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress(); // <-- Correct way
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy PaymentHub
  const feeAccount = deployer.address;
  const Hub = await hre.ethers.getContractFactory("USDCPaymentHub");
  const hub = await Hub.deploy(usdcAddress, feeAccount, 200); // 2% fee
  await hub.waitForDeployment();
  const hubAddress = await hub.getAddress(); // <-- Correct way
  console.log("USDCPaymentHub deployed to:", hubAddress);

  // Save deployments
  const deployments = {
    MockUSDC: usdcAddress,
    USDCPaymentHub: hubAddress,
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