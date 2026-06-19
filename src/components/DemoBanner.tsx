import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Shown in place of the faucet banner when there's no local wallet: the console
 * is browsing the read-only demo address, so set the expectation and offer a way
 * to get a real, writable wallet. */
export function DemoBanner({ onGenerate, onImport }: { onGenerate: () => void; onImport: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-1 px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
        <Eye aria-hidden className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">You're browsing a read-only demo drive</p>
        <p className="text-xs text-ink-subtle">
          Real files on Walrus, verifiable by anyone. Generate a wallet to upload your own.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant="ghost" onPress={onImport}>
          Import a key
        </Button>
        <Button size="sm" variant="primary" onPress={onGenerate}>
          <Plus className="size-3.5" />
          Generate a wallet
        </Button>
      </div>
    </div>
  );
}
