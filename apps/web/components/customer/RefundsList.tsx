"use client";

import React from "react";

interface RefundRow { id: string; payment_id: string; refund_amount: number; status?: string }
interface Props { refunds: RefundRow[] }


export default function RefundsList({ refunds }: Props) {
  return (
    <div className="space-y-2 mt-4">
      {refunds.length === 0 && <div className="text-sm text-gray-500">No refund requests</div>}
      {refunds.map((r) => (
        <div key={r.id} className="flex justify-between">
          <div className="text-sm">{r.payment_id.slice(0, 8)}...</div>
          <div className="text-sm">{r.status}</div>
        </div>
      ))}
    </div>
  );
}
