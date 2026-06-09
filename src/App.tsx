import { useEffect, useMemo, useState } from "react";
import { FolderOpen, LayoutGrid, List, SearchX } from "lucide-react";
import { SearchField, ToggleButton, ToggleButtonGroup } from "@heroui/react";
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
              <SearchField
                aria-label="Search files"
                className="max-w-sm flex-1"
                value={query}
                onChange={setQuery}
              >
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input className="selectable" placeholder="Search files…" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <ToggleButtonGroup
                  aria-label="Sort by"
                  disallowEmptySelection
                  selectedKeys={new Set([sort])}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const k = [...(keys as Set<string>)][0];
                    if (k) setSort(k as SortKey);
                  }}
                >
                  {SORTS.map((sb) => (
                    <ToggleButton key={sb.key} id={sb.key}>
                      {sb.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <ToggleButtonGroup
                  aria-label="View"
                  disallowEmptySelection
                  selectedKeys={new Set([view])}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const k = [...(keys as Set<string>)][0];
                    if (k) setView(k as ViewMode);
                  }}
                >
                  {VIEWS.map((v) => (
                    <ToggleButton key={v.key} isIconOnly aria-label={v.label} id={v.key}>
                      <v.Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
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
