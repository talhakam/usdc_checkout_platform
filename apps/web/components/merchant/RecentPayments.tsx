"use client";

import React, { useEffect, useState } from "react";
import Card from "../ui/Card";
import { createClient } from "../../lib/database/createClientComponent";
import { useAccount } from "wagmi";

const supabase = createClient();

interface OrderRow { payment_id: string; merchant_wallet: string; total_amount: number; status?: string; created_at?: string }

export default function RecentPayments() {
  const { address } = useAccount();
  const [payments, setPayments] = useState<OrderRow[]>([]);

  useEffect(() => {
    (async () => {
      if (!address) return;
      const { data } = await supabase.from('orders').select('payment_id,merchant_wallet,total_amount,status,created_at').eq('merchant_wallet', address).order('created_at', { ascending: false }).limit(10);
      if (data) setPayments(data as OrderRow[]);
    })();
  }, [address]);

  return (
    <Card>
      <h3 className="text-sm text-muted">Recent Payments</h3>
      <div className="space-y-2 mt-4">
        {payments.length === 0 && <div className="text-sm text-muted">No recent payments</div>}
        {payments.map((p) => (
          <div key={p.payment_id} className="flex justify-between items-center">
            <div className="text-sm">
              <div>{p.payment_id.slice(0, 10)}...</div>
              {p.created_at && <div className="text-xs text-muted">{new Date(p.created_at).toLocaleString()}</div>}
            </div>
            <div className="text-sm">{p.total_amount} mUSDC</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
