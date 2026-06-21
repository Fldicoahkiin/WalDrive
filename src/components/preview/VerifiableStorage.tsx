import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Lock, Loader2, RotateCw, ShieldCheck } from "lucide-react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { openExternal } from "@/lib/openExternal";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { useRenew } from "@/hooks/useRenew";
import { getWalrusEpoch, EPOCH_DAYS, listOwnedBlobs } from "@/lib/walrusSdk";
import { blobUrl, explorerUrl } from "@/lib/constants";

type VerifyState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "ok"; bytes: number; hashHex: string }
  | { phase: "fail" };

/** The "verifiable data" proof block: content ID, on-demand SHA-256 fetch,
 *  links, and one-click renewal before the Walrus storage expires. */
export function VerifiableStorage({ file }: { file: BlobFile }) {
  const network = useSettings((s) => s.network);
  const hasWallet = useWallet((s) => Boolean(s.keypair));
  const { renew, status: renewStatus, error: renewError } = useRenew();
  const renewing = renewStatus === "renewing";
  const [verify, setVerify] = useState<VerifyState>({ phase: "idle" });
  const [copiedId, setCopiedId] = useState(false);

  const onChain = network === "testnet" || network === "mainnet";
  const { data: walrusEpoch } = useQuery({
    queryKey: ["walrus-epoch", network],
    enabled: onChain,
    staleTime: 5 * 60_000,
    queryFn: () => getWalrusEpoch(network),
  });
  // Read the live end epoch from the on-chain Blob object so a renewal shows up
  // at once — FileRecord.expiry_epoch is only the value stamped at upload time.
  const { data: ownedBlobs } = useQuery({
    queryKey: ["owned-blobs", file.owner, network],
    enabled: onChain && Boolean(file.owner),
    staleTime: 60_000,
    queryFn: () => listOwnedBlobs(file.owner, network),
  });
  const expiryEpoch = ownedBlobs?.find((b) => b.blobId === file.blobId)?.endEpoch ?? file.expiryEpoch;

  const expiryIsReal = walrusEpoch != null && expiryEpoch > walrusEpoch / 2;
  const epochsLeft = walrusEpoch != null && expiryIsReal ? expiryEpoch - walrusEpoch : null;
  const daysPerEpoch = network === "mainnet" ? EPOCH_DAYS.mainnet : EPOCH_DAYS.testnet;
  const expired = epochsLeft != null && epochsLeft <= 0;
  const expiringSoon = epochsLeft != null && epochsLeft > 0 && epochsLeft <= 5;
  const expiryLine = !expiryIsReal
    ? `Walrus expiry: epoch ${expiryEpoch}`
    : expired
      ? `Walrus expiry: epoch ${expiryEpoch} — expired`
      : `Walrus expiry: epoch ${expiryEpoch}${epochsLeft != null ? ` · ≈${epochsLeft * daysPerEpoch}d left` : ""}`;

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
        {file.isEncrypted && (
          <span className="ms-auto flex items-center gap-1 rounded bg-accent/12 px-1.5 py-0.5 text-[10px] text-accent">
            <Lock aria-hidden className="size-3" strokeWidth={2} />
            Encrypted · owner-only
          </span>
        )}
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
            {checking ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
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
          {hasWallet && onChain && (
            <Button
              isDisabled={renewing}
              size="sm"
              variant={expired || expiringSoon ? "primary" : "ghost"}
              onPress={() => renew(file.blobId)}
            >
              {renewing ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
              {renewStatus === "done" ? "Renewed" : "Renew"}
            </Button>
          )}
        </div>
        {verify.phase === "ok" && (
          <div className="font-mono text-[11px] text-success">
            ✓ Retrieved {verify.bytes} B from Walrus · SHA-256 {verify.hashHex.slice(0, 12)}…
          </div>
        )}
        {verify.phase === "fail" && (
          <div className="text-[11px] text-danger">✗ couldn't retrieve from aggregator</div>
        )}
        {renewError && <div className="text-[11px] text-danger">{renewError}</div>}
        <div
          className={`text-[11px] ${expired ? "text-danger" : expiringSoon ? "text-warning" : "text-ink-tertiary"}`}
        >
          {expiryLine}
        </div>
      </div>
    </section>
  );
}
