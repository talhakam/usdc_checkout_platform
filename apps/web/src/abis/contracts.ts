// Centralized ABI exports for frontend components.
// Try to load Hardhat artifact JSON files from the monorepo's `packages/contracts/artifacts`.
// On CI (like Vercel) those artifacts may not be present; in that case we export empty ABIs
// so the build doesn't fail. Runtime code should handle missing ABI fragments gracefully.
// Minimal, client-friendly ABI fragments for the functions the frontend uses.
// These are intentionally small and inlined so the bundle doesn't try to include
// server-only modules (fs/path) or require artifacts that may not exist on CI.
export const USDCPaymentHubAbi = [
  // hasRole(bytes32,address) -> bool
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "hasRole",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // registerMerchant(address)
  {
    "inputs": [{ "internalType": "address", "name": "merchant", "type": "address" }],
    "name": "registerMerchant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // merchantRefund(bytes32,uint256)
  {
    "inputs": [
      { "internalType": "bytes32", "name": "paymentId", "type": "bytes32" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "merchantRefund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const MockUSDCAbi = [
  // faucet(address,uint256)
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // decimals() -> uint8
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  // approve(address,uint256)
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // allowance(address,address) -> uint256
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Convenience named fragments (optional) - components can still pass the full ABI
const abiBundle = {
  USDCPaymentHubAbi,
  MockUSDCAbi,
};
export { abiBundle as default };

// Export small fragments for ease-of-use in components (preserves viem type inference)
type AbiItem = { name?: string } & Record<string, unknown>;

export const MockUSDC_decimals = (MockUSDCAbi as AbiItem[]).find((i) => i.name === "decimals");
export const MockUSDC_approve = (MockUSDCAbi as AbiItem[]).find((i) => i.name === "approve");
export const MockUSDC_allowance = (MockUSDCAbi as AbiItem[]).find((i) => i.name === "allowance");

export const Hub_checkout = (USDCPaymentHubAbi as AbiItem[]).find((i) => i.name === "checkout");
export const Hub_hasRole = (USDCPaymentHubAbi as AbiItem[]).find((i) => i.name === "hasRole");
export const Hub_MERCHANT_ROLE = (USDCPaymentHubAbi as AbiItem[]).find((i) => i.name === "MERCHANT_ROLE");
export const Hub_ADMIN_ROLE = (USDCPaymentHubAbi as AbiItem[]).find((i) => i.name === "ADMIN_ROLE");
export const Hub_merchantRefund = (USDCPaymentHubAbi as AbiItem[]).find((i) => i.name === "merchantRefund");

