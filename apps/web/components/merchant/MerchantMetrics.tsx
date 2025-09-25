"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import { createClient } from "../../lib/database/createClientComponent";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { USDCPaymentHubAbi } from "../../src/abis/contracts";

const supabase = createClient();

interface OrderRow { payment_id: string; merchant_wallet: string; total_amount: number; status?: string }

export default function MerchantMetrics() {
  const { address } = useAccount();
  const [payments, setPayments] = useState<OrderRow[]>([]);

  // Read platform fee bps from the on-chain hub contract to compute estimated net
  const hubAddress = process.env.NEXT_PUBLIC_USDCPAYMENTHUB_ADDRESS as string;

  const { data: feeBpsData } = useReadContract({
    address: hubAddress as `0x${string}`,
    abi: USDCPaymentHubAbi as unknown[],
    functionName: 'platformFeeBps',
  });

  useEffect(() => {
    (async () => {
      if (!address) return;
      const { data } = await supabase.from('orders').select('payment_id,merchant_wallet,total_amount,status,created_at').eq('merchant_wallet', address).order('created_at', { ascending: false });
      if (data) setPayments(data as OrderRow[]);
    })();
  }, [address]);

  // On-chain mock USDC balance for the connected merchant (shows token balance)
  const mockTokenAddress = process.env.NEXT_PUBLIC_MOCKUSDC_ADDRESS as string;

  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    token: mockTokenAddress as `0x${string}`,
  });

  const totalPayments = payments.length;

  const totalSalesFromOrders = useMemo(() => payments.reduce((s, p) => s + Number(p.total_amount || 0), 0), [payments]);

  const feeBps = feeBpsData ? Number(feeBpsData) : undefined;
  const feePercent = feeBps !== undefined ? (feeBps / 100).toFixed(2) : '--';
  const estimatedNet = feeBps !== undefined ? totalSalesFromOrders * (1 - feeBps / 10000) : undefined;

  return (
    <Card className="col-span-2">
      <h3 className="text-lg font-medium">Merchant Metrics</h3>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div>
          <div className="text-sm text-muted">On-chain Balance (mUSDC)</div>
          <div className="text-2xl font-semibold">{balanceLoading ? 'Loading...' : balanceData ? `${balanceData.formatted} ${balanceData.symbol || 'mUSDC'}` : '0.000000 mUSDC'}</div>
        </div>

        <div>
          <div className="text-sm text-muted">Total Payments</div>
          <div className="text-2xl font-semibold">{totalPayments}</div>
        </div>

        <div>
          <div className="text-sm text-muted">Platform Fee</div>
          <div className="text-2xl font-semibold">{feeBps !== undefined ? `${feeBps} bps (${feePercent}%)` : '—'}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-muted">Total Sales (orders)</div>
          <div className="text-xl font-semibold">{totalSalesFromOrders.toFixed(6)} mUSDC</div>
        </div>

        <div>
          <div className="text-sm text-muted">Estimated Net (after platform fee)</div>
          <div className="text-xl font-semibold">{estimatedNet !== undefined ? `${estimatedNet.toFixed(6)} mUSDC` : '—'}</div>
        </div>
      </div>
    </Card>
  );
}
