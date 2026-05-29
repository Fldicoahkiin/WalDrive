"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { ArrowRight, HardDrive } from "lucide-react";

export default function LandingPage() {
  const account = useCurrentAccount();
  const router = useRouter();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 py-24">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-hairline bg-surface-1">
          <HardDrive className="size-6 text-accent" aria-hidden />
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">WalDrive</h1>
        <p className="mt-4 max-w-md text-base text-ink-subtle">
          A file manager for Walrus decentralized storage. Metadata on Sui, blobs on Walrus, no
          backend in between.
        </p>

        <Card className="mt-10 w-full bg-surface-1">
          <Card.Header>
            <Card.Title>Connect your wallet</Card.Title>
            <Card.Description>
              {account
                ? "Wallet connected — open your drive to get started."
                : "Connect a Sui wallet to upload and manage files on Walrus."}
            </Card.Description>
          </Card.Header>
          <Card.Footer className="flex items-center gap-3">
            <ConnectButton />
            {account ? (
              <Button variant="primary" onPress={() => router.push("/drive")}>
                Open drive
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button variant="secondary" isDisabled>
                Open drive
              </Button>
            )}
          </Card.Footer>
        </Card>
      </div>
    </main>
  );
}
