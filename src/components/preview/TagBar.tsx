import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@heroui/react";
import type { BlobFile } from "@waldrive/shared";
import { useTags } from "@/hooks/useTags";

/** Inline tag chips + add-tag affordance for a file. */
export function TagBar({ file }: { file: BlobFile }) {
  const { addTag, removeTag, busy, error } = useTags();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  async function submit() {
    if (draft.trim() && (await addTag(file.objectId, draft))) {
      setDraft("");
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-1 flex-wrap items-center gap-1.5">
      {file.tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-md bg-surface-2 py-0.5 pl-2 pr-1 text-xs text-ink-muted"
        >
          {tag}
          <button
            aria-label={`Remove tag ${tag}`}
            className="rounded text-ink-tertiary outline-none transition-colors hover:text-ink"
            type="button"
            onClick={() => removeTag(file.objectId, tag)}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <Input
          autoFocus
          aria-label="New tag"
          className="selectable h-6 w-24 text-xs"
          disabled={busy}
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
        <button
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-ink-tertiary outline-none transition-colors hover:text-ink"
          type="button"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-3" /> Tag
        </button>
      )}
      {error && <span className="w-full truncate text-[11px] text-danger" title={error}>{error}</span>}
    </div>
  );
}
