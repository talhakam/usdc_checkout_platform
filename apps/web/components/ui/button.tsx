"use client";

import React from "react";
import { cn } from "./utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  tone?: "dark" | "light";
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { className, variant = "primary", size = "md", tone = "dark", children, ...rest } = props;

  const base = "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const variantClasses: Record<string, string> = {
    primary: tone === "dark" ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md hover:brightness-105" : "bg-surface text-foreground border",
    secondary: "bg-surface/80 text-foreground border border-border hover:bg-surface/90",
    ghost: "bg-transparent text-muted",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button ref={ref} className={cn(base, variantClasses[variant], sizes[size], className || "")} {...rest}>
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
