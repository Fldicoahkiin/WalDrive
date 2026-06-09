import { useEffect, useMemo, useState } from "react";
import { FolderOpen, LayoutGrid, List, Search, SearchX } from "lucide-react";
import { Input } from "@heroui/react";
import type { BlobFile } from "@waldrive/shared";
import { Sidebar, type NavKey } from "@/components/Sidebar";
import { UploadZone } from "@/components/UploadZone";
import { FileGrid, FileGridSkeleton } from "@/components/FileGrid";
import { FileList, FileListSkeleton } from "@/components/FileList";
import { PreviewModal } from "@/components/PreviewModal";
import { SettingsModal } from "@/components/SettingsModal";
import { Onboarding } from "@/components/Onboarding";
import { EmptyState } from "@/components/EmptyState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useFiles } from "@/hooks/useFiles";
import { useWallet } from "@/stores/walletStore";
import { fileCategory } from "@/lib/fileKind";
import { cn } from "@/lib/cn";

type SortKey = "date" | "name" | "size";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "name", label: "Name" },
  { key: "size", label: "Size" },
];

type ViewMode = "grid" | "list";
const VIEWS: { key: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { key: "grid", label: "Grid view", Icon: LayoutGrid },
  { key: "list", label: "List view", Icon: List },
];

export function App() {
  const initWallet = useWallet((s) => s.init);
  const address = useWallet((s) => s.address);
  useEffect(() => {
    initWallet();
  }, [initWallet]);

  const { data: files, isLoading } = useFiles();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [view, setView] = useState<ViewMode>("grid");
  const [category, setCategory] = useState<NavKey>("all");
  const [selected, setSelected] = useState<BlobFile | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Drop back to "all" if the active category no longer has files.
  useEffect(() => {
    if (category !== "all" && files && !files.some((f) => fileCategory(f.mimeType, f.name) === category)) {
      setCategory("all");
    }
  }, [files, category]);

  const visible = useMemo(() => {
    if (!files) return [];
    const q = query.trim().toLowerCase();
    return files
      .filter((f) => category === "all" || fileCategory(f.mimeType, f.name) === category)
      .filter((f) => (q ? f.name.toLowerCase().includes(q) : true))
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "size"
            ? b.size - a.size
            : b.uploadedAtMs - a.uploadedAtMs,
      );
  }, [files, query, sort, category]);

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas text-ink">
      {!address ? (
        <div className="flex h-full w-full flex-col bg-canvas">
          <div data-tauri-drag-region className="h-12 shrink-0" />
          <Onboarding />
        </div>
      ) : (
        <>
          <Sidebar
            active={category}
            files={files ?? []}
            onOpenSettings={() => setSettingsOpen(true)}
            onSelect={setCategory}
          />
          <main className="flex flex-1 flex-col overflow-hidden border-l border-hairline bg-canvas">
            <div
              data-tauri-drag-region
              className="flex h-12 shrink-0 items-center gap-2 border-b border-hairline px-3"
            >
              <div className="relative flex max-w-sm flex-1 items-center">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 z-10 size-4 text-ink-tertiary"
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
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-0.5 rounded-lg border border-hairline bg-surface-1 p-0.5">
                  {SORTS.map((s) => (
                    <button
                      key={s.key}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs transition-colors",
                        sort === s.key ? "bg-surface-2 text-ink" : "text-ink-subtle hover:text-ink",
                      )}
                      type="button"
                      onClick={() => setSort(s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-0.5 rounded-lg border border-hairline bg-surface-1 p-0.5">
                  {VIEWS.map((v) => (
                    <button
                      key={v.key}
                      aria-label={v.label}
                      aria-pressed={view === v.key}
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        view === v.key ? "bg-surface-2 text-ink" : "text-ink-subtle hover:text-ink",
                      )}
                      type="button"
                      onClick={() => setView(v.key)}
                    >
                      <v.Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
                    </button>
                  ))}
                </div>
                <ThemeToggle />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-6">
                <UploadZone />
                {isLoading ? (
                  view === "grid" ? (
                    <FileGridSkeleton />
                  ) : (
                    <FileListSkeleton />
                  )
                ) : visible.length === 0 ? (
                  query ? (
                    <EmptyState
                      Icon={SearchX}
                      description={`Nothing matches “${query}”.`}
                      title="No matches"
                    />
                  ) : (
                    <EmptyState
                      Icon={FolderOpen}
                      description="Drag a file above or choose one to store it on Walrus."
                      title="No files yet"
                    />
                  )
                ) : view === "grid" ? (
                  <FileGrid files={visible} onOpen={setSelected} selectedId={selected?.objectId ?? null} />
                ) : (
                  <FileList files={visible} onOpen={setSelected} selectedId={selected?.objectId ?? null} />
                )}
              </div>
            </div>
          </main>
        </>
      )}
      <PreviewModal file={selected} onClose={() => setSelected(null)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
