"use client";

import React, { useEffect, useState } from "react";
import Card from "./ui/Card";
import Modal from "./ui/Modal";
import { createClient } from "../lib/database/createClientComponent";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { MockUSDCAbi, USDCPaymentHubAbi } from "../src/abis/contracts";
import { keccak256, parseUnits } from "viem";

const supabase = createClient();

interface MerchantRow { id: string; name: string; wallet: string; store_url?: string | null; isRegistered?: boolean }
interface PaymentRow { payment_id: string; merchant_wallet: string; total_amount: number; status?: string }
interface RefundRow { id: string; payment_id: string; refund_amount: number; status?: string }

function randomPaymentId(merchant: string, customer: string) {
  // use keccak256 over current time + wallets for a reasonably unique id
  const data = `${merchant.toLowerCase()}|${customer.toLowerCase()}|${Date.now()}`;
  return keccak256(new TextEncoder().encode(data));
}

export default function CustomerDashboard() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [mockBalance, setMockBalance] = useState<string>("0.000000");
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [selectedMerchant, setSelectedMerchant] = useState<MerchantRow | null>(null);
  const [checkoutAmount, setCheckoutAmount] = useState<string>("1.0");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // load merchants from supabase
    (async () => {
      const { data } = await supabase.from("merchants").select("id,name,wallet,store_url,isRegistered").eq("isRegistered", true);
      if (data) setMerchants(data as MerchantRow[]);
    })();

    // load refund requests for the current customer (server: refund_requests table)
      (async () => {
        if (!address) return;
        const { data } = await supabase.from("refund_requests").select("id,payment_id,refund_amount,status,created_at").eq("consumer_wallet", address);
        if (data) setRefunds(data as RefundRow[]);
      })();
  }, [address]);

  useEffect(() => {
    // fetch mock usdc balance from MockUSDC contract
    (async () => {
      if (!address || !publicClient) return;
      try {
        setBalanceLoading(true);
  const mockAddress = ((window as unknown as { deployments?: Record<string, string> }).deployments?.MockUSDC) || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        // get raw balance (uint256)
        const raw = await publicClient.readContract({
          address: mockAddress as `0x${string}`,
          abi: MockUSDCAbi,
          functionName: "balanceOf",
          args: [address],
        });

        // MockUSDC uses 6 decimals
        const decimals = 6;
        // raw may be a bigint
  const value = typeof raw === 'bigint' ? raw : BigInt(String(raw));
        const human = Number(value) / 10 ** decimals;
        setMockBalance(human.toFixed(decimals));
      } catch (err) {
        console.error("failed to read mock balance", err);
      } finally {
        setBalanceLoading(false);
      }
    })();
  }, [address, publicClient]);

  useEffect(() => {
    // placeholder: fetch payments from chain events or orders table
    (async () => {
      if (!address) return;
      // try to get orders from supabase orders table
      const { data } = await supabase.from("orders").select("payment_id,merchant_wallet,total_amount,status,created_at").eq("consumer_wallet", address);
      if (data) setPayments(data as PaymentRow[]);
    })();
  }, [address]);

  // mockBalance state is populated from chain

  async function handleOpenCheckout(merchant: { id: string; name: string; wallet: string }) {
    setSelectedMerchant(merchant);
    setCheckoutOpen(true);
  }

  async function handleCheckout() {
    if (!selectedMerchant || !address || !walletClient) return;
    setLoading(true);
    try {
      const paymentId = randomPaymentId(selectedMerchant.wallet, address);
      const amount = parseUnits(checkoutAmount, 6); // MockUSDC uses 6 decimals

      // 1) approve MockUSDC
  const mockAddress = ((window as unknown as { deployments?: Record<string, string> }).deployments?.MockUSDC) || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const hubAddress = ((window as unknown as { deployments?: Record<string, string> }).deployments?.USDCPaymentHub) || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

      await (walletClient as unknown as { writeContract: (...args: unknown[]) => Promise<unknown> }).writeContract({
        address: mockAddress as `0x${string}`,
        abi: MockUSDCAbi as unknown[],
        functionName: "approve",
        args: [hubAddress as `0x${string}`, amount],
        chain: null,
      });

      // 2) call checkout on hub
      await (walletClient as unknown as { writeContract: (...args: unknown[]) => Promise<unknown> }).writeContract({
        address: hubAddress as `0x${string}`,
        abi: USDCPaymentHubAbi as unknown[],
        functionName: "checkout",
        args: [paymentId as `0x${string}`, selectedMerchant.wallet as `0x${string}`, amount],
        chain: null,
      });

      // 3) record order in Supabase via internal API route
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, consumer_wallet: address, merchant_wallet: selectedMerchant.wallet, total_amount: Number(checkoutAmount) }),
      });

  if (!res.ok) throw new Error("Failed to record order");

      // refresh payments
      const { data } = await supabase.from("orders").select("payment_id,merchant_wallet,total_amount,status,created_at").eq("consumer_wallet", address);
      if (data) setPayments(data as any[]); // eslint-disable-line @typescript-eslint/no-explicit-any -- supabase typing issue

      alert("Checkout successful!");

      setCheckoutOpen(false);
    } catch (err) {
      console.error(err);
      alert((err as any)?.message || "Checkout failed"); // eslint-disable-line @typescript-eslint/no-explicit-any -- err typing
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <h3 className="text-sm text-gray-500">Balance</h3>
          <div className="text-2xl font-medium">{balanceLoading ? 'Loading...' : `${mockBalance} mUSDC`}</div>
        </Card>

        <Card>
          <h3 className="text-sm text-gray-500">Payments</h3>
          <div className="space-y-2 mt-4">
            {payments.length === 0 && <div className="text-sm text-gray-500">No payments yet</div>}
            {payments.map((p) => (
              <div key={p.payment_id} className="flex justify-between">
                <div className="text-sm">{p.payment_id.slice(0, 10)}...</div>
                <div className="text-sm">{p.total_amount} mUSDC</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm text-gray-500">Refund Requests</h3>
          <div className="space-y-2 mt-4">
            {refunds.length === 0 && <div className="text-sm text-gray-500">No refund requests</div>}
            {refunds.map((r) => (
              <div key={r.id} className="flex justify-between">
                <div className="text-sm">{r.payment_id.slice(0, 8)}...</div>
                <div className="text-sm">{r.status}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-medium">Available Merchants</h3>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {merchants.map((m) => (
            <div key={m.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-gray-500">{m.store_url}</div>
                </div>
                <div>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => handleOpenCheckout(m)}>
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title={selectedMerchant?.name || "Checkout"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Amount (mUSDC)</label>
            <input value={checkoutAmount} onChange={(e) => setCheckoutAmount(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Platform fee: 2%</div>
            <div className="text-sm text-gray-800">Total: {(Number(checkoutAmount) * 1.02).toFixed(6)} mUSDC</div>
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-gray-200 rounded mr-2" onClick={() => setCheckoutOpen(false)} disabled={loading}>Cancel</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleCheckout} disabled={loading}>{loading ? 'Processing...' : 'Pay'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
