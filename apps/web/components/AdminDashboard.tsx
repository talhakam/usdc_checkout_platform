"use client";

import React, { useEffect, useState } from "react";
import { usePublicClient, useWalletClient, useAccount } from "wagmi";
import { parseUnits, keccak256 } from "viem";
import { MockUSDCAbi, USDCPaymentHubAbi } from "../src/abis/contracts";
import supabase from "../lib/supabaseClient";
import Container from "./ui/Container";
import Card from "./ui/Card";
import Button from "./ui/button";
import Modal from "./ui/Modal";

type MerchantRow = { id: string; name: string; store_url: string; wallet: string; kyc_url?: string | null; isRegistered?: boolean };

type Deployments = { MockUSDC?: string; USDCPaymentHub?: string } | null;

declare global {
  interface Window {
    DEPLOYMENTS?: Deployments;
  }
}

const toAddress = (a: string) => a as `0x${string}`;

function useDeployments() {
  const [d, setD] = useState<Deployments>(null);
  useEffect(() => {
    fetch("/deployments.json")
      .then((r) => r.json() as Promise<Deployments>)
      .then((j) => setD(j))
      .catch(() => {
        if (typeof window !== "undefined" && window.DEPLOYMENTS) setD(window.DEPLOYMENTS);
      });
  }, []);
  return d;
}

