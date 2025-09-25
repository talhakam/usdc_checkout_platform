"use client";

import React, { useEffect, useState } from "react";
import Card from "./ui/Card";
import Modal from "./ui/Modal";
import Payments from "./customer/Payments";
import MerchantsList from "./customer/MerchantsList";
import RefundsList from "./customer/RefundsList";
import { createClient } from "../lib/database/createClientComponent";
import { useAccount, useWalletClient, useBalance, useWatchContractEvent } from "wagmi";
import { MockUSDCAbi, USDCPaymentHubAbi } from "../src/abis/contracts";
import { keccak256 } from "viem";

const supabase = createClient();

interface MerchantRow { id: string; name: string; wallet: string; store_url?: string | null; isRegistered?: boolean }
interface PaymentRow { payment_id: string; merchant_wallet: string; total_amount: number; status?: string }
interface RefundRow { id: string; payment_id: string; refund_amount: number; status?: string }

function randomPaymentId(merchant: string, customer: string) {
  const data = `${merchant.toLowerCase()}|${customer.toLowerCase()}|${Date.now()}`;
  return keccak256(new TextEncoder().encode(data));
}

export default function CustomerDashboard() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [refunds, setRefunds] = useState<RefundRow[]>([]);

  // payment/refund modal state moved into Payments component

  const [selectedMerchant, setSelectedMerchant] = useState<MerchantRow | null>(null);
  const [checkoutAmount, setCheckoutAmount] = useState<string>("1.0");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("merchants").select("id,name,wallet,store_url,isRegistered").eq("isRegistered", true);
      if (data) setMerchants(data as MerchantRow[]);
    })();

    (async () => {
      if (!address) return;
      const { data } = await supabase.from("refund_requests").select("id,payment_id,refund_amount,status,created_at").eq("consumer_wallet", address);
      if (data) setRefunds(data as RefundRow[]);
    })();
  }, [address]);

  const mockTokenAddress = process.env.NEXT_PUBLIC_MOCKUSDC_ADDRESS as string;

  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    token: mockTokenAddress as `0x${string}`
  });

  // ...existing code...

  useEffect(() => {
    (async () => {
      if (!address) return;
      const { data } = await supabase.from("orders").select("payment_id,merchant_wallet,total_amount,status,created_at").eq("consumer_wallet", address);
      if (data) setPayments(data as PaymentRow[]);
    })();
  }, [address]);

  // payment/refund logic is handled in the Payments component

  const hubAddress = process.env.NEXT_PUBLIC_USDCPAYMENTHUB_ADDRESS as string;

  useWatchContractEvent({
    address: hubAddress as `0x${string}`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ABI fragment, safe to cast
    abi: USDCPaymentHubAbi as any,
    eventName: 'PaymentProcessed',
    args: {
      1: address?.toLowerCase()
    },
    onLogs(logs) {
      console.debug('PaymentProcessed', logs);
      (async () => {
        if (!address) return;
        try {
          const { data } = await supabase.from("orders").select("payment_id,merchant_wallet,total_amount,status,created_at").eq("consumer_wallet", address);
          if (data) setPayments(data as PaymentRow[]);
        } catch (e) {
          console.error('failed to refresh after PaymentProcessed', e);
        }
      })();
    }
  });

  function handleOpenCheckout(merchant: { id: string; name: string; wallet: string }) {
    setSelectedMerchant(merchant);
    setCheckoutOpen(true);
  }

  async function handleCheckout() {
    if (!selectedMerchant || !address || !walletClient) return;
    setLoading(true);
    try {
      const paymentId = randomPaymentId(selectedMerchant.wallet, address);
      const amount = BigInt(Math.floor(Number(checkoutAmount) * 1_000_000 * 1.02)); // include 2% platform fee

  const mockAddress = mockTokenAddress;
  const hubAddr = hubAddress;

      // approve
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ABI fragment, safe to cast
      await (walletClient as unknown as { writeContract: (...args: unknown[]) => Promise<unknown> }).writeContract({
        address: mockAddress as `0x${string}`,
        abi: MockUSDCAbi as any, // eslint-disable-line @typescript-eslint/no-explicit-any -- ABI fragment, safe to cast
        functionName: 'approve',
        args: [hubAddr as `0x${string}`, amount]
      });

      // checkout

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ABI fragment, safe to cast
      await (walletClient as unknown as { writeContract: (...args: unknown[]) => Promise<unknown> }).writeContract({
        address: hubAddr as `0x${string}`,
        abi: USDCPaymentHubAbi as any, // eslint-disable-line @typescript-eslint/no-explicit-any -- ABI fragment, safe to cast
        functionName: 'checkout',
        args: [paymentId as `0x${string}`, selectedMerchant.wallet as `0x${string}`, amount]
      });

      // record order immediately; UI will refresh when PaymentProcessed is emitted
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId as string, consumer_wallet: address, merchant_wallet: selectedMerchant.wallet, total_amount: Number(checkoutAmount) * 1.02 })
      });
      if (!res.ok) throw new Error('Failed to record order');

      const { data: refreshed } = await supabase.from('orders').select('payment_id,merchant_wallet,total_amount,status,created_at').eq('consumer_wallet', address);
      if (refreshed) setPayments(refreshed as PaymentRow[]);

      alert('Checkout submitted — waiting for on-chain confirmation');
      setCheckoutOpen(false);
    } catch (e) {
      console.error(e);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- provider error typing
  alert((e as any)?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <h3 className="text-sm text-muted">Balance</h3>
          <div className="text-2xl font-medium">
            {balanceLoading ? 'Loading...' : balanceData ? `${balanceData.formatted} ${balanceData.symbol || 'mUSDC'}` : '0.000000 mUSDC'}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm text-muted">Payments</h3>
          <Payments payments={payments} consumerAddress={address} />
        </Card>

        <Card>
          <h3 className="text-sm text-muted">Refund Requests</h3>
          <RefundsList refunds={refunds} />
        </Card>
      </div>

        <Card>
          <h3 className="text-lg font-medium">Available Merchants</h3>
          <MerchantsList merchants={merchants} onCheckout={handleOpenCheckout} />
        </Card>

      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title={selectedMerchant?.name || "Checkout"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted">Amount (mUSDC)</label>
            <input value={checkoutAmount} onChange={(e) => setCheckoutAmount(e.target.value)} className="mt-1 block w-full border border-border rounded p-2 bg-surface text-foreground" />
          </div>
          <div>
            <div className="text-sm text-muted">Platform fee: 2%</div>
            <div className="text-sm text-foreground">Total: {(Number(checkoutAmount) * 1.02).toFixed(6)} mUSDC</div>
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-surface/80 text-foreground rounded mr-2 border border-border" onClick={() => setCheckoutOpen(false)} disabled={loading}>Cancel</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleCheckout} disabled={loading}>{loading ? 'Processing...' : 'Pay'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
