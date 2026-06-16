import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { EASE, IN_VIEW } from "./shared";

/** Eyebrow + display title + optional lede, revealed on scroll. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <motion.div
      className={cn("flex flex-col gap-3.5", centered && "items-center text-center", className)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={IN_VIEW}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <span className="text-[13px] font-medium tracking-[0.04em] text-accent">{eyebrow}</span>
      <h2 className="text-balance text-[clamp(28px,4vw,40px)] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">
        {title}
      </h2>
      {lede && (
        <p className={cn("max-w-2xl text-pretty text-[16.5px] leading-relaxed text-ink-subtle", centered && "mx-auto")}>
          {lede}
        </p>
      )}
    </motion.div>
  );
}

const CTA_BASE =
  "group inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-[14px] font-medium tracking-[-0.005em] transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus/60";

const CTA_VARIANTS = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_10px_30px_-8px] hover:shadow-accent/45 active:translate-y-0 active:scale-[0.98]",
  secondary:
    "border border-hairline bg-surface-1 text-ink lift hover:border-hairline-strong hover:bg-surface-2 hover:-translate-y-px active:translate-y-0",
  ghost: "text-ink-muted hover:bg-surface-1 hover:text-ink",
} as const;

type CtaVariant = keyof typeof CTA_VARIANTS;

/** Internal navigation CTA — client-side react-router Link (no page reload). */
export function NavCta({
  to,
  variant = "primary",
  className,
  children,
}: {
  to: string;
  variant?: CtaVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link className={cn(CTA_BASE, CTA_VARIANTS[variant], className)} to={to}>
      {children}
    </Link>
  );
}

/** External CTA — opens in a new tab. */
export function LinkCta({
  href,
  variant = "secondary",
  className,
  children,
}: {
  href: string;
  variant?: CtaVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      className={cn(CTA_BASE, CTA_VARIANTS[variant], className)}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}
