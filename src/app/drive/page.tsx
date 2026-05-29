"use client";

import { useMemo, useState } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Spinner } from "@heroui/react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { UploadZone } from "@/components/drive/UploadZone";
import { FileGrid } from "@/components/drive/FileGrid";
import { FileDetailPanel } from "@/components/drive/FileDetailPanel";
import { useFiles } from "@/hooks/useFiles";
import type { BlobFile } from "@waldrive/shared";

export default function DrivePage() {
  const account = useCurrentAccount();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">{account ? <DriveContent /> : <ConnectPrompt />}</main>
      </div>
    </div>
  );
}

function DriveContent() {
  const { data: files, isLoading, isError, error } = useFiles();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BlobFile | null>(null);

  const filtered = useMemo(() => {
    if (!files) return [];
    const q = query.trim().toLowerCase();
    return q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;
  }, [files, query]);

  const hasFiles = Boolean(files && files.length > 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <UploadZone />

      {hasFiles && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files…"
          className="w-full rounded-lg border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
        />
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}
      {isError && (
        <p className="py-4 text-center text-sm text-red-400">
          Failed to load files: {error instanceof Error ? error.message : "unknown error"}
        </p>
      )}
      {files && files.length === 0 && (
        <p className="py-12 text-center text-sm text-ink-subtle">No files yet — upload one above.</p>
      )}
      {filtered.length > 0 && <FileGrid files={filtered} onOpen={setSelected} />}
      {hasFiles && filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-ink-subtle">No files match “{query}”.</p>
      )}

      {selected && <FileDetailPanel file={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ConnectPrompt() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Connect your wallet</h2>
      <p className="mt-2 text-sm text-ink-subtle">
        A Sui wallet is required to view and manage your files.
      </p>
      <div className="mt-6">
        <ConnectButton />
      </div>
    </div>
  );
}
