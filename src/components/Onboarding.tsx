import { useState } from "react";
import { motion } from "motion/react";
import { HardDrive, Plus, Upload } from "lucide-react";
import { Input } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/stores/walletStore";

const EASE = [0.16, 1, 0.3, 1] as const;

/** First-run / no-wallet state: create or import a local wallet to get started. */
export function Onboarding() {
  const generate = useWallet((s) => s.generate);
  const importKey = useWallet((s) => s.importKey);
  const error = useWallet((s) => s.error);
  const [mode, setMode] = useState<"choose" | "import">("choose");
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-sm flex-col items-center gap-5 text-center"
        initial={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <span className="lift flex size-14 items-center justify-center rounded-2xl border border-hairline bg-surface-1">
          <HardDrive aria-hidden className="size-7 text-accent" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-semibold text-ink">Welcome to WalDrive</h1>
          <p className="text-sm text-ink-subtle">
            A local wallet signs your Sui transactions and pays gas. Create one to begin — testnet
            only, stored on this device.
          </p>
        </div>

        {mode === "choose" ? (
          <div className="flex w-full flex-col gap-2">
            <Button className="w-full" size="lg" variant="primary" onPress={generate}>
              <Plus className="size-4" /> Generate a new wallet
            </Button>
            <Button className="w-full" size="lg" variant="secondary" onPress={() => setMode("import")}>
              <Upload className="size-4" /> Import an existing key
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <Input
              autoFocus
              aria-label="Private key"
              className="selectable"
              placeholder="suiprivkey1…"
              value={draft}
              variant="secondary"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && importKey(draft)}
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                isDisabled={!draft.trim()}
                variant="primary"
                onPress={() => importKey(draft)}
              >
                Import
              </Button>
              <Button variant="ghost" onPress={() => { setMode("choose"); setDraft(""); }}>
                Back
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
