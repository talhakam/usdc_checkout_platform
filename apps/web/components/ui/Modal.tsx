"use client";

import React from "react";
import { cn } from "./utils";

export default function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4")}> 
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
