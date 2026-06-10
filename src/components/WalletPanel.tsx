import { useState } from "react";
import { Check, Copy, Droplet, Eye, EyeOff, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { AlertDialog, Input } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/stores/walletStore";
import { useBalance } from "@/hooks/useBalance";
import { useFaucet } from "@/hooks/useFaucet";
import { shortenAddress } from "@/lib/utils";
import { cn } from "@/lib/cn";

type Mode = "view" | "reveal" | "import";

function RemoveConfirm({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <Button isIconOnly aria-label="Remove account" size="sm" variant="ghost">
        <Trash2 className="size-3.5" />
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="max-w-sm">
            <AlertDialog.Header>
              <AlertDialog.Icon status="warning" />
              <AlertDialog.Heading>Remove this account?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-ink-subtle">
                Reveal and back up its key first — removing it here erases it from this device.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>
              <Button slot="close" variant="danger" onPress={onConfirm}>
                Remove
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

export function WalletPanel({ onClose }: { onClose?: () => void }) {
  const accounts = useWallet((s) => s.accounts);
  const address = useWallet((s) => s.address);
  const generate = useWallet((s) => s.generate);
  const importKey = useWallet((s) => s.importKey);
  const remove = useWallet((s) => s.remove);
  const switchTo = useWallet((s) => s.switchTo);
  const reveal = useWallet((s) => s.reveal);
  const { data: balance, isLoading: balanceLoading } = useBalance();
  const faucet = useFaucet();

  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500);
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

  if (mode === "reveal") {
    const secret = reveal() ?? "";
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger/5 p-3">
        <p className="text-xs text-danger">Anyone with this key controls the account. Never share it.</p>
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
      <div className="flex flex-col gap-0.5">
        {accounts.map((acc) => {
          const isActive = acc.address === address;
          return (
            <div
              key={acc.address}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors",
                isActive ? "bg-surface-2" : "hover:bg-surface-2",
              )}
            >
              <button
                aria-label={`Switch to ${acc.address}`}
                aria-pressed={isActive}
                className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
                type="button"
                onClick={() => switchTo(acc.address)}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    isActive ? "bg-accent" : "bg-transparent",
                  )}
                />
                <span className="truncate font-mono text-xs text-ink">
                  {shortenAddress(acc.address, 6)}
                </span>
              </button>
              <button
                aria-label="Copy address"
                className="shrink-0 rounded p-1 text-ink-tertiary transition-colors hover:text-ink"
                type="button"
                onClick={() => copy(acc.address, acc.address)}
              >
                {copied === acc.address ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
              <RemoveConfirm
                onConfirm={() => {
                  remove(acc.address);
                  if (isActive && accounts.length === 1) onClose?.();
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 px-2">
        <span className="text-xs text-ink-subtle">Balance</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted">
            {balanceLoading ? "…" : `${(balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} SUI`}
          </span>
          {faucet.available && (
            <Button
              isDisabled={faucet.status === "loading"}
              size="sm"
              variant={faucet.status === "error" ? "danger" : "secondary"}
              onPress={faucet.request}
            >
              {faucet.status === "loading" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : faucet.status === "ok" ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Droplet className="size-3.5" />
              )}
              {faucet.status === "ok" ? "Requested" : faucet.status === "error" ? "Failed" : "Faucet"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="ghost" onPress={() => setMode("reveal")}>
          <Eye className="size-3.5" /> Reveal key
        </Button>
        <Button size="sm" variant="ghost" onPress={() => setMode("import")}>
          <Upload className="size-3.5" /> Import
        </Button>
        <Button size="sm" variant="ghost" onPress={generate}>
          <Plus className="size-3.5" /> New account
        </Button>
      </div>
    </div>
  );
}
