import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "md" | "lg";
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-[#d8ff77] active:bg-[#b8ee3a] shadow-[0_0_0_1px_rgba(200,255,77,0.4)]",
  secondary:
    "bg-transparent text-text border border-border-strong hover:border-accent hover:text-accent",
  ghost: "bg-transparent text-text-muted hover:text-text",
};

const sizeClasses = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export default function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  onClick,
}: ButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
      {icon}
    </Link>
  );
}
