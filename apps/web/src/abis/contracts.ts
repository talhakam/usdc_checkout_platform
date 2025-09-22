// Centralized ABI exports for frontend components.
// These import the Hardhat artifacts from the `packages/contracts` build output.
// Importing JSON artifacts is allowed via `resolveJsonModule` in tsconfig.
import USDCPaymentHubArtifact from '../../../../packages/contracts/artifacts/contracts/USDCPaymentHub.sol/USDCPaymentHub.json';
import MockUSDCArtifact from '../../../../packages/contracts/artifacts/contracts/MockUSDC.sol/MockUSDC.json';

export const USDCPaymentHubAbi = USDCPaymentHubArtifact.abi as unknown[];
export const MockUSDCAbi = MockUSDCArtifact.abi as unknown[];

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

