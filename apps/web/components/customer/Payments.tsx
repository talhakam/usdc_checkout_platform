"use client";

import React, { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { createClient } from "../../lib/database/createClientComponent";
import { useWalletClient, useWatchContractEvent } from "wagmi";
import { USDCPaymentHubAbi } from "../../src/abis/contracts";

const supabase = createClient();

interface PaymentRow { payment_id: string; merchant_wallet: string; total_amount: number; status?: string; created_at?: string }
interface Props { payments: PaymentRow[]; consumerAddress?: string }

export default function Payments({ payments, consumerAddress }: Props) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [sendingRefund, setSendingRefund] = useState(false);
  const [refundExists, setRefundExists] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  const [awaitingPaymentId, setAwaitingPaymentId] = useState<string | null>(null);

  const hubAddress = ((typeof window !== 'undefined' ? (window as unknown as { deployments?: Record<string, string> }).deployments : undefined)?.USDCPaymentHub) ||
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const checkExistingRefund = async (paymentId: string) => {
    if (!consumerAddress) return false;
    try {
      const { data, error } = await supabase.from('refund_requests').select('id').eq('payment_id', paymentId).limit(1);
      if (error) {
        console.error('failed to check refund existence', error);
        return false;
      }
      return Array.isArray(data) && data.length > 0;
    } catch (e) {
      console.error('checkExistingRefund error', e);
      return false;
    }
  };

  const openPaymentDetail = async (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setMsg(null);
    const exists = await checkExistingRefund(payment.payment_id);
    setRefundExists(!!exists);
    setDetailOpen(true);
  };

  // Watch RefundRequested events and insert into Supabase once emitted
  useWatchContractEvent({
    address: hubAddress as `0x${string}`,
    abi: USDCPaymentHubAbi as any,
    eventName: 'RefundRequested',
    args: {
      0: awaitingPaymentId as `0x${string}` | undefined
    },
    onLogs(logs) {
      console.log('RefundRequested logs', logs);
      if (logs && logs.length > 0) {
        // insert into supabase if not present
        (async () => {
          try {
            const pid = awaitingPaymentId as string;
            if (!pid || !consumerAddress) return;
            const { data: existing } = await supabase.from('refund_requests').select('id').eq('payment_id', pid).limit(1);
            if (!existing || existing.length === 0) {
              const refundAmount = selectedPayment && typeof selectedPayment.total_amount === 'number'
                ? selectedPayment.total_amount / 1.02
                : 0;
              await supabase.from('refund_requests').insert({ payment_id: pid, refund_amount: refundAmount, consumer_wallet: consumerAddress, merchant_wallet: selectedPayment?.merchant_wallet ?? '', reason: refundReason, status: 'requested' });
            } else {
              await supabase.from('refund_requests').update({ status: 'requested' }).eq('payment_id', pid);
            }

            setMsg('Refund requested on-chain and recorded');
            setRefundOpen(false);
            setDetailOpen(false);
            setSelectedPayment(null);
            setRefundReason('');
            setAwaitingPaymentId(null);
          } catch (e) {
            console.error('error inserting refund after event', e);
          }
        })();
      }
    }
  });

  const sendRefundRequest = async () => {
    if (!selectedPayment || !consumerAddress || !walletClient) return;
    setSendingRefund(true);
    setMsg(null);
    try {
      const exists = await checkExistingRefund(selectedPayment.payment_id);
      if (exists) {
        setRefundExists(true);
        setMsg('A refund has already been requested for this payment.');
        return;
      }

      // send the on-chain requestRefund transaction from the consumer wallet
      await (walletClient as any).writeContract({
        address: hubAddress as `0x${string}`,
        abi: USDCPaymentHubAbi as any,
        functionName: 'requestRefund',
        args: [selectedPayment.payment_id as `0x${string}`, refundReason]
      });

      // wait for RefundRequested event via watcher
      setAwaitingPaymentId(selectedPayment.payment_id);
      setMsg('Waiting for on-chain confirmation...');
    } catch (e) {
      console.error('sendRefundRequest error', e);
      setMsg('Failed to send on-chain refund request: ' + ((e as any)?.message || String(e)));
    } finally {
      setSendingRefund(false);
    }
  };

  return (
    <div className="space-y-2 mt-4">
      {payments.length === 0 && <div className="text-sm text-muted">No payments yet</div>}
      {payments.map((p) => (
        <div
          key={p.payment_id}
          role="button"
          tabIndex={0}
          onClick={() => openPaymentDetail(p)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPaymentDetail(p); }}
          className="flex justify-between p-3 rounded-lg border border-border bg-surface hover:scale-[1.01] transform-gpu transition-all cursor-pointer"
        >
          <div className="text-sm font-mono">{p.payment_id.slice(0, 10)}...</div>
          <div className="text-sm">{p.total_amount} mUSDC</div>
        </div>
      ))}

      <Modal open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedPayment(null); setMsg(null); }} title="Payment Details">
        {selectedPayment ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted">Payment ID</div>
                <div className="font-mono break-all">{selectedPayment.payment_id}</div>
              </div>
              <div>
                <div className="text-sm text-muted">Amount</div>
                <div className="font-semibold">{selectedPayment.total_amount} mUSDC</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted">Merchant Wallet</div>
              <div className="font-mono break-all">{selectedPayment.merchant_wallet}</div>
            </div>

            {msg && <div className="text-sm text-foreground">{msg}</div>}

            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 rounded-md bg-muted/50 text-foreground" onClick={() => { setDetailOpen(false); setSelectedPayment(null); setMsg(null); }}>Go Back</button>
              <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={() => { setRefundOpen(true); }}>Request Refund</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={refundOpen} onClose={() => { setRefundOpen(false); setRefundReason(''); setMsg(null); }} title="Request Refund">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-muted">Reason</label>
            <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="w-full p-2 bg-surface border border-border rounded-md text-foreground" />
          </div>

          {refundExists && <div className="text-sm text-foreground">A refund request already exists for this payment.</div>}
          {msg && <div className="text-sm text-foreground">{msg}</div>}

          <div className="flex justify-end space-x-2">
            <button className="px-4 py-2 rounded-md bg-red-600 text-foreground" onClick={() => { setRefundOpen(false); setRefundReason(''); setMsg(null); }}>Cancel</button>
            <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={sendRefundRequest} disabled={sendingRefund}>{sendingRefund ? 'Sending...' : 'Send Request'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
