"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5 min-h-[34px]",
    md: "px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2 min-h-[42px]",
    lg: "px-6 py-3.5 text-sm sm:text-base rounded-xl gap-2.5 min-h-[48px]",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    danger: "btn-danger",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? "true" : undefined}
      className={`btn-interactive ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
