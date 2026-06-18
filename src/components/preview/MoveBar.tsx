import { ListBox, Select } from "@heroui/react";
import type { BlobFile } from "@waldrive/shared";
import { useFolders } from "@/hooks/useFolders";
import { useFolder } from "@/hooks/useFolder";

/** Folder picker that moves a file in/out of folders. Hidden when no folders exist. */
export function MoveBar({ file }: { file: BlobFile }) {
  const { data: folders } = useFolders();
  const { moveToFolder, removeFromFolder, busy, error } = useFolder();
  if (!folders || folders.length === 0) return null;
  const current = file.folderId ?? "root";

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
    <Select
      aria-label="Move to folder"
      className="w-36 shrink-0"
      isDisabled={busy}
      placeholder="Move to…"
      selectedKey={current}
      onSelectionChange={(key) => {
        const k = String(key);
        if (k === current) return;
        if (k === "root") void removeFromFolder(file.objectId);
        else void moveToFolder(file.objectId, k);
      }}
    >
      <Select.Trigger className="h-7 text-xs">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="root" textValue="All Files">
            All Files
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {folders.map((fo) => (
            <ListBox.Item key={fo.objectId} id={fo.objectId} textValue={fo.name}>
              {fo.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
    {error && <span className="max-w-44 truncate text-[11px] text-danger" title={error}>{error}</span>}
    </div>
  );
}
