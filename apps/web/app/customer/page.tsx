"use client";

import React from "react";
import CustomerDashboard from "@/components/CustomerDashboard";

export default function CustomerPage() {
  return (
    <main className="py-10">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-2xl font-semibold mb-6">Customer Dashboard</h1>
        <CustomerDashboard />
      </div>
    </main>
  );
}
