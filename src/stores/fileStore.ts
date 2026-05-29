import { create } from "zustand";
import type { ViewMode } from "@waldrive/shared";

interface FileStore {
  viewMode: ViewMode;
  selectedIds: Set<string>;
  setViewMode: (mode: ViewMode) => void;
  toggleSelected: (objectId: string) => void;
  clearSelection: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  viewMode: "grid",
  selectedIds: new Set(),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSelected: (objectId) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(objectId)) next.delete(objectId);
      else next.add(objectId);
      return { selectedIds: next };
    }),
  clearSelection: () => set({ selectedIds: new Set() }),
}));
