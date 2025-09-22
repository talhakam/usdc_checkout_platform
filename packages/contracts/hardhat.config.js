require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { PRIVATE_KEY, ALCHEMY_AMOY_URL } = process.env;

const networks = {
  hardhat: {
    chainId: 1337
  }
};

// Only add when the ALCHEMY_AMOY_URL env var is set.
if (ALCHEMY_AMOY_URL) {
  networks.amoy = {
    url: ALCHEMY_AMOY_URL,
    chainId: 80002,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
  };
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks,
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  mocha: { timeout: 200000 }
};
