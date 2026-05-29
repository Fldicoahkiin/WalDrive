"use client";

import { FileText, FolderClosed, Share2, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "all-files", label: "All files", icon: FileText },
  { id: "folders", label: "Folders", icon: FolderClosed },
  { id: "shared", label: "Shared", icon: Share2 },
  { id: "trash", label: "Trash", icon: Trash2 },
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-hairline bg-canvas px-3 py-4 sm:block">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-subtle transition-colors hover:bg-surface-1 hover:text-ink"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
