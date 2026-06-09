import { useState } from "react";
import { Check, Copy, Files, HardDrive, Settings } from "lucide-react";
import { ListBox } from "@heroui/react";
import type { BlobFile } from "@waldrive/shared";
import { useBalance } from "@/hooks/useBalance";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { shortenAddress, formatBytes } from "@/lib/utils";
import { fileCategory, CATEGORY_META, type FileCategory } from "@/lib/fileKind";

export type NavKey = "all" | FileCategory;

const NAV_ITEM =
  "text-ink outline-none aria-selected:bg-surface-2 data-[hovered=true]:bg-surface-2";

export function Sidebar({
  files,
  active,
  onSelect,
  onOpenSettings,
}: {
  files: BlobFile[];
  active: NavKey;
  onSelect: (key: NavKey) => void;
  onOpenSettings: () => void;
}) {
  const address = useWallet((s) => s.address);
  const { data: balance } = useBalance();
  const network = useSettings((s) => s.network);
  const [copied, setCopied] = useState(false);

  const counts = files.reduce(
    (acc, f) => {
      const c = fileCategory(f.mimeType, f.name);
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    },
    {} as Record<FileCategory, number>,
  );
  const present = (Object.keys(CATEGORY_META) as FileCategory[]).filter((c) => counts[c]);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-surface-1">
      <div
        data-tauri-drag-region
        className="flex h-12 shrink-0 items-center gap-2 pr-4 pl-20"
      >
        <HardDrive aria-hidden className="size-4 shrink-0 text-accent" />
        <span className="text-sm font-semibold tracking-tight text-ink">WalDrive</span>
      </div>

      <ListBox
        aria-label="Filter files by type"
        className="gap-0.5 border-none bg-transparent px-2 py-1 shadow-none"
        disallowEmptySelection
        selectedKeys={new Set([active])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const next = [...(keys as Set<string>)][0];
          if (next) onSelect(next as NavKey);
        }}
      >
        <ListBox.Item className={NAV_ITEM} id="all" textValue="All Files">
          <Files aria-hidden className="size-4 text-ink-subtle" strokeWidth={1.75} />
          <span className="flex-1">All Files</span>
          <span className="text-xs text-ink-tertiary">{files.length}</span>
        </ListBox.Item>
        {present.map((c) => {
          const { label, Icon } = CATEGORY_META[c];
          return (
            <ListBox.Item key={c} className={NAV_ITEM} id={c} textValue={label}>
              <Icon aria-hidden className="size-4 text-ink-subtle" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              <span className="text-xs text-ink-tertiary">{counts[c]}</span>
            </ListBox.Item>
          );
        })}
      </ListBox>

      <div className="flex-1" />

      <div className="flex flex-col gap-3 border-t border-hairline p-3">
        <div className="flex flex-col gap-0.5">
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
          <span className="text-[11px] text-ink-tertiary">
            {balance != null
              ? `${balance.toLocaleString(undefined, { maximumFractionDigits: 3 })} SUI · ${network}`
              : network}
            {" · "}
            {formatBytes(totalBytes)}
          </span>
        </div>

        <button
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-ink-subtle outline-none transition-colors hover:bg-surface-2 hover:text-ink focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-focus/50"
          type="button"
          onClick={onOpenSettings}
        >
          <Settings aria-hidden className="size-4" />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </aside>
  );
}
