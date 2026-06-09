import { useState } from "react";
import { Check, Copy, Database, HardDrive, Settings, Wallet } from "lucide-react";
import { useFiles } from "@/hooks/useFiles";
import { useBalance } from "@/hooks/useBalance";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { shortenAddress, formatBytes } from "@/lib/utils";

const LABEL = "flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-tertiary";

/**
 * Wallet and Storage are read-outs (info, not buttons) — the wallet gets a
 * copy-address affordance. Settings is the one navigation action, pinned bottom.
 */
export function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const address = useWallet((s) => s.address);
  const { data: balance } = useBalance();
  const network = useSettings((s) => s.network);
  const { data: files, isLoading } = useFiles();
  const [copied, setCopied] = useState(false);
  const count = files?.length ?? 0;
  const totalBytes = files?.reduce((sum, f) => sum + f.size, 0) ?? 0;

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-hairline px-4 py-4">
      <div className="flex items-center gap-2 px-1">
        <HardDrive aria-hidden className="size-4 text-accent" />
        <span className="text-sm font-semibold tracking-tight text-ink">WalDrive</span>
      </div>

      <section className="flex flex-col gap-1.5 px-1">
        <span className={LABEL}>
          <Wallet aria-hidden className="size-3" /> Wallet
        </span>
        <div className="flex items-center gap-1.5">
          <span className="truncate font-mono text-xs text-ink" title={address ?? undefined}>
            {address ? shortenAddress(address, 6) : "—"}
          </span>
          {address && (
            <button
              aria-label="Copy address"
              className="shrink-0 rounded p-0.5 text-ink-tertiary outline-none transition-colors hover:text-ink focus-visible:text-ink"
              type="button"
              onClick={copyAddress}
            >
              {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
            </button>
          )}
        </div>
        <span className="text-[11px] text-ink-subtle">
          {balance != null
            ? `${balance.toLocaleString(undefined, { maximumFractionDigits: 3 })} SUI · ${network}`
            : network}
        </span>
      </section>

      <section className="flex flex-col gap-1.5 px-1">
        <span className={LABEL}>
          <Database aria-hidden className="size-3" /> Storage
        </span>
        <span className="text-sm text-ink">
          {isLoading ? "—" : `${count} file${count === 1 ? "" : "s"}`}
        </span>
        <span className="text-[11px] text-ink-subtle">
          {isLoading ? "Loading…" : `${formatBytes(totalBytes)} on Walrus`}
        </span>
      </section>

      <div className="flex-1" />

      <button
        className="lift flex items-center gap-2 rounded-lg border border-hairline bg-surface-1 px-3 py-2.5 text-left outline-none transition-[background-color,border-color] duration-150 hover:border-hairline-strong hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-focus/50"
        type="button"
        onClick={onOpenSettings}
      >
        <Settings aria-hidden className="size-4 text-ink-subtle" />
        <span className="text-sm text-ink">Settings</span>
      </button>
    </aside>
  );
}
