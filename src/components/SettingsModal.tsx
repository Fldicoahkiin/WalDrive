import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Copy, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme, type Theme } from "@/lib/theme";
import { useWallet } from "@/stores/walletStore";
import { CONTRACT, WALRUS, SUI_NETWORK } from "@/lib/constants";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;
const VERSION = "0.1.0";

const THEMES: { key: Theme; label: string; Icon: typeof Sun }[] = [
  { key: "light", label: "Light", Icon: Sun },
  { key: "dark", label: "Dark", Icon: Moon },
];

function Row({
  label,
  value,
  copyKey,
  copiedKey,
  onCopy,
}: {
  label: string;
  value: string;
  copyKey?: string;
  copiedKey?: string | null;
  onCopy?: (key: string, value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="shrink-0 text-xs text-ink-subtle">{label}</span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="selectable truncate font-mono text-xs text-ink-muted" title={value}>
          {value}
        </span>
        {copyKey && onCopy && (
          <button
            aria-label={`Copy ${label}`}
            className="shrink-0 rounded p-1 text-ink-tertiary transition-colors hover:text-ink"
            type="button"
            onClick={() => onCopy(copyKey, value)}
          >
            {copiedKey === copyKey ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.set);
  const address = useWallet((s) => s.address);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const restoreTo = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      restoreTo?.focus();
    };
  }, [open, onClose]);

  async function copy(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          style={{ background: "var(--scrim)" }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            aria-label="Settings"
            aria-modal="true"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="lift-2 flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-hairline-strong bg-surface-1 outline-none"
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            role="dialog"
            tabIndex={-1}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="text-sm font-medium text-ink">Settings</span>
              <Button isIconOnly aria-label="Close" size="sm" variant="ghost" onPress={onClose}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-5 p-4">
              <section className="flex flex-col gap-2">
                <span className="text-xs font-medium text-ink-subtle">Appearance</span>
                <div className="flex items-center gap-0.5 self-start rounded-lg border border-hairline bg-surface-1 p-0.5">
                  {THEMES.map((t) => (
                    <button
                      key={t.key}
                      aria-pressed={theme === t.key}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors",
                        theme === t.key ? "bg-surface-2 text-ink" : "text-ink-subtle hover:text-ink",
                      )}
                      type="button"
                      onClick={() => setTheme(t.key)}
                    >
                      <t.Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="flex flex-col">
                <span className="mb-1 text-xs font-medium text-ink-subtle">Wallet</span>
                <Row
                  copiedKey={copiedKey}
                  copyKey="addr"
                  label="Address"
                  onCopy={copy}
                  value={address ?? "—"}
                />
                <Row label="Network" value={SUI_NETWORK} />
              </section>

              <section className="flex flex-col">
                <span className="mb-1 text-xs font-medium text-ink-subtle">Walrus storage</span>
                <Row label="Aggregator" value={WALRUS.AGGREGATOR.replace(/^https?:\/\//, "")} />
                <Row label="Publisher" value={WALRUS.PUBLISHER.replace(/^https?:\/\//, "")} />
                <Row label="Default epochs" value={String(WALRUS.EPOCHS_DEFAULT)} />
              </section>

              <section className="flex flex-col">
                <span className="mb-1 text-xs font-medium text-ink-subtle">Contract</span>
                <Row
                  copiedKey={copiedKey}
                  copyKey="pkg"
                  label="Package"
                  onCopy={copy}
                  value={CONTRACT.PACKAGE_ID || "—"}
                />
              </section>
            </div>

            <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5 text-xs text-ink-tertiary">
              <span>WalDrive v{VERSION}</span>
              <span>Sui · Walrus testnet</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
