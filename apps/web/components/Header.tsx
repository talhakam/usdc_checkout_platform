"use client";

import Link from "next/link";
import Button from "./ui/button";
import Container from "./ui/Container";
import IconButton from "./ui/IconButton";
import React, { useEffect, useState } from "react";

// use dynamic import to avoid hydration mismatch issues
import dynamic from "next/dynamic";
const WalletConnectButton = dynamic(() => import("./WalletConnectButton"), { ssr: false });
const ClientUserIcon = dynamic(() => import("./ClientUserIcon"), { ssr: false });

import { useAccount, usePublicClient } from "wagmi";
import { keccak256 } from "viem";
import { USDCPaymentHubAbi, Hub_hasRole } from "../src/abis/contracts";

export default function Header() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [dashboardHref, setDashboardHref] = useState<string>("/customer");

  useEffect(() => {
    (async () => {
      if (!address || !publicClient) return setDashboardHref("/customer");

      try {
        const deployments = await fetch('/deployments.json').then(r => r.json()).catch(() => ({}));
        const hubAddressRaw = deployments?.USDCPaymentHub;
        if (!hubAddressRaw) return setDashboardHref('/customer');
        const hubAddress = hubAddressRaw as `0x${string}`;

        // compute MERCHANT_ROLE hash
        const encoder = new TextEncoder();
        const merchantRole = keccak256(encoder.encode('MERCHANT_ROLE')) as `0x${string}`;

        const hasRoleAbi = Hub_hasRole ? [Hub_hasRole] : (USDCPaymentHubAbi as unknown as object[]);

        const has = await publicClient.readContract({
          address: hubAddress,
          abi: hasRoleAbi,
          functionName: 'hasRole',
          args: [merchantRole, address as `0x${string}`],
        });

        if (has) setDashboardHref('/merchant/dashboard');
        else setDashboardHref('/customer');
      } catch (e) {
        console.error('failed to check merchant role', e);
        setDashboardHref('/customer');
      }
    })();
  }, [address, publicClient]);

  return (
    <header className="w-full border-b border-border bg-surface/60 backdrop-blur-sm">
      <Container>
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Home" className="w-10 h-10 bg-gradient-to-r from-blue-600 to-sky-500 rounded-lg block shadow-inner" />
            <Link href="/" className="text-2xl text-foreground font-semibold">USDCPayment Hub</Link>
          </div>

          <div className="flex items-center space-x-3">
            {/* main navigation */}
            <nav className="hidden md:flex items-center space-x-3">
              <Link href="/merchant/register">
                <Button variant="secondary" size="md">Register Merchant</Button>
              </Link>

              <Link href={dashboardHref}>
                <Button variant="primary" size="md">Dashboard</Button>
              </Link>

              <Link href="/signin">
                <Button variant="ghost" size="md">Sign In</Button>
              </Link>

              <IconButton>
                <ClientUserIcon />
              </IconButton>
            </nav>

            {/* wallet connect slot (client-only header renders the WalletConnectButton directly) */}
            <div id="wallet-connect-slot" className="flex items-center">
              <WalletConnectButton />
            </div>
          </div>

        </div>
      </Container>
    </header>
  );
}
