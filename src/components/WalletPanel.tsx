import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";
import { Check, Copy, Droplet, Eye, EyeOff, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { AlertDialog, Input } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { useBalance } from "@/hooks/useBalance";

type Mode = "view" | "reveal" | "import";
type Faucet = "idle" | "loading" | "ok" | "error";

function Confirm({
  trigger,
  heading,
  body,
  confirmLabel,
  onConfirm,
}: {
  trigger: React.ReactNode;
  heading: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      {trigger}
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="max-w-sm">
            <AlertDialog.Header>
              <AlertDialog.Icon status="warning" />
              <AlertDialog.Heading>{heading}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-ink-subtle">{body}</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>
              <Button slot="close" variant="primary" onPress={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

export function WalletPanel({ onClose }: { onClose?: () => void }) {
  const address = useWallet((s) => s.address);
  const generate = useWallet((s) => s.generate);
  const importKey = useWallet((s) => s.importKey);
  const remove = useWallet((s) => s.remove);
  const reveal = useWallet((s) => s.reveal);
  const network = useSettings((s) => s.network);
  const { data: balance, isLoading: balanceLoading } = useBalance();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [faucet, setFaucet] = useState<Faucet>("idle");

  const canFaucet = network !== "mainnet";

  async function copy(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500);
  }

  async function requestFaucet() {
    if (!address || !canFaucet) return;
    setFaucet("loading");
    try {
      await requestSuiFromFaucetV2({
        host: getFaucetHost(network as "testnet" | "devnet" | "localnet"),
        recipient: address,
      });
      setFaucet("ok");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["balance"] }), 2000);
      setTimeout(() => setFaucet("idle"), 3000);
    } catch {
      setFaucet("error");
      setTimeout(() => setFaucet("idle"), 3000);
    }
  }

  function submitImport() {
    if (importKey(draft)) {
      setDraft("");
      setImportError(null);
      setMode("view");
    } else {
      setImportError("Invalid key — expected a suiprivkey1… secret.");
    }
  }

  if (!address) return null;

  if (mode === "reveal") {
    const secret = reveal() ?? "";
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger/5 p-3">
        <p className="text-xs text-danger">Anyone with this key controls the wallet. Never share it.</p>
        <div className="flex items-center gap-1.5">
          <code className="selectable min-w-0 flex-1 truncate rounded bg-canvas px-2 py-1.5 font-mono text-xs text-ink-muted">
            {secret}
          </code>
          <Button isIconOnly aria-label="Copy secret" size="sm" variant="ghost" onPress={() => copy("sk", secret)}>
            {copied === "sk" ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
        <Button className="self-start" size="sm" variant="secondary" onPress={() => setMode("view")}>
          <EyeOff className="size-3.5" /> Hide
        </Button>
      </div>
    );
  }

  if (mode === "import") {
    return (
      <div className="flex flex-col gap-2">
        <Input
          autoFocus
          aria-label="Private key"
          className="selectable"
          placeholder="suiprivkey1…"
          value={draft}
          variant="secondary"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitImport()}
        />
        {importError && <p className="text-xs text-danger">{importError}</p>}
        <div className="flex items-center gap-2">
          <Button isDisabled={!draft.trim()} size="sm" variant="primary" onPress={submitImport}>
            Import
          </Button>
          <Button size="sm" variant="ghost" onPress={() => { setMode("view"); setDraft(""); setImportError(null); }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-ink-subtle">Address</span>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="selectable truncate font-mono text-xs text-ink-muted" title={address}>
            {address}
          </span>
          <button
            aria-label="Copy address"
            className="shrink-0 rounded p-1 text-ink-tertiary transition-colors hover:text-ink"
            type="button"
            onClick={() => copy("addr", address)}
          >
            {copied === "addr" ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-ink-subtle">Balance</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted">
            {balanceLoading ? "…" : `${(balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} SUI`}
          </span>
          {canFaucet && (
            <Button
              isDisabled={faucet === "loading"}
              size="sm"
              variant={faucet === "error" ? "danger" : "secondary"}
              onPress={requestFaucet}
            >
              {faucet === "loading" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : faucet === "ok" ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Droplet className="size-3.5" />
              )}
              {faucet === "ok" ? "Requested" : faucet === "error" ? "Failed" : "Faucet"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <Button size="sm" variant="ghost" onPress={() => setMode("reveal")}>
          <Eye className="size-3.5" /> Reveal key
        </Button>
        <Button size="sm" variant="ghost" onPress={() => setMode("import")}>
          <Upload className="size-3.5" /> Import
        </Button>
        <Confirm
          body="This replaces the current wallet with a brand-new one."
          confirmLabel="Generate"
          heading="Generate a new wallet?"
          onConfirm={generate}
          trigger={
            <Button size="sm" variant="ghost">
              <Plus className="size-3.5" /> New
            </Button>
          }
        />
        <Confirm
          body="This removes the wallet from the app and returns to the welcome screen."
          confirmLabel="Remove"
          heading="Remove this wallet?"
          onConfirm={() => {
            remove();
            onClose?.();
          }}
          trigger={
            <Button size="sm" variant="ghost">
              <Trash2 className="size-3.5" /> Remove
            </Button>
          }
        />
      </div>
    </div>
  );
}
