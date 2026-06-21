import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BlobFile } from "@waldrive/shared";
import { useSuiClient } from "@/lib/suiClient";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { sealDecrypt } from "@/lib/seal";
import { blobUrl } from "@/lib/constants";

interface BlobSource {
  /** A URL the preview can render: the public aggregator URL for plain files,
   *  or an in-memory object URL of the decrypted bytes for encrypted ones. */
  url: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Resolve a renderable source for a file. Plain blobs use the wallet-free
 * aggregator URL directly; Seal-encrypted blobs are fetched, decrypted with the
 * owner's session key, and exposed as an object URL (revoked on change/unmount).
 */
export function useBlobSource(file: BlobFile): BlobSource {
  const encrypted = Boolean(file.isEncrypted);
  const keypair = useWallet((s) => s.keypair);
  const packageId = useSettings((s) => s.packageId);
  const suiClient = useSuiClient();

  const query = useQuery({
    queryKey: ["blob-source", file.objectId, packageId],
    enabled: encrypted,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    queryFn: async () => {
      if (!keypair) throw new Error("Generate or import the owner wallet to decrypt this file.");
      const res = await fetch(blobUrl(file.blobId));
      if (!res.ok) throw new Error(`Couldn't fetch the blob (HTTP ${res.status}).`);
      const ciphertext = new Uint8Array(await res.arrayBuffer());
      const plain = await sealDecrypt(ciphertext, {
        owner: file.owner,
        packageId,
        keypair,
        suiClient,
      });
      return URL.createObjectURL(new Blob([plain], { type: file.mimeType || "application/octet-stream" }));
    },
  });

  useEffect(() => {
    const url = query.data;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [query.data]);

  if (!encrypted) return { url: blobUrl(file.blobId), loading: false, error: null };
  return {
    url: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
