import { Card } from "@heroui/react";
import { Database, Wallet } from "lucide-react";
import { useFiles } from "@/hooks/useFiles";
import { useWallet } from "@/stores/walletStore";
import { shortenAddress, formatBytes } from "@/lib/utils";

export function Sidebar() {
  const address = useWallet((s) => s.address);
  const { data: files, isLoading } = useFiles();
  const count = files?.length ?? 0;
  const totalBytes = files?.reduce((sum, f) => sum + f.size, 0) ?? 0;

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-3 border-r border-hairline p-4">
      <Card className="lift">
        <Card.Header className="flex-row items-center gap-2 text-ink-subtle">
          <Wallet aria-hidden className="size-3.5" />
          <Card.Title className="text-xs font-medium">Wallet</Card.Title>
        </Card.Header>
        <Card.Content className="gap-0.5">
          <p className="selectable font-mono text-xs text-ink">
            {address ? shortenAddress(address, 6) : "—"}
          </p>
          <p className="text-[11px] text-ink-tertiary">Local test wallet</p>
        </Card.Content>
      </Card>

      <Card className="lift">
        <Card.Header className="flex-row items-center gap-2 text-ink-subtle">
          <Database aria-hidden className="size-3.5" />
          <Card.Title className="text-xs font-medium">Storage</Card.Title>
        </Card.Header>
        <Card.Content className="gap-0.5">
          <p className="text-sm text-ink">
            {isLoading ? "—" : `${count} file${count === 1 ? "" : "s"}`}
          </p>
          <p className="text-xs text-ink-subtle">
            {isLoading ? "Loading…" : `${formatBytes(totalBytes)} on Walrus`}
          </p>
        </Card.Content>
      </Card>
    </aside>
  );
}
