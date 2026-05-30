import { motion, AnimatePresence } from "motion/react";
import { HardDrive, Moon, Sun } from "lucide-react";
import { Tooltip } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/lib/theme";
import { useWallet } from "@/stores/walletStore";
import { shortenAddress } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function TitleBar() {
  const { theme, toggle } = useTheme();
  const address = useWallet((s) => s.address);

  return (
    <header
      data-tauri-drag-region
      className="flex h-12 shrink-0 items-center justify-between border-b border-hairline pr-3 pl-20"
    >
      <div className="pointer-events-none flex items-center gap-2">
        <HardDrive className="size-4 text-accent" aria-hidden />
        <span className="text-sm font-semibold tracking-tight text-ink">WalDrive</span>
      </div>

      <div className="flex items-center gap-2">
        {address && (
          <span className="selectable rounded-full bg-surface-2 px-2.5 py-1 font-mono text-xs text-ink-subtle">
            {shortenAddress(address)}
          </span>
        )}
        <Tooltip delay={400}>
          <Button isIconOnly aria-label="Toggle theme" size="sm" variant="ghost" onPress={toggle}>
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={theme}
                animate={{ opacity: 1, rotate: 0 }}
                className="block"
                exit={{ opacity: 0, rotate: 90 }}
                initial={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </motion.span>
            </AnimatePresence>
          </Button>
          <Tooltip.Content>
            <p>{theme === "dark" ? "Switch to light" : "Switch to dark"}</p>
          </Tooltip.Content>
        </Tooltip>
      </div>
    </header>
  );
}
