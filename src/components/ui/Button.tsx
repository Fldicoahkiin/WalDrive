import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface-2 text-ink border border-hairline hover:border-hairline-strong",
  ghost: "text-ink-subtle hover:bg-surface-2 hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
};

export function Button({
  children,
  variant = "secondary",
  className,
  onClick,
  disabled,
  type = "button",
  title,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  return (
    <motion.button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
        "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