export default function AdminDashboard() {
  // No wagmi-ready gating here; Providers wrap the app so wagmi hooks are safe to use.

  const deployments = useDeployments();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [mintAddress, setMintAddress] = useState("");
  const [mintAmount, setMintAmount] = useState("100");
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantRow | null>(null);
  const [approving, setApproving] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type?: 'info' | 'success' | 'error' }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('merchants').select('id,name,store_url,wallet,kyc_url,isRegistered');
        setMerchants((data as MerchantRow[]) || []);
      } catch (e: unknown) {
        console.error('fetch merchants failed', e);
      }
    })();
  }, []);

  const mint = async () => {
    if (!deployments?.MockUSDC || !walletClient || !publicClient) return alert("Connect and ensure MockUSDC is deployed");
    try {
      const faucetAbi = (MockUSDCAbi as unknown[]).find((i) => (i as { name?: string })?.name === "faucet") ?? MockUSDCAbi;
      const to = mintAddress || address || toAddress("0x0000000000000000000000000000000000000000");
      const amt = parseUnits(mintAmount || "100", 6);
      await (walletClient as unknown as { writeContract: (args: unknown) => Promise<unknown> }).writeContract({ address: toAddress(deployments.MockUSDC), abi: [faucetAbi as unknown as object], functionName: "faucet", args: [toAddress(to), amt], chain: null });
      alert(`Faucet minted ${mintAmount} USDC to ${to}`);
    } catch (e) {
      alert("mint failed: " + String(e));
    }
  };

  return (
    <Container>
      <div className="py-12">
        {/* Toasts */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div key={t.id} className={"px-4 py-2 rounded shadow-md " + (t.type === 'success' ? 'bg-green-50 text-green-800' : t.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800')}>{t.message}</div>
          ))}
        </div>
        <header className="mb-8">
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Admin tools for managing the platform and contracts.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h2 className="text-xl font-medium mb-2">Merchant Requests</h2>
            <p className="text-sm text-gray-600">Merchants that have registered but are not yet approved.</p>
            <div className="mt-4 space-y-2">
              {merchants?.filter(m => !m.isRegistered).length === 0 && <div className="text-sm text-gray-500">No pending merchant requests</div>}
              <ul className="space-y-2">
                {merchants?.filter(m => !m.isRegistered).map((m) => (
                  <li key={m.id} className="flex items-center justify-between border p-3 rounded">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.store_url}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => setSelectedMerchant(m)} variant="secondary" size="sm">View</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-medium mb-2">Requests</h2>
            <p className="text-sm text-gray-600">Platform requests and approvals (coming soon)</p>
          </Card>

          <Card>
            <h2 className="text-xl font-medium mb-2">Faucet</h2>
            <p className="text-sm text-gray-600">Mint test USDC or distribute tokens for testing.</p>
            <div className="mt-4 space-y-2">
              <label className="block text-sm text-gray-600">Recipient address</label>
              <input value={mintAddress} onChange={(e) => setMintAddress(e.target.value)} className="w-full p-2 border rounded" placeholder="0x... (leave blank to mint to connected wallet)" />
              <label className="block text-sm text-gray-600 mt-2">Amount</label>
              <input value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} className="w-full p-2 border rounded" />
              <div className="mt-2">
                <Button onClick={mint} variant="primary" size="md">Mint USDC</Button>
              </div>
            </div>
          </Card>
        </section>

        <Modal open={!!selectedMerchant} onClose={() => setSelectedMerchant(null)} title={selectedMerchant ? `Merchant — ${selectedMerchant.name}` : undefined}>
          {selectedMerchant && (
            <div>
              <div className="mb-4">
                <div className="text-sm text-gray-500">Store URL</div>
                <div className="font-medium">{selectedMerchant.store_url}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-gray-500">Wallet</div>
                <div className="font-mono text-sm">{selectedMerchant.wallet}</div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="primary" size="md" onClick={async () => {
                  if (!selectedMerchant) return;
                  // Ensure wallet and public client are available before attempting on-chain actions
                  if (!walletClient || !publicClient) {
                    setToasts((t) => t.concat([{ id: String(Date.now()), message: 'Connect your wallet and ensure provider is ready', type: 'error' }]));
                    return;
                  }
                    try {
                      setApproving(true);

                      // Optimistic UI: mark merchant as registered locally immediately
                      setMerchants((prev) => prev.map((m) => (m.id === selectedMerchant.id ? { ...m, isRegistered: true, _optimistic: true } : m)));
                      const toastId = String(Date.now());
                      setToasts((t) => [...t, { id: toastId, message: 'Approving merchant on-chain...', type: 'info' }]);

                      // call registerMerchant on the hub contract
                      const hubAddress = (await fetch('/deployments.json').then((r) => r.json())).USDCPaymentHub as string;
                      const txResult = await (walletClient as unknown as { writeContract: (...args: unknown[]) => Promise<unknown> })?.writeContract({
                        address: hubAddress as `0x${string}`,
                        abi: (USDCPaymentHubAbi as unknown[]),
                        functionName: 'registerMerchant',
                        args: [toAddress(selectedMerchant.wallet)] as unknown[],
                        chain: null,
                      });

                      // extract tx hash
                      let txHash: string | undefined;
                      if (typeof txResult === 'string') txHash = txResult;
                      else if (txResult && typeof txResult === 'object') {
                        const resObj = txResult as Record<string, unknown>;
                        if ('hash' in resObj) txHash = String(resObj.hash);
                      }
                      if (!txHash) {
                        // fallback: wait a little and then try on-chain confirm via hasRole
                        throw new Error('No transaction hash returned from wallet');
                      }

                      // wait for receipt by polling
                      // capture local non-null alias so TypeScript knows it's defined in nested functions
                      const pc = publicClient;

                      const waitForReceipt = async (hash: string, timeoutMs = 60000) => {
                        const start = Date.now();
                        while (Date.now() - start < timeoutMs) {
                          try {
                            const receipt = await pc.getTransactionReceipt({ hash: hash as `0x${string}` });
                            if (receipt && typeof receipt.status !== 'undefined') return receipt;
                          } catch (e) {
                            console.error(e);
                          }
                          await new Promise((r) => setTimeout(r, 1500));
                        }
                        throw new Error('Transaction receipt timeout');
                      };

                      const receipt = await waitForReceipt(txHash);

                      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- narrow, intentional cast to handle provider-specific receipt types
                      if (!receipt || (receipt as any).status !== 'success') {
                        // revert optimistic change
                        setMerchants((prev) => prev.map((m) => (m.id === selectedMerchant.id ? { ...m, isRegistered: false, _optimistic: false } : m)));
                        setToasts((t) => t.concat([{ id: String(Date.now()), message: 'Transaction failed', type: 'error' }]));
                        throw new Error('Transaction failed');
                      }

                      // always double-check with on-chain hasRole
                      const merchantRole = keccak256(new TextEncoder().encode('MERCHANT_ROLE')) as `0x${string}`;
                      const hasRaw = await pc.readContract({
                        address: toAddress(hubAddress),
                        abi: USDCPaymentHubAbi as unknown[],
                        functionName: 'hasRole',
                        args: [merchantRole, toAddress(selectedMerchant.wallet)],
                      });

                      if (!hasRaw) {
                        // revert optimistic change
                        setMerchants((prev) => prev.map((m) => (m.id === selectedMerchant.id ? { ...m, isRegistered: false, _optimistic: false } : m)));
                        setToasts((t) => t.concat([{ id: String(Date.now()), message: 'On-chain verification failed', type: 'error' }]));
                        throw new Error('On-chain role verification failed');
                      }

                      // mark merchant as registered in supabase only after on-chain confirmation
                      // Wrap supabase with an `unknown`-based helper so we can call update
                      // without hitting the generated `never` type on the client. This
                      // avoids using `any` (which ESLint would flag) while letting us
                      // bypass the incorrect `never` constraint caused by the client types.
                      const _sup = supabase as unknown as {
                        from: (table: string) => {
                          update: (payload: unknown) => {
                            eq: (col: string, val: unknown) => Promise<unknown>
                          }
                        }
                      };
                      await _sup.from('merchants').update({ isRegistered: true }).eq('id', selectedMerchant.id);
                      // refresh merchants list
                      const { data } = await supabase.from('merchants').select('id,name,store_url,wallet,kyc_url,isRegistered');
                      setMerchants((data as MerchantRow[]) || []);
                      setSelectedMerchant(null);

                      // update toast to success
                      setToasts((t) => t.concat([{ id: String(Date.now()), message: 'Merchant approved on-chain', type: 'success' }]));
                    } catch (e) {
                      console.error('approve failed', e);
                      setToasts((t) => t.concat([{ id: String(Date.now()), message: 'Approve failed: ' + String(e), type: 'error' }]));
                      alert('Approve failed: ' + String(e));
                    } finally {
                      setApproving(false);
                      // clear info toast after some time
                      setTimeout(() => setToasts((t) => t.filter((x) => x.type !== 'info')), 3000);
                    }
                }}>{approving ? 'Approving...' : 'Approve Merchant'}</Button>
                <Button variant="secondary" size="md" onClick={() => setSelectedMerchant(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Container>
  );
}
