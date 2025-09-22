// Centralized ABI exports for frontend components.
// These import the Hardhat artifacts from the `packages/contracts` build output.
// Importing JSON artifacts is allowed via `resolveJsonModule` in tsconfig.
import USDCPaymentHubArtifact from '../../../../packages/contracts/artifacts/contracts/USDCPaymentHub.sol/USDCPaymentHub.json';
import MockUSDCArtifact from '../../../../packages/contracts/artifacts/contracts/MockUSDC.sol/MockUSDC.json';

export const USDCPaymentHubAbi = USDCPaymentHubArtifact.abi as any[];
export const MockUSDCAbi = MockUSDCArtifact.abi as any[];

// Convenience named fragments (optional) - components can still pass the full ABI
export default {
  USDCPaymentHubAbi,
  MockUSDCAbi,
};

// Export small fragments for ease-of-use in components (preserves viem type inference)
export const MockUSDC_decimals = MockUSDCAbi.find((i) => i.name === "decimals");
export const MockUSDC_approve = MockUSDCAbi.find((i) => i.name === "approve");
export const MockUSDC_allowance = MockUSDCAbi.find((i) => i.name === "allowance");

export const Hub_checkout = USDCPaymentHubAbi.find((i) => i.name === "checkout");
export const Hub_hasRole = USDCPaymentHubAbi.find((i) => i.name === "hasRole");
export const Hub_MERCHANT_ROLE = USDCPaymentHubAbi.find((i) => i.name === "MERCHANT_ROLE");
export const Hub_ADMIN_ROLE = USDCPaymentHubAbi.find((i) => i.name === "ADMIN_ROLE");
export const Hub_merchantRefund = USDCPaymentHubAbi.find((i) => i.name === "merchantRefund");

