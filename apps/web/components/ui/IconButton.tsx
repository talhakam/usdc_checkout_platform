"use client";

import React from "react";
import { cn } from "./utils";

export default function IconButton({ children, className, onClick }: { children?: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("w-10 h-10 inline-flex items-center justify-center rounded-lg bg-surface/80 border border-border shadow-sm hover:scale-105 transition-transform", className)}>
      {children}
    </button>
  );
}
