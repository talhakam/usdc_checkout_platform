"use client";

import React from "react";
import clsx from "clsx";

export default function Card({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-xl bg-surface/60 border border-border shadow-sm p-6", className)}>
      {children}
    </div>
  );
}
