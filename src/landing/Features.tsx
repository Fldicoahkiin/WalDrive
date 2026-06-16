import { UploadCloud, Eye, GitBranch, HardDrive } from "lucide-react";
import { CONTAINER } from "./shared";
import { SectionHeading } from "./primitives";
import { FeatureRow } from "./FeatureRow";
import { WindowFrame } from "./WindowFrame";
import { VersionMock, LifecycleMock } from "./mocks";

export function Features() {
  return (
    <section className={`scroll-mt-20 py-20 sm:py-28 ${CONTAINER}`} id="features">
      <SectionHeading
        align="center"
        eyebrow="The console"
        lede="Not a tech demo. A fluid, native-feeling desktop app where every action writes real state to Sui and Walrus."
        title="Everything you expect from a drive, all on-chain"
      />

      <div className="mt-16 flex flex-col gap-20 sm:gap-28">
        <FeatureRow
          Icon={UploadCloud}
          body="Drop one file or a dozen. WalDrive PUTs the bytes to the Walrus publisher, signs the FileRecord on Sui in-process, and the file appears in the grid live — optimistic first, confirmed on-chain a moment later."
          eyebrow="Drag-to-upload"
          points={[
            "Multi-file drag, with a per-file progress stage",
            "Local Ed25519 key signs in-process — no popup",
            "Appears instantly, reconciles against chain",
          ]}
          title="Drag in, and it is on a decentralized network"
          visual={
            <WindowFrame
              alt="WalDrive file grid with the drag-to-upload zone"
              src="/landing/app-grid.png"
            />
          }
        />

        <FeatureRow
          flip
          Icon={Eye}
          body="Open any file and WalDrive streams it straight from the public aggregator — no wallet, no download step. The same panel re-fetches the bytes and hashes them on screen so anyone can verify the content matches its blob ID."
          eyebrow="Instant preview + verify"
          points={[
            "Markdown, JSON, code, images, PDF and video",
            "One-click content verification against the blob ID",
            "Open raw or jump to Suiscan for the on-chain record",
          ]}
          title="Preview anything, verify it on the spot"
          visual={
            <WindowFrame
              alt="WalDrive verifiable-storage panel: content ID, live verify, raw and Suiscan links"
              label="WalDrive — Verify"
              src="/landing/app-verify.png"
            />
          }
        />

        <FeatureRow
          Icon={GitBranch}
          body="Upload a new version and the old one stays linked on-chain as its own FileRecord. Browse the history, then roll back to any earlier version in one click — every revision is a verifiable object, not a database row."
          eyebrow="Version history"
          points={[
            "Each version is its own on-chain FileRecord",
            "One-click rollback to any earlier revision",
            "Latest-only in the grid; full chain on demand",
          ]}
          title="On-chain version history with one-click rollback"
          visual={<VersionMock />}
        />

        <FeatureRow
          flip
          Icon={HardDrive}
          body="Because the Walrus Blob object lands in your wallet, you control its lifetime. Extend the storage before it expires so the data survives, or delete it for good. Client-side search keeps the whole drive a keystroke away."
          eyebrow="Blob lifecycle + search"
          points={[
            "Extend storage epochs before expiry",
            "Delete the blob you own — no host to ask",
            "Zero-latency client-side search and type filters",
          ]}
          title="Own the blob, control its lifetime"
          visual={<LifecycleMock />}
        />
      </div>
    </section>
  );
}
