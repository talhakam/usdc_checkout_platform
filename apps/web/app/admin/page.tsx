"use client";

import React, { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { keccak256 } from "viem";
// Header was imported earlier but not required in this page — keep layout minimal
import Link from "next/link";
import AdminDashboard from "../../components/AdminDashboard";
import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/button";
import { USDCPaymentHubAbi, Hub_hasRole } from "../../src/abis/contracts";

const toAddress = (a: string) => a as `0x${string}`;

export default function AdminPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      if (!publicClient || !address) return setIsAdmin(false);
      try {
        // read deployments to get hub address
        const deployments = await fetch('/deployments.json').then(r => r.json());
        const hubAddressRaw = deployments?.USDCPaymentHub;
        if (!hubAddressRaw) {
          console.error('deployments.json is missing USDCPaymentHub');
          return setIsAdmin(false);
        }
        const hubAddress = toAddress(hubAddressRaw as string);

        // Ensure the address hosts contract code
        const code = await publicClient.getCode({ address: hubAddress });
        if (!code || code === '0x' || code === '0x0') {
          console.error('address has no contract code', hubAddress, code);
          return setIsAdmin(false);
        }

        // Compute ADMIN_ROLE locally (keccak256 of the string) instead of calling the contract constant
        const encoder = new TextEncoder();
        const adminRole = keccak256(encoder.encode('ADMIN_ROLE')) as `0x${string}`;
        console.debug('computed adminRole', adminRole);

  const hasRoleAbi = Hub_hasRole ? [Hub_hasRole] : (USDCPaymentHubAbi as unknown as object[]);

        const hasRaw = await publicClient.readContract({
          address: hubAddress,
          abi: hasRoleAbi,
          functionName: 'hasRole',
          args: [adminRole, toAddress(address as string)],
        });

        console.debug('hasRole raw', hasRaw);

        const has = Boolean(hasRaw);
        setIsAdmin(Boolean(has));
      } catch (e) {
        console.error('admin check failed', e);
        setIsAdmin(false);
      }
    })();
  }, [publicClient, address]);

  if (isAdmin === null) return (
    <Container>
      <div className="py-10">
        <Card>
          <div className="p-6">Checking admin role...</div>
        </Card>
      </div>
    </Container>
  );

  if (isAdmin === false) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center p-8">
          <Card className="max-w-xl w-full">
            <h2 className="text-2xl font-semibold mb-4">Access denied</h2>
            <p className="mb-6">Your connected wallet is not an admin for this platform.</p>
            <div className="flex gap-3">
              <Link href="/">
                <Button variant="secondary">Back to landing</Button>
              </Link>
            </div>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <div>
      <AdminDashboard />
    </div>
  );
}
