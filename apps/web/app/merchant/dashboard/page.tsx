"use client";

import React from "react";
import MerchantMetrics from "../../../components/merchant/MerchantMetrics";
import RecentPayments from "../../../components/merchant/RecentPayments";
import RefundsList from "../../../components/merchant/RefundsList";

export default function MerchantDashboardPage() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-6">Merchant Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <MerchantMetrics />
        <RecentPayments />
      </div>

      <div className="mt-6">
        <RefundsList />
      </div>
    </div>
  );
}
