import { Database, HardDrive, Settings, Wallet } from "lucide-react";
import { useFiles } from "@/hooks/useFiles";
import { useBalance } from "@/hooks/useBalance";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { shortenAddress, formatBytes } from "@/lib/utils";

const CARD =
  "lift rounded-lg border border-hairline bg-surface-1 p-3 text-left outline-none transition-[background-color,border-color] duration-150 hover:border-hairline-strong hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-focus/50";

export function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const address = useWallet((s) => s.address);
  const { data: balance } = useBalance();
  const network = useSettings((s) => s.network);
  const { data: files, isLoading } = useFiles();
  const count = files?.length ?? 0;
  const totalBytes = files?.reduce((sum, f) => sum + f.size, 0) ?? 0;

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-3 border-r border-hairline p-4">
      <div className="flex items-center gap-2 px-1 pt-0.5 pb-1">
        <HardDrive aria-hidden className="size-4 text-accent" />
        <span className="text-sm font-semibold tracking-tight text-ink">WalDrive</span>
      </div>

      <button className={`${CARD} flex flex-col gap-1`} type="button" onClick={onOpenSettings}>
        <span className="flex items-center gap-2 text-xs font-medium text-ink-subtle">
          <Wallet aria-hidden className="size-3.5" /> Wallet
        </span>
        <span className="truncate font-mono text-xs text-ink">
          {address ? shortenAddress(address, 6) : "—"}
        </span>
        <span className="text-[11px] text-ink-tertiary">
          {balance != null
            ? `${balance.toLocaleString(undefined, { maximumFractionDigits: 3 })} SUI · ${network}`
            : `Local wallet · ${network}`}
        </span>
      </button>

      <button className={`${CARD} flex flex-col gap-1`} type="button" onClick={onOpenSettings}>
        <span className="flex items-center gap-2 text-xs font-medium text-ink-subtle">
          <Database aria-hidden className="size-3.5" /> Storage
        </span>
        <span className="text-sm text-ink">
          {isLoading ? "—" : `${count} file${count === 1 ? "" : "s"}`}
        </span>
        <span className="text-xs text-ink-subtle">
          {isLoading ? "Loading…" : `${formatBytes(totalBytes)} on Walrus`}
        </span>
      </button>

      <div className="flex-1" />

      <button
        className={`${CARD} flex items-center gap-2`}
        type="button"
        onClick={onOpenSettings}
      >
        <Settings aria-hidden className="size-4 text-ink-subtle" />
        <span className="text-sm text-ink">Settings</span>
      </button>
    </aside>
  );
}
