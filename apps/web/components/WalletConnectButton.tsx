"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletConnectButton() {
  // Providers now mount Wagmi/RainbowKit so it's safe to render the ConnectButton.
  return <ConnectButton />;
}
