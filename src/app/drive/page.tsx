"use client";

import { Button } from "@heroui/react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { FolderOpen, Upload } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";

export default function DrivePage() {
  const account = useCurrentAccount();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center p-8">
          {account ? <EmptyDrive /> : <ConnectPrompt />}
        </main>
      </div>
    </div>
  );
}

function EmptyDrive() {
  return (
    <div className="flex max-w-sm flex-col items-center text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-xl border border-hairline bg-surface-1">
        <FolderOpen className="size-7 text-ink-subtle" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-ink">No files yet</h2>
      <p className="mt-2 text-sm text-ink-subtle">
        Upload a file to store it on Walrus and register its metadata on Sui.
      </p>
      <Button variant="primary" className="mt-6" isDisabled>
        <Upload className="size-4" aria-hidden />
        Upload file
      </Button>
    </div>
  );
}

function ConnectPrompt() {
  return (
    <div className="flex max-w-sm flex-col items-center text-center">
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
