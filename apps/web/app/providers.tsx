"use client";

import React from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "../src/wagmi-config";

export default function Providers({ children }: { children: React.ReactNode }) {
  // create a single QueryClient instance for the client
  const [queryClient] = React.useState(() => new QueryClient());

  // The wagmi config (including transports) is created in `src/wagmi-config`
  // and exported as passive data. Providers simply import the prebuilt
  // config and pass it to WagmiProvider.
  // Import the prebuilt wagmi config and use it directly.
  const wagmiConfig = config;

  React.useEffect(() => {
    // No global readiness marker needed — providers are mounted here and
    // components can rely on WagmiProvider being available after mount.
    return undefined;
  }, []);

  return (
  <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


