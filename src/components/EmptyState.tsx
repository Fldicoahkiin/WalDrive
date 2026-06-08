import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Centered icon + message for empty / no-match states. */
export function EmptyState({
  Icon,
  title,
  description,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 py-20 text-center"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <span className="lift flex size-12 items-center justify-center rounded-2xl border border-hairline bg-surface-1 text-ink-tertiary">
        <Icon aria-hidden className="size-5" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="max-w-xs text-xs text-ink-subtle">{description}</p>
      </div>
    </motion.div>
  );
}
