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

export type FileCategory = "image" | "media" | "document" | "code" | "other";

/** Coarse category for the sidebar's type filter. */
export function fileCategory(mimeType: string, name: string): FileCategory {
  const e = ext(name);
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return "media";
  if (mimeType === "application/json" || e === "json" || CODE_EXT.has(e)) return "code";
  if (
    mimeType === "application/pdf" ||
    e === "pdf" ||
    e === "md" ||
    e === "markdown" ||
    mimeType.startsWith("text/")
  )
    return "document";
  return "other";
}

export const CATEGORY_META: Record<FileCategory, { label: string; Icon: LucideIcon }> = {
  image: { label: "Images", Icon: FileImage },
  media: { label: "Media", Icon: FileVideo },
  document: { label: "Documents", Icon: FileText },
  code: { label: "Code", Icon: FileCode },
  other: { label: "Other", Icon: File },
};

export type PreviewMode = "image" | "pdf" | "text" | "none";

const TEXT_MIME = /^(text\/|application\/(json|xml|javascript|x-sh|toml|x-yaml|x-toml))/;
const TEXT_EXT = new Set(["md", "markdown", "txt", "csv", "log", "json", "xml", "svg", "env"]);

/** How PreviewModal should render this file inline. */
export function previewMode(mimeType: string, name: string): PreviewMode {
  const e = ext(name);
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf" || e === "pdf") return "pdf";
  if (TEXT_MIME.test(mimeType) || CODE_EXT.has(e) || TEXT_EXT.has(e)) return "text";
  return "none";
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

const TAG_PALETTE = ["#4caf6d", "#d2698a", "#c98fd8", "#e5736b", "#d8a657", "#6e8bd6", "#e0915a", "#8f86d8"];

/** Stable muted color for a tag name — same tag, same dot everywhere. */
export function tagColor(tag: string): string {
  let h = 0;
  for (const ch of tag) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}
