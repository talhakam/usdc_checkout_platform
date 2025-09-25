"use client";

import React from "react";

interface MerchantRow { id: string; name: string; wallet: string; store_url?: string | null; isRegistered?: boolean }
interface Props { merchants: MerchantRow[]; onCheckout: (m: MerchantRow) => void }

export default function MerchantsList({ merchants, onCheckout }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {merchants.map((m) => (
        <div key={m.id} className="p-4 border border-border rounded-lg bg-surface/50">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{m.name}</div>
              <div className="text-sm text-muted">{m.store_url}</div>
            </div>
            <div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => onCheckout(m)}>
                Checkout
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
