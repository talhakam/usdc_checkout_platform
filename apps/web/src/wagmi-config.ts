import { http, createConfig } from "wagmi";

// ENV for Polygon Amoy
const AMOY_RPC =
  process.env.NEXT_PUBLIC_ALCHEMY_AMOY_URL ||
  process.env.ALCHEMY_AMOY_URL ||
  "";
const AMOY_CHAIN_ID = 80002; // Polygon Amoy testnet

// Local Hardhat chain (1337)
const localhost = {
  id: 1337,
  name: "Local Hardhat",
  network: "hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
  testnet: true,
} as const;

// Polygon Amoy (manual definition)
const polygonAmoy = {
  id: AMOY_CHAIN_ID,
  name: "Polygon Amoy",
  network: "amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: {
    default: { http: [AMOY_RPC] },
    public: { http: [AMOY_RPC] },
  },
  testnet: true,
} as const;

// Chains we support
export const chains = [localhost, polygonAmoy] as const;

// Transport mapping (use any for typing to avoid depending on wagmi's exact exported types)
export const transports: Record<number, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any -- wagmi typing mismatch workaround
  [localhost.id]: http("http://127.0.0.1:8545"),
};
if (AMOY_RPC) {
  transports[polygonAmoy.id] = http(AMOY_RPC);
}


export const config = createConfig({
  chains: chains as unknown as readonly [any, ...any[]], // eslint-disable-line @typescript-eslint/no-explicit-any -- wagmi typing mismatch workaround
  transports: transports as any,
});
