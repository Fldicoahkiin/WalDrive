import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { EASE, IN_VIEW } from "./shared";

/** One alternating image/text feature row. `flip` puts the visual on the left. */
export function FeatureRow({
  Icon,
  eyebrow,
  title,
  body,
  points,
  visual,
  flip = false,
}: {
  Icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  points?: string[];
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <motion.div
        className={cn("flex flex-col gap-4", flip && "lg:order-2")}
        initial={{ opacity: 0, x: flip ? 24 : -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={IN_VIEW}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <span className="inline-flex w-fit items-center gap-2 text-[13px] font-medium tracking-[0.02em] text-accent">
          <Icon className="size-4" strokeWidth={1.75} />
          {eyebrow}
        </span>
        <h3 className="text-balance text-[clamp(24px,3.2vw,32px)] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
          {title}
        </h3>
        <p className="text-pretty text-[16px] leading-relaxed text-ink-subtle">{body}</p>
        {points && (
          <ul className="mt-1 flex flex-col gap-2.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[14.5px] text-ink-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2} />
                {p}
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <motion.div
        className={cn(flip && "lg:order-1")}
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={IN_VIEW}
        transition={{ duration: 0.65, ease: EASE, delay: 0.08 }}
      >
        {visual}
      </motion.div>
    </div>
  );
}
