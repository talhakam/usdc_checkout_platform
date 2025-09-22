import Link from "next/link";
import Button from "./ui/button";
import Container from "./ui/Container";
import IconButton from "./ui/IconButton";
import { User } from "lucide-react";
import React from "react";

interface HeaderProps {
  children?: React.ReactNode;
}

export default function Header({ children }: HeaderProps) {
  return (
    <header className="w-full border-b border-gray-200 bg-white/60 backdrop-blur-sm">
      <Container>
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-gradient-to-r from-blue-600 to-sky-500 rounded-lg block shadow-inner" aria-label="Home" />
            <Link href="/" className="text-2xl text-black font-semibold">USDCPayment Hub</Link>
          </div>

          <div className="flex items-center space-x-3">
            {/* main navigation */}
            <nav className="hidden md:flex items-center space-x-3">
              <Link href="/merchant/register">
                <Button variant="secondary" size="md">Register Merchant</Button>
              </Link>

              <Link href="/customer">
                <Button variant="primary" size="md">Customer</Button>
              </Link>

              <Link href="/signin">
                <Button variant="ghost" size="md">Sign In</Button>
              </Link>

              <IconButton>
                <User className="w-4 h-4 text-gray-700" />
              </IconButton>
            </nav>

            {/* optional children (e.g. WalletConnectButton) rendered to the right */}
            {children}
          </div>
        </div>
      </Container>
    </header>
  );
}

