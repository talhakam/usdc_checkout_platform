"use client";

import React from "react";
import Link from "next/link";
import Button from "./ui/button";
import WalletConnectButton from "./WalletConnectButton";
import Container from "./ui/Container";
import Card from "./ui/Card";
import { Store, CreditCard, Zap } from "lucide-react";

export default function Landing() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
      <Container>
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl mb-6 font-extrabold tracking-tight">
              Accept <span className="text-gradient bg-clip-text text-blue-600">USDC</span> Payments
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Seamless crypto checkout experience with instant rewards. Transform your business with web3 payments in minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <WalletConnectButton />

            <Link href="/merchant/register">
              <Button variant="primary" size="lg">
                <Store className="mr-2 w-5 h-5" />
                Register as Merchant
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CreditCard className="h-12 w-12 text-blue-600/80 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Instant Payments</h3>
              <p className="text-sm text-gray-600">Accept USDC payments with zero confirmation delays</p>
            </Card>

            <Card className="text-center">
              <Zap className="h-12 w-12 text-yellow-500/80 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Smart Rewards</h3>
              <p className="text-sm text-gray-600">Automated reward distribution to loyal customers</p>
            </Card>

            <Card className="text-center">
              <Store className="h-12 w-12 text-purple-600/80 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Easy Integration</h3>
              <p className="text-sm text-gray-600">Simple API integration in under 30 minutes</p>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
