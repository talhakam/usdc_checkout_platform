"use client";

import React from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "../src/wagmi-config";
// WalletSlot and HeaderWalletButton removed; Header will render WalletConnectButton directly

export default function Providers({ children }: { children: React.ReactNode }) {
  // create a single QueryClient instance for the client
  const [queryClient] = React.useState(() => new QueryClient());

  // Import the prebuilt wagmi config and use it directly.
  const wagmiConfig = config;

  React.useEffect(() => {
    // nothing required here: providers mount and child components will render inside them
    return undefined;
  }, []);

  return (
  <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


