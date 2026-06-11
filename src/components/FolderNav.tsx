import { useMemo, useState } from "react";
import { ChevronRight, Folder as FolderIcon, FolderPlus } from "lucide-react";
import { Input } from "@heroui/react";
import type { SuiFolder } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { useFolder } from "@/hooks/useFolder";

/** Breadcrumb + create-folder + subfolder tiles for the current folder. */
export function FolderNav({
  folders,
  folderId,
  onNavigate,
}: {
  folders: SuiFolder[];
  folderId: string | null;
  onNavigate: (id: string | null) => void;
}) {
  const { createFolder, busy, error } = useFolder();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const byId = useMemo(() => new Map(folders.map((f) => [f.objectId, f])), [folders]);
  const chain = useMemo(() => {
    const out: SuiFolder[] = [];
    let cur: string | null = folderId;
    while (cur) {
      const f = byId.get(cur);
      if (!f) break;
      out.unshift(f);
      cur = f.parentId;
    }
    return out;
  }, [byId, folderId]);
  const subfolders = folders.filter((f) => (f.parentId ?? null) === folderId);

  async function submit() {
    if (draft.trim() && (await createFolder(draft.trim(), folderId))) {
      setDraft("");
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <button
          className="rounded px-1 text-ink-subtle outline-none transition-colors hover:text-ink"
          type="button"
          onClick={() => onNavigate(null)}
        >
          All Files
        </button>
        {chain.map((f) => (
          <span key={f.objectId} className="flex items-center gap-1">
            <ChevronRight aria-hidden className="size-3.5 text-ink-tertiary" />
            <button
              className="rounded px-1 text-ink-subtle outline-none transition-colors hover:text-ink aria-[current=true]:text-ink"
              aria-current={f.objectId === folderId}
              type="button"
              onClick={() => onNavigate(f.objectId)}
            >
              {f.name}
            </button>
          </span>
        ))}
        {adding ? (
          <Input
            autoFocus
            aria-label="Folder name"
            className="ml-1 h-6 w-32 text-xs"
            disabled={busy}
            placeholder="Folder name"
            value={draft}
            variant="secondary"
            onBlur={() => {
              setAdding(false);
              setDraft("");
            }}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
              else if (e.key === "Escape") {
                setAdding(false);
                setDraft("");
              }
            }}
          />
        ) : (
          <Button className="ml-1" isDisabled={busy} size="sm" variant="ghost" onPress={() => setAdding(true)}>
            <FolderPlus className="size-3.5" /> New folder
          </Button>
        )}
        {error && <span className="truncate text-[11px] text-danger" title={error}>{error}</span>}
      </div>

      {subfolders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subfolders.map((f) => (
            <button
              key={f.objectId}
              className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-focus/50"
              type="button"
              onClick={() => onNavigate(f.objectId)}
            >
              <FolderIcon aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
