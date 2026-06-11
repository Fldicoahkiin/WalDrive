import { useState } from "react";
import { motion } from "motion/react";
import { Droplet, Plus, ShieldCheck, Upload, UploadCloud } from "lucide-react";
import { Input } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/BrandMark";
import { useWallet } from "@/stores/walletStore";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    Icon: Plus,
    title: "Create a local wallet",
    body: "An Ed25519 key generated on this device. It signs everything in-process — no extension, no popups.",
  },
  {
    Icon: Droplet,
    title: "Grab free testnet SUI",
    body: "Recording a file on Sui costs a little gas. The faucet is free — we'll point you to it.",
  },
  {
    Icon: UploadCloud,
    title: "Drag files in",
    body: "Bytes land on the Walrus decentralized network, metadata on Sui. Verifiable by anyone, owned by you.",
  },
] as const;

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
        className="flex w-full max-w-lg flex-col items-center gap-7 text-center"
        initial={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <span className="lift flex size-16 items-center justify-center rounded-2xl border border-hairline bg-surface-1">
          <BrandMark className="size-10" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-ink">Welcome to WalDrive</h1>
          <p className="text-sm text-ink-subtle">
            A drive where the bytes live on Walrus and the metadata on Sui — no backend, no
            account, no lock-in. Three steps and you're in:
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 text-left">
          {STEPS.map(({ Icon, title, body }, i) => (
            <motion.div
              key={title}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3.5 rounded-xl border border-hairline bg-surface-1 px-4 py-3.5"
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, delay: 0.08 + i * 0.07, ease: EASE }}
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                <Icon aria-hidden className="size-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-xs leading-relaxed text-ink-subtle">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {mode === "choose" ? (
          <div className="flex w-full flex-col gap-2">
            <Button className="w-full" size="lg" variant="primary" onPress={() => generate()}>
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

        <p className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
          <ShieldCheck aria-hidden className="size-3.5" />
          Testnet only — keys stay on this device, nothing leaves your machine.
        </p>
      </motion.div>
    </div>
  );
}
