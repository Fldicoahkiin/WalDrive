import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TitleBar } from "@/components/TitleBar";
import { Sidebar } from "@/components/Sidebar";
import { UploadZone } from "@/components/UploadZone";
import { FileGrid } from "@/components/FileGrid";
import { PreviewModal } from "@/components/PreviewModal";
import { useFiles } from "@/hooks/useFiles";
import { useWallet } from "@/stores/walletStore";
import type { BlobFile } from "@waldrive/shared";

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
        <main className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files…"
              className="selectable w-full rounded-lg border border-hairline bg-surface-1 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-tertiary focus:border-accent focus:outline-none"
            />
          </div>

          <UploadZone />

          {isLoading ? (
            <p className="py-16 text-center text-sm text-ink-subtle">Loading files…</p>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-subtle">
              {query
                ? `No files match "${query}".`
                : "No files yet — drag one above to store it on Walrus."}
            </p>
          ) : (
            <FileGrid files={filtered} onOpen={setSelected} />
          )}
        </main>
      </div>
      <PreviewModal file={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
