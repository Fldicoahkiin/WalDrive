import { useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { ProgressBar } from "@heroui/react";
import type { UploadStatus } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { useUpload } from "@/hooks/useUpload";
import { cn } from "@/lib/cn";

type Stage = Extract<UploadStatus, "uploading" | "saving_meta" | "done">;
const STAGE: Record<Stage, { value: number; color: "warning" | "accent" | "success"; label: string }> = {
  uploading: { value: 40, color: "warning", label: "Uploading to Walrus…" },
  saving_meta: { value: 80, color: "accent", label: "Registering on Sui…" },
  done: { value: 100, color: "success", label: "Stored" },
};

export function UploadZone() {
  const { upload, status, error, reset } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = status === "uploading" || status === "saving_meta";
  const stage = status in STAGE ? STAGE[status as Stage] : null;

  function pick(files: FileList | null) {
    if (files && files.length > 0) void upload(files[0]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors duration-150",
        dragging ? "border-accent bg-surface-1" : "border-hairline",
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
          aria-label={stage.label}
          className="flex-1 gap-1"
          color={stage.color}
          value={stage.value}
        >
          <span className="text-xs text-ink-subtle">{stage.label}</span>
          <ProgressBar.Track className="h-1.5">
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      ) : status === "failed" ? (
        <span className="flex-1 truncate text-sm text-danger" title={error ?? undefined}>
          {error ?? "Upload failed."}
        </span>
      ) : (
        <span className="flex flex-1 items-center gap-2.5 text-sm text-ink-subtle">
          <Upload aria-hidden className="size-4" />
          Drag a file here, or
        </span>
      )}

      {!busy && (
        <Button
          size="sm"
          variant={status === "failed" ? "secondary" : "primary"}
          onPress={() => (status === "failed" ? reset() : inputRef.current?.click())}
        >
          {status === "failed" ? "Retry" : "Choose file"}
        </Button>
      )}
    </div>
  );
}
