import { motion, AnimatePresence } from "motion/react";
import { HardDrive, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useWallet } from "@/stores/walletStore";
import { shortenAddress } from "@/lib/utils";

export function TitleBar() {
  const { theme, toggle } = useTheme();
  const address = useWallet((s) => s.address);

  return (
    <header
      data-tauri-drag-region
      className="flex h-12 shrink-0 items-center justify-between border-b border-hairline pl-20 pr-3"
    >
      <div className="pointer-events-none flex items-center gap-2">
        <HardDrive className="size-4 text-accent" aria-hidden />
        <span className="text-sm font-semibold tracking-tight text-ink">WalDrive</span>
      </div>

      <div className="flex items-center gap-2">
        {address && (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-xs text-ink-subtle">
            {shortenAddress(address)}
          </span>
        )}
        <button
          onClick={toggle}
          title="Toggle theme"
          aria-label="Toggle theme"
          className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
