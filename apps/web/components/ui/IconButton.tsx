"use client";

import React from "react";
import { cn } from "./utils";

export default function IconButton({ children, className, onClick }: { children?: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("w-10 h-10 inline-flex items-center justify-center rounded-lg bg-white/80 border border-gray-200 shadow-sm hover:scale-105 transition-transform", className)}>
      {children}
    </button>
  );
}
