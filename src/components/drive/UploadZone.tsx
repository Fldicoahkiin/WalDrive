"use client";

import { useRef, useState, type DragEvent } from "react";
import { Button, Spinner } from "@heroui/react";
import { Upload } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";

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
      className={`flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center transition-colors ${
        dragging ? "border-accent bg-surface-1" : "border-hairline"
      }`}
    >
      <input ref={inputRef} type="file" hidden onChange={(e) => pick(e.target.files)} />
      {busy ? (
        <>
          <Spinner size="sm" />
          <p className="text-sm text-ink-subtle">
            {status === "uploading"
              ? "Uploading to Walrus…"
              : "Approve in your wallet to register on Sui…"}
          </p>
        </>
      ) : (
        <>
          <Upload className="size-6 text-ink-subtle" aria-hidden />
          <p className="text-sm text-ink-subtle">Drag a file here to store it on Walrus</p>
          <Button variant="primary" onPress={() => inputRef.current?.click()}>
            Choose file
          </Button>
        </>
      )}
      {status === "failed" && error && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="secondary" size="sm" onPress={reset}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
