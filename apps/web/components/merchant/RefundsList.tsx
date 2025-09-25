"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import { createClient } from "../../lib/database/createClientComponent";
import { useAccount, useWalletClient, useWatchContractEvent } from "wagmi";
import { USDCPaymentHubAbi, MockUSDCAbi } from "../../src/abis/contracts";
import { parseUnits } from "viem";

const supabase = createClient();

interface RefundRow { id: string; payment_id: string; refund_amount: number; consumer_wallet: string; merchant_wallet: string; reason?: string; status?: string; created_at?: string }

export default function RefundsList() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const [selected, setSelected] = useState<RefundRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [awaitingPaymentId, setAwaitingPaymentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hubAddress = process.env.NEXT_PUBLIC_USDCPAYMENTHUB_ADDRESS as string;

  useEffect(() => {
    (async () => {
      if (!address) return;
      const { data } = await supabase.from('refund_requests').select('id,payment_id,refund_amount,consumer_wallet,merchant_wallet,reason,status,created_at').eq('merchant_wallet', address).order('created_at', { ascending: false }).limit(50);
      if (data) setRefunds(data as RefundRow[]);
    })();
  }, [address]);

  const refresh = async () => {
    if (!address) return;
    const { data } = await supabase.from('refund_requests').select('id,payment_id,refund_amount,consumer_wallet,merchant_wallet,reason,status,created_at').eq('merchant_wallet', address).order('created_at', { ascending: false }).limit(50);
    if (data) setRefunds(data as RefundRow[]);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return refunds;
    return refunds.filter(r => r.status === filter);
  }, [refunds, filter]);

  const openDetail = (r: RefundRow) => {
    setSelected(r);
    setMessage(null);
    setDetailOpen(true);
  };

  // watch RefundIssued events and react when the matching paymentId is emitted
  useWatchContractEvent({
  address: hubAddress as `0x${string}`,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ABI fragment, safe to cast
  abi: USDCPaymentHubAbi as any,
    eventName: 'RefundIssued',
    args: {
        0: awaitingPaymentId as `0x${string}` | undefined
    },
    onLogs(logs) {
        console.log('RefundIssued event logs', logs);
        if (logs && logs.length > 0) {
          // handle asynchronously: update DB and local state for each emitted event
          (async () => {
            try {
              for (const l of logs) {
                // try to read paymentId from parsed args, fallback to topics (indexed)
                let paymentId: string | undefined;
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- log shape varies by provider
                  const anyLog = l as any;
                  if (anyLog.args) {
                    paymentId = anyLog.args[0] ?? anyLog.args.paymentId;
                  }
                  if (!paymentId && anyLog.topics && anyLog.topics.length > 1) {
                    // topics[1] is the indexed paymentId (bytes32)
                    paymentId = anyLog.topics[1];
                  }
                } catch (e) {
                  console.warn('could not parse log paymentId', e);
                }

                // if we still don't have a paymentId, try awaitingPaymentId as a last resort
                if (!paymentId) paymentId = awaitingPaymentId ?? undefined;
                if (!paymentId) continue;

                // normalize paymentId to string
                paymentId = String(paymentId);

                // Update Supabase record for this payment id to 'refunded'
                try {
                  const { error } = await supabase.from('refund_requests').update({ status: 'refunded' }).eq('payment_id', paymentId);
                  if (error) console.error('Failed to update refund_requests status in Supabase', error);
                } catch (e) {
                  console.error('Supabase update threw', e);
                }

                // Update in-memory list so UI updates immediately
                setRefunds(prev => prev.map(r => r.payment_id === paymentId ? { ...r, status: 'refunded' } : r));
              }

              setMessage('Refund issued on-chain successfully!');
              setAwaitingPaymentId(null);
            } catch (e) {
              console.error('onLogs handler error', e);
            } finally {
              // refresh from Supabase to ensure canonical state
              try { await refresh(); } catch (e) { console.warn('refresh failed', e); }
            }
          })();
        }
    }
  });

  const issueRefundOnChain = async () => {
    if (!selected || !walletClient) return;
    setSending(true);
    setMessage(null);
    try {
      const amountUnits = BigInt(Math.floor(selected.refund_amount * 1_000_000 / 1.02));

      // First, ensure the hub is approved to pull funds from merchant wallet.
      const mockAddress = process.env.NEXT_PUBLIC_MOCKUSDC_ADDRESS as string;

      try {
        // call approve from merchant wallet — this will prompt the wallet to approve
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- walletClient typing varies at runtime
        await (walletClient as any).writeContract({
          address: mockAddress as `0x${string}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ABI fragment, safe to cast
          abi: MockUSDCAbi as any,
          functionName: 'approve',
          args: [hubAddress as `0x${string}`, amountUnits]
        });
      } catch (e) {
        console.error('approve failed', e);
        setMessage('Token approval failed or was rejected. The merchant must approve the hub to move funds before issuing a refund.');
        setSending(false);
        return;
      }

      // Now call merchantRefund on the hub
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- walletClient typing varies at runtime
      await (walletClient as any).writeContract({
        address: hubAddress as `0x${string}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ABI fragment, safe to cast
        abi: USDCPaymentHubAbi as any,
        functionName: 'merchantRefund',
        args: [selected.payment_id as `0x${string}`, amountUnits]
      });

      setAwaitingPaymentId(selected.payment_id);
      setMessage('Waiting for on-chain confirmation...');
    } catch (e) {
      console.error('issueRefundOnChain error', e);
      setMessage('Failed to send refund transaction. Check console for error.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Refund Requests</h3>
        <div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-surface/80 text-background border border-border rounded p-1">
            <option value="all">All</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        {filtered.length === 0 && <div className="text-sm text-muted">No refund requests</div>}
        {filtered.map(r => (
          <div key={r.id}
            role="button"
            tabIndex={0}
            onClick={() => openDetail(r)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openDetail(r); }}
            className="p-3 border border-border rounded bg-surface/50 hover:scale-[1.01] transform-gpu transition-all cursor-pointer"
          >
            <div className="flex justify-between">
              <div className="text-sm">{r.payment_id.slice(0, 10)}...</div>
              <div className="text-sm">{r.status}</div>
            </div>
            <div className="text-sm text-muted mt-1">{r.refund_amount} mUSDC · {r.consumer_wallet.slice(0, 8)}...</div>
            {r.reason && <div className="text-sm mt-1">Reason: {r.reason}</div>}
          </div>
        ))}
      </div>

      <Modal open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null); setMessage(null); }} title="Refund Request Details">
        {selected ? (
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted">Payment ID</div>
              <div className="font-mono break-all">{selected.payment_id}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted">Amount</div>
                <div className="font-semibold">{selected.refund_amount} mUSDC</div>
              </div>
              <div>
                <div className="text-sm text-muted">Status</div>
                <div className="font-semibold">{selected.status}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted">Consumer Wallet</div>
              <div className="font-mono break-all">{selected.consumer_wallet}</div>
            </div>
            {selected.reason && <div>
              <div className="text-sm text-muted">Reason</div>
              <div className="text-sm">{selected.reason}</div>
            </div>}

            {message && <div className="text-sm text-foreground">{message}</div>}

            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 rounded-md bg-muted/50 text-foreground" onClick={() => { setDetailOpen(false); setSelected(null); setMessage(null); }}>Go Back</button>
              <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={issueRefundOnChain} disabled={sending || !!awaitingPaymentId}>{sending || awaitingPaymentId ? 'Processing...' : 'Issue Refund'}</button>
            </div>
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}
