import Link from "next/link";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { HardDrive } from "lucide-react";
import { blobUrl } from "@/lib/utils";
import { SUI_NETWORK, CONTRACT } from "@/lib/constants";

interface ShareLink {
  blobId: string;
  fileName: string;
}

/** Resolve a ShareLink object (its id is the share code) — public, wallet-free read. */
async function resolveShareLink(objectId: string): Promise<ShareLink | null> {
  try {
    const client = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
    const obj = await client.getObject({ id: objectId, options: { showContent: true } });
    const content = obj.data?.content;
    if (
      content?.dataType === "moveObject" &&
      content.type.endsWith(`::${CONTRACT.SHARE_LINK}::ShareLink`)
    ) {
      const f = content.fields as Record<string, unknown>;
      return { blobId: String(f.blob_id), fileName: String(f.file_name) };
    }
  } catch {
    return null;
  }
  return null;
}

export default async function SharePage({ params }: { params: Promise<{ shareCode: string }> }) {
  const { shareCode } = await params;
  const link = await resolveShareLink(shareCode);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 py-16">
      <div className="flex w-full max-w-2xl flex-col items-center">
        <Link href="/" className="mb-8 flex items-center gap-2 text-ink-subtle">
          <HardDrive className="size-5 text-accent" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">WalDrive</span>
        </Link>

        {!link ? (
          <p className="text-sm text-ink-subtle">This share link is invalid or no longer exists.</p>
        ) : (
          <div className="flex w-full flex-col items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight text-ink">{link.fileName}</h1>
            <SharePreview fileName={link.fileName} url={blobUrl(link.blobId)} />
            <a
              href={blobUrl(link.blobId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline"
            >
              Open / download
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

function SharePreview({ fileName, url }: { fileName: string; url: string }) {
  if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(fileName)) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={fileName}
        className="max-h-[60vh] rounded-xl border border-hairline object-contain"
      />
    );
  }
  if (/\.pdf$/i.test(fileName)) {
    return (
      <iframe src={url} title={fileName} className="h-[60vh] w-full rounded-xl border border-hairline" />
    );
  }
  return (
    <div className="rounded-xl border border-hairline bg-surface-1 px-6 py-10 text-sm text-ink-subtle">
      Preview not available for this file type.
    </div>
  );
}
