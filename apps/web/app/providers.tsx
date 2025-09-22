"use client";

import React from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import config, { chains } from "../src/wagmi-config";

export default function Providers({ children }: { children: React.ReactNode }) {
  // create a single QueryClient instance for the client
  const [queryClient] = React.useState(() => new QueryClient());

  React.useEffect(() => {
    // No global readiness marker needed — providers are mounted here and
    // components can rely on WagmiProvider being available after mount.
    return undefined;
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Providers mount WagmiProvider and QueryClientProvider so client components
// can safely use wagmi hooks — no global marker required.
