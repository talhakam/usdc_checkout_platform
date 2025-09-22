"use client";

import React from "react";
import clsx from "clsx";

export default function Card({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-xl bg-white/60 border border-gray-200 shadow-sm p-6", className)}>
      {children}
    </div>
  );
}
