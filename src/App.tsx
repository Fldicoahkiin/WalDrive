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
import { FaucetBanner } from "@/components/FaucetBanner";
import { FolderNav } from "@/components/FolderNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useFiles } from "@/hooks/useFiles";
import { useFolders } from "@/hooks/useFolders";
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
  const { data: folders } = useFolders();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [view, setView] = useState<ViewMode>("grid");
  const [nav, setNav] = useState<NavKey>("all");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<BlobFile | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  function handleSelect(key: NavKey) {
    if (key.startsWith("folder:")) {
      setNav("all");
      setFolderId(key.slice(7));
    } else {
      setNav(key);
      setFolderId(null);
    }
  }

  // Switching accounts swaps the whole tree — reset the view context.
  useEffect(() => {
    setNav("all");
    setFolderId(null);
    setQuery("");
    setSelected(null);
  }, [address]);

  // Drop back to "all" when the active view (type, tag, trash) empties out.
  useEffect(() => {
    if (!files) return;
    const live = files.filter((f) => !f.isDeleted);
    const stale =
      (nav === "trash" && !files.some((f) => f.isDeleted)) ||
      (nav.startsWith("tag:") && !live.some((f) => f.tags.includes(nav.slice(4)))) ||
      (nav !== "all" &&
        nav !== "trash" &&
        !nav.startsWith("tag:") &&
        !live.some((f) => fileCategory(f.mimeType, f.name) === nav));
    if (stale) setNav("all");
  }, [files, nav]);

  // The sidebar highlights the folder's root ancestor while browsing inside it.
  const activeNav: NavKey = useMemo(() => {
    if (nav !== "all" || !folderId || !folders) return nav;
    const byId = new Map(folders.map((f) => [f.objectId, f]));
    let cur = byId.get(folderId);
    while (cur?.parentId && byId.has(cur.parentId)) cur = byId.get(cur.parentId);
    return cur ? (`folder:${cur.objectId}` as NavKey) : nav;
  }, [nav, folderId, folders]);

  const visible = useMemo(() => {
    if (!files) return [];
    const q = query.trim().toLowerCase();
    return files
      .filter((f) => (nav === "trash" ? f.isDeleted : !f.isDeleted))
      .filter((f) => {
        if (nav === "trash") return true;
        if (nav.startsWith("tag:")) return f.tags.includes(nav.slice(4));
        if (nav === "all") return (f.folderId ?? null) === folderId;
        return fileCategory(f.mimeType, f.name) === nav;
      })
      .filter((f) => (q ? f.name.toLowerCase().includes(q) : true))
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "size"
            ? b.size - a.size
            : b.uploadedAtMs - a.uploadedAtMs,
      );
  }, [files, query, sort, nav, folderId]);

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
            active={activeNav}
            files={files ?? []}
            folders={folders ?? []}
            onOpenSettings={() => setSettingsOpen(true)}
            onSelect={handleSelect}
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
                <FaucetBanner />
                <UploadZone />
                {nav === "all" && (
                  <FolderNav folderId={folderId} folders={folders ?? []} onNavigate={setFolderId} />
                )}
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
