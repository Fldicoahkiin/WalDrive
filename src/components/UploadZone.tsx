import { openExternal } from "@/lib/openExternal";
import { useRef, useState, type DragEvent } from "react";
import { motion } from "motion/react";
import { Check, Droplet, Loader2, Upload } from "lucide-react";
import { ProgressBar } from "@heroui/react";
import type { UploadStatus } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { useUpload } from "@/hooks/useUpload";
import { useFaucet } from "@/hooks/useFaucet";
import { useSettings } from "@/stores/settingsStore";
import { cn } from "@/lib/cn";

type Stage = Extract<UploadStatus, "uploading" | "saving_meta" | "done">;
const STAGE: Record<Stage, { value: number; color: "warning" | "accent" | "success"; label: string }> = {
  uploading: { value: 40, color: "warning", label: "Uploading to Walrus…" },
  saving_meta: { value: 80, color: "accent", label: "Registering on Sui…" },
  done: { value: 100, color: "success", label: "Stored" },
};

export function UploadZone() {
  const { upload, status, error, needsGas, reset } = useUpload();
  const faucet = useFaucet();
  const uploadMethod = useSettings((s) => s.uploadMethod);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = status === "uploading" || status === "saving_meta";
  const stage = status in STAGE ? STAGE[status as Stage] : null;
  const stageLabel =
    stage && status === "uploading" && uploadMethod === "wallet"
      ? "Encoding & storing on Walrus (paid by your wallet)…"
      : stage?.label;

  function pick(files: FileList | null) {
    if (files && files.length > 0) void upload(files[0]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files);
  }

  const idle = !stage && status !== "failed";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-dashed px-4 py-3.5 transition-[background-color,border-color] duration-200",
        idle ? "justify-center" : "justify-between",
        dragging ? "border-accent bg-accent/5" : "border-hairline hover:border-hairline-strong",
      )}
      onDragLeave={() => setDragging(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDrop={onDrop}
    >
      <input ref={inputRef} hidden type="file" onChange={(e) => pick(e.target.files)} />

      {stage ? (
        <ProgressBar
          aria-label={stageLabel}
          className="flex-1 gap-1"
          color={stage.color}
          value={stage.value}
        >
          <span className="text-xs text-ink-subtle">{stageLabel}</span>
          <ProgressBar.Track className="h-1.5">
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      ) : status === "failed" ? (
        <span className="flex-1 truncate text-sm text-danger" title={error ?? undefined}>
          {error ?? "Upload failed."}
        </span>
      ) : (
        <span className="flex items-center gap-2 text-sm text-ink-subtle">
          <motion.span
            animate={{ y: dragging ? -2 : 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Upload aria-hidden className={cn("size-4", dragging && "text-accent")} />
          </motion.span>
          {dragging ? "Drop to upload" : "Drag a file here, or"}
        </span>
      )}

      {!busy && !dragging && (
        <div className="flex shrink-0 items-center gap-2">
          {status === "failed" && needsGas && faucet.available && (
            <Button
              isDisabled={faucet.status === "loading"}
              size="sm"
              variant="primary"
              onPress={() =>
                faucet.status === "error" ? openExternal(faucet.webFaucetUrl) : faucet.request()
              }
            >
              {faucet.status === "loading" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : faucet.status === "ok" ? (
                <Check className="size-3.5" />
              ) : (
                <Droplet className="size-3.5" />
              )}
              {faucet.status === "ok"
                ? "SUI on its way"
                : faucet.status === "error"
                  ? "Web faucet"
                  : "Get test SUI"}
            </Button>
          )}
          <Button
            size="sm"
            variant={status === "failed" ? "secondary" : "primary"}
            onPress={() => (status === "failed" ? reset() : inputRef.current?.click())}
          >
            {status === "failed" ? "Retry" : "Choose file"}
          </Button>
        </div>
      )}
    </div>
  );
}
