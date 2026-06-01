import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  FileType,
  FileVideo,
  type LucideIcon,
} from "lucide-react";

export interface FileKind {
  Icon: LucideIcon;
  /** Muted tag color (Linear's in-product palette) for the icon glyph + tile tint. */
  color: string;
  /** Short uppercase label, e.g. JSON, MD, PNG. */
  label: string;
}

const CODE_EXT = new Set([
  "js", "jsx", "ts", "tsx", "py", "rs", "go", "rb", "java", "c", "cpp", "h",
  "css", "html", "sh", "toml", "yaml", "yml", "move", "sol",
]);

const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/** Map a file's mime/name to an icon, tag color, and short label. */
export function fileKind(mimeType: string, name: string): FileKind {
  const e = ext(name);
  const label = (e || mimeType.split("/").pop() || "file").toUpperCase().slice(0, 4);

  if (mimeType.startsWith("image/")) return { Icon: FileImage, color: "#4caf6d", label };
  if (mimeType.startsWith("video/")) return { Icon: FileVideo, color: "#d2698a", label };
  if (mimeType.startsWith("audio/")) return { Icon: FileAudio, color: "#c98fd8", label };
  if (mimeType === "application/pdf" || e === "pdf") return { Icon: FileType, color: "#e5736b", label };
  if (mimeType === "application/json" || e === "json") return { Icon: FileJson, color: "#d8a657", label };
  if (e === "md" || e === "markdown" || mimeType === "text/markdown")
    return { Icon: FileText, color: "#6e8bd6", label };
  if (e === "zip" || e === "tar" || e === "gz" || mimeType.includes("zip"))
    return { Icon: FileArchive, color: "#e0915a", label };
  if (CODE_EXT.has(e)) return { Icon: FileCode, color: "#8f86d8", label };
  if (mimeType.startsWith("text/")) return { Icon: FileText, color: "#8a8f98", label };
  return { Icon: File, color: "#8a8f98", label };
}

/** Compact relative time, e.g. "just now", "3h ago", "5d ago", else a date. */
export function relativeTime(ms: number): string {
  if (!ms) return "";
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
