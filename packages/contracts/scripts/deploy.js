const hre = require("hardhat");
const fs = require("fs");
const { PRIVATE_KEY } = process.env;

async function main() {
  let deployer;
  // If PRIVATE_KEY is provided in env, use it for all networks (local or remote).
  if (PRIVATE_KEY) {
    const provider = hre.ethers.provider;
    deployer = new hre.ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Using ADMIN_PRIVATE_KEY deployer: ${deployer.address} (network: ${hre.network.name})`);
  } else {
    // When running against localhost or hardhat, use the built-in accounts as fallback.
    [deployer] = await hre.ethers.getSigners();
    console.log(`Using local signer: ${deployer.address} (network: ${hre.network.name})`);
  }

  // Deploy Mock USDC using the selected deployer
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC", deployer);
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy PaymentHub
  const feeAccount = deployer.address;
  const Hub = await hre.ethers.getContractFactory("USDCPaymentHub", deployer);
  const hub = await Hub.deploy(usdcAddress, feeAccount, 200); // 2% fee
  await hub.waitForDeployment();
  const hubAddress = await hub.getAddress();
  console.log("USDCPaymentHub deployed to:", hubAddress);

  // Save deployments
  const deployments = {
    MockUSDC: usdcAddress,
    USDCPaymentHub: hubAddress,
    network: hre.network.name,
  };
  fs.writeFileSync("deployments/deployments.json", JSON.stringify(deployments, null, 2));
  console.log("Deployment info saved to deployments.json");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
// Examples:
// Local: npx hardhat node  (in one terminal)
// Deploy locally: npx hardhat run scripts/deploy.js --network localhost
// Deploy to amoy (set ADMIN_PRIVATE_KEY env var and network):
// ADMIN_PRIVATE_KEY="0x..." npx hardhat run scripts/deploy.js --network amoy