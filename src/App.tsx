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
import { cn } from "@/lib/cn";

type SortKey = "date" | "name" | "size";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "name", label: "Name" },
  { key: "size", label: "Size" },
];

export function App() {
  const initWallet = useWallet((s) => s.init);
  useEffect(() => {
    initWallet();
  }, [initWallet]);

  const { data: files, isLoading } = useFiles();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [selected, setSelected] = useState<BlobFile | null>(null);

  const visible = useMemo(() => {
    if (!files) return [];
    const q = query.trim().toLowerCase();
    const matched = q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;
    return [...matched].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "size"
          ? b.size - a.size
          : b.uploadedAtMs - a.uploadedAtMs,
    );
  }, [files, query, sort]);

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
            ) : visible.length === 0 ? (
              <p className="py-16 text-center text-sm text-ink-subtle">
                {query
                  ? `No files match “${query}”.`
                  : "No files yet. Drag one above to store it on Walrus."}
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-sm font-medium text-ink">Files</h2>
                    <span className="text-xs text-ink-tertiary">{visible.length}</span>
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg border border-hairline bg-surface-1 p-0.5">
                    {SORTS.map((s) => (
                      <button
                        key={s.key}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs transition-colors",
                          sort === s.key
                            ? "bg-surface-2 text-ink"
                            : "text-ink-subtle hover:text-ink",
                        )}
                        type="button"
                        onClick={() => setSort(s.key)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <FileGrid
                  files={visible}
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
