import type { ReactNode } from "react";
import { Database, Wallet } from "lucide-react";
import { useFiles } from "@/hooks/useFiles";
import { useWallet } from "@/stores/walletStore";
import { shortenAddress, formatBytes } from "@/lib/utils";

export function Sidebar() {
  const address = useWallet((s) => s.address);
  const { data: files } = useFiles();
  const count = files?.length ?? 0;
  const totalBytes = files?.reduce((sum, f) => sum + f.size, 0) ?? 0;

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-3 border-r border-hairline p-4">
      <Card icon={<Wallet className="size-3.5" />} label="Wallet">
        <p className="mt-1.5 font-mono text-xs text-ink">
          {address ? shortenAddress(address, 6) : "—"}
        </p>
        <p className="text-[11px] text-ink-tertiary">Local test wallet</p>
      </Card>

      <Card icon={<Database className="size-3.5" />} label="Storage">
        <p className="mt-1.5 text-sm text-ink">
          {count} file{count === 1 ? "" : "s"}
        </p>
        <p className="text-xs text-ink-subtle">{formatBytes(totalBytes)} on Walrus</p>
      </Card>
    </aside>
  );
}

function Card({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1 p-3">
      <div className="flex items-center gap-2 text-ink-subtle">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}
