"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Spinner } from "@heroui/react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { UploadZone } from "@/components/drive/UploadZone";
import { FileGrid } from "@/components/drive/FileGrid";
import { useFiles } from "@/hooks/useFiles";

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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <UploadZone />
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
      {files && files.length > 0 && <FileGrid files={files} />}
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
