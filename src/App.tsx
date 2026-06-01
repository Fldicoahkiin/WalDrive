import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@heroui/react";
import type { BlobFile } from "@waldrive/shared";
import { TitleBar } from "@/components/TitleBar";
import { Sidebar } from "@/components/Sidebar";
import { UploadZone } from "@/components/UploadZone";
import { FileGrid, FileGridSkeleton } from "@/components/FileGrid";
import { PreviewModal } from "@/components/PreviewModal";
import { useFiles } from "@/hooks/useFiles";
import { useWallet } from "@/stores/walletStore";

export function App() {
  const initWallet = useWallet((s) => s.init);
  useEffect(() => {
    initWallet();
  }, [initWallet]);

  const { data: files, isLoading } = useFiles();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BlobFile | null>(null);

  const filtered = useMemo(() => {
    if (!files) return [];
    const q = query.trim().toLowerCase();
    return q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;
  }, [files, query]);

  return (
    <div className="flex h-dvh flex-col bg-canvas text-ink">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-6">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-ink-tertiary"
              />
              <Input
                fullWidth
                aria-label="Search files"
                className="selectable pl-9"
                placeholder="Search files…"
                value={query}
                variant="secondary"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <UploadZone />

            {isLoading ? (
              <FileGridSkeleton />
            ) : filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-ink-subtle">
                {query
                  ? `No files match “${query}”.`
                  : "No files yet. Drag one above to store it on Walrus."}
              </p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-medium text-ink">Files</h2>
                  <span className="text-xs text-ink-tertiary">{filtered.length}</span>
                </div>
                <FileGrid
                  files={filtered}
                  selectedId={selected?.objectId ?? null}
                  onOpen={setSelected}
                />
              </>
            )}
          </div>
        </main>
      </div>
      <PreviewModal file={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
