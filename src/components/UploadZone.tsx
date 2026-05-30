import { useRef, useState, type DragEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function UploadZone() {
  const { upload, status, error, reset } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = status === "uploading" || status === "saving_meta";

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
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors",
        dragging ? "border-accent bg-surface-1" : "border-hairline",
      )}
    >
      <input ref={inputRef} type="file" hidden onChange={(e) => pick(e.target.files)} />
      <div className="flex items-center gap-2.5 text-sm text-ink-subtle">
        {busy ? (
          <Loader2 className="size-4 animate-spin text-accent" />
        ) : (
          <Upload className="size-4" />
        )}
        <span>
          {status === "uploading"
            ? "Uploading to Walrus…"
            : status === "saving_meta"
              ? "Registering on Sui…"
              : status === "failed"
                ? <span className="text-danger">{error}</span>
                : "Drag a file here, or"}
        </span>
      </div>
      {!busy && (
        <Button
          variant="primary"
          onClick={() => (status === "failed" ? reset() : inputRef.current?.click())}
        >
          {status === "failed" ? "Retry" : "Choose file"}
        </Button>
      )}
    </div>
  );
}
