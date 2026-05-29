"use client";

import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";
import { HardDrive } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-hairline bg-canvas/80 px-6 backdrop-blur">
      <Link href="/" className="flex items-center gap-2 text-ink">
        <HardDrive className="size-5 text-accent" aria-hidden />
        <span className="text-sm font-semibold tracking-tight">WalDrive</span>
      </Link>
      <ConnectButton />
    </header>
  );
}
