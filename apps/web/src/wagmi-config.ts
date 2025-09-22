import { createConfig, http, type Transport } from "wagmi";
import { localhost } from "wagmi/chains";

// Keep config simple and aligned with wagmi docs.
// Read an optional AMOY RPC from env to add a custom test chain.
const AMOY_RPC = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_ALCHEMY_AMOY_URL || process.env.ALCHEMY_AMOY_URL || "") : "";
const AMOY_CHAIN_ID = typeof process !== "undefined" ? Number(process.env.NEXT_PUBLIC_ALCHEMY_AMOY_CHAIN_ID || process.env.ALCHEMY_AMOY_CHAIN_ID || 137) : 137;

const baseChains = [localhost] as const;

// exportedChains should be a readonly array of chains compatible with wagmi
let exportedChains: readonly (typeof localhost | {
  id: number;
  name: string;
  network: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: string[] }; public: { http: string[] } };
  testnet: boolean;
})[] = baseChains as any;
if (AMOY_RPC) {
  const amoyChain = {
    id: AMOY_CHAIN_ID,
    name: "Polygon Amoy",
    network: "amoy",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: { default: { http: [AMOY_RPC].slice() }, public: { http: [AMOY_RPC].slice() } },
    testnet: false,
  };
  exportedChains = [...baseChains, amoyChain];
}

// transports: simple mapping from chainId -> http transport
const transports: Record<number, Transport> = {};
// local hardhat/ganache default
transports[1337] = http("http://127.0.0.1:8545");
if (AMOY_RPC) transports[AMOY_CHAIN_ID] = http(AMOY_RPC);

export const config = createConfig({
  chains: exportedChains as any,
  transports,
});

// Type declaration merging so wagmi hooks can infer our config types when used
declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

export { exportedChains as chains };
export default config;
