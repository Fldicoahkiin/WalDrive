import { Files, Folder, Settings, Trash2 } from "lucide-react";
import { Header, ListBox, Separator } from "@heroui/react";
import type { BlobFile, SuiFolder } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { formatBytes } from "@/lib/utils";
import { fileCategory, tagColor, CATEGORY_META, type FileCategory } from "@/lib/fileKind";

export type NavKey = "all" | "trash" | FileCategory | `folder:${string}` | `tag:${string}`;

const NAV_ITEM =
  "text-ink outline-none aria-selected:bg-surface-2 data-[hovered=true]:bg-surface-2";
const SECTION_HEADER = "px-2 pb-0.5 pt-3 text-[11px] font-medium text-ink-tertiary select-none";

export function Sidebar({
  files,
  folders,
  active,
  onSelect,
  onOpenSettings,
}: {
  files: BlobFile[];
  folders: SuiFolder[];
  active: NavKey;
  onSelect: (key: NavKey) => void;
  onOpenSettings: () => void;
}) {
  const live = files.filter((f) => !f.isDeleted);
  const trashedCount = files.length - live.length;
  const counts = live.reduce(
    (acc, f) => {
      const c = fileCategory(f.mimeType, f.name);
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    },
    {} as Record<FileCategory, number>,
  );
  const present = (Object.keys(CATEGORY_META) as FileCategory[]).filter((c) => counts[c]);
  const totalBytes = live.reduce((sum, f) => sum + f.size, 0);
  const rootFolders = folders.filter((f) => !f.parentId);
  const tagCounts = new Map<string, number>();
  for (const f of live) for (const t of f.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-surface-1">
      <div data-tauri-drag-region className="h-12 shrink-0" />
      <AccountSwitcher onOpenSettings={onOpenSettings} />

      <div className="min-h-0 flex-1 overflow-y-auto pt-1">
        <ListBox
          aria-label="Navigate files"
          className="gap-0.5 border-none bg-transparent px-2 py-1 shadow-none"
          disallowEmptySelection
          selectedKeys={new Set([active])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            const next = [...(keys as Set<string>)][0];
            if (next) onSelect(next as NavKey);
          }}
        >
          <ListBox.Item className={NAV_ITEM} id="all" textValue="All Files">
            <Files aria-hidden className="size-4 text-ink-subtle" strokeWidth={1.75} />
            <span className="flex-1">All Files</span>
            <span className="text-xs tabular-nums text-ink-tertiary">{live.length}</span>
          </ListBox.Item>

          {rootFolders.length > 0 && (
            <ListBox.Section>
              <Header className={SECTION_HEADER}>Folders</Header>
              {rootFolders.map((f) => (
                <ListBox.Item
                  key={f.objectId}
                  className={NAV_ITEM}
                  id={`folder:${f.objectId}`}
                  textValue={f.name}
                >
                  <Folder aria-hidden className="size-4 text-ink-subtle" strokeWidth={1.75} />
                  <span className="flex-1 truncate">{f.name}</span>
                </ListBox.Item>
              ))}
            </ListBox.Section>
          )}

          {present.length > 0 && (
            <ListBox.Section>
              <Header className={SECTION_HEADER}>Types</Header>
              {present.map((c) => {
                const { label, Icon } = CATEGORY_META[c];
                return (
                  <ListBox.Item key={c} className={NAV_ITEM} id={c} textValue={label}>
                    <Icon aria-hidden className="size-4 text-ink-subtle" strokeWidth={1.75} />
                    <span className="flex-1">{label}</span>
                    <span className="text-xs tabular-nums text-ink-tertiary">{counts[c]}</span>
                  </ListBox.Item>
                );
              })}
            </ListBox.Section>
          )}

          {tags.length > 0 && (
            <ListBox.Section>
              <Header className={SECTION_HEADER}>Tags</Header>
              {tags.map(([name, count]) => (
                <ListBox.Item key={name} className={NAV_ITEM} id={`tag:${name}`} textValue={name}>
                  <span
                    aria-hidden
                    className="mx-1 size-2 shrink-0 rounded-full"
                    style={{ background: tagColor(name) }}
                  />
                  <span className="flex-1 truncate">{name}</span>
                  <span className="text-xs tabular-nums text-ink-tertiary">{count}</span>
                </ListBox.Item>
              ))}
            </ListBox.Section>
          )}

          {trashedCount > 0 && (
            <ListBox.Section>
              <Separator className="mx-1 my-1.5" />
              <ListBox.Item className={NAV_ITEM} id="trash" textValue="Trash">
                <Trash2 aria-hidden className="size-4 text-ink-subtle" strokeWidth={1.75} />
                <span className="flex-1">Trash</span>
                <span className="text-xs tabular-nums text-ink-tertiary">{trashedCount}</span>
              </ListBox.Item>
            </ListBox.Section>
          )}
        </ListBox>
      </div>

      <div className="flex flex-col gap-1 border-t border-hairline p-2">
        <span className="select-none px-2 text-[11px] text-ink-tertiary">
          {live.length} {live.length === 1 ? "file" : "files"} · {formatBytes(totalBytes)}
        </span>
        <Button
          className="justify-start gap-2 text-ink-subtle"
          size="sm"
          variant="ghost"
          onPress={onOpenSettings}
        >
          <Settings aria-hidden className="size-4" />
          Settings
        </Button>
      </div>
    </aside>
  );
}
