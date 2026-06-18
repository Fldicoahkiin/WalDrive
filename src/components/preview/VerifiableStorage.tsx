import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { openExternal } from "@/lib/openExternal";
import { useSettings } from "@/stores/settingsStore";
import { getWalrusEpoch, EPOCH_DAYS } from "@/lib/walrusSdk";
import { blobUrl, explorerUrl } from "@/lib/constants";

type VerifyState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "ok"; bytes: number; hashHex: string }
  | { phase: "fail" };

/** The "verifiable data" proof block: content ID, on-demand SHA-256 fetch, links. */
export function VerifiableStorage({ file }: { file: BlobFile }) {
  const network = useSettings((s) => s.network);
  const [verify, setVerify] = useState<VerifyState>({ phase: "idle" });
  const [copiedId, setCopiedId] = useState(false);
  const { data: walrusEpoch } = useQuery({
    queryKey: ["walrus-epoch", network],
    enabled: network === "testnet" || network === "mainnet",
    staleTime: 5 * 60_000,
    queryFn: () => getWalrusEpoch(network),
  });
  // Records written before the fix stored the duration (e.g. 3), not the epoch.
  const expiryIsReal = walrusEpoch != null && file.expiryEpoch > walrusEpoch / 2;
  const epochsLeft = walrusEpoch != null && expiryIsReal ? file.expiryEpoch - walrusEpoch : null;
  const daysPerEpoch = network === "mainnet" ? EPOCH_DAYS.mainnet : EPOCH_DAYS.testnet;
  const expiryLine = !expiryIsReal
    ? `Walrus expiry: epoch ${file.expiryEpoch}`
    : epochsLeft != null && epochsLeft <= 0
      ? `Walrus expiry: epoch ${file.expiryEpoch} — expired`
      : `Walrus expiry: epoch ${file.expiryEpoch}${epochsLeft != null ? ` · ≈${epochsLeft * daysPerEpoch}d left` : ""}`;

  useEffect(() => {
    setVerify({ phase: "idle" });
    setCopiedId(false);
  }, [file.objectId]);

  async function copyId() {
    await navigator.clipboard.writeText(file.blobId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  }

  async function runVerify() {
    setVerify({ phase: "checking" });
    try {
      const res = await fetch(blobUrl(file.blobId));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buf);
      const hashHex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setVerify({ phase: "ok", bytes: buf.byteLength, hashHex });
    } catch {
      setVerify({ phase: "fail" });
    }
  }

  const checking = verify.phase === "checking";

  return (
    <section className="mb-4 rounded-lg border border-hairline bg-canvas/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-subtle">
        <ShieldCheck aria-hidden className="size-3.5 text-accent" strokeWidth={1.75} />
        Verifiable storage
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-ink-tertiary">Walrus content ID (content-addressed)</div>
            <div className="truncate font-mono text-xs text-ink" title={file.blobId}>
              {file.blobId}
            </div>
          </div>
          <Button isIconOnly aria-label="Copy content ID" size="sm" variant="ghost" onPress={copyId}>
            {copiedId ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button isDisabled={checking} size="sm" variant="secondary" onPress={runVerify}>
            {checking ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
            Verify
          </Button>
          <Button size="sm" variant="ghost" onPress={() => openExternal(blobUrl(file.blobId))}>
            <ExternalLink className="size-3.5" />
            Open raw
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => openExternal(explorerUrl("object", file.objectId, network))}
          >
            <ExternalLink className="size-3.5" />
            View on Suiscan
          </Button>
        </div>
        {verify.phase === "ok" && (
          <div className="font-mono text-[11px] text-success">
            ✓ Retrieved {verify.bytes} B from Walrus · SHA-256 {verify.hashHex.slice(0, 12)}…
          </div>
        )}
        {verify.phase === "fail" && (
          <div className="text-[11px] text-danger">✗ couldn't retrieve from aggregator</div>
        )}
        <div className="text-[11px] text-ink-tertiary">{expiryLine}</div>
      </div>
    </section>
  );
}
