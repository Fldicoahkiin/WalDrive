import { extname } from "node:path";

const BY_EXTENSION: Record<string, string> = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".js": "text/javascript",
  ".ts": "text/typescript",
  ".csv": "text/csv",
  ".html": "text/html",
  ".css": "text/css",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".zip": "application/zip",
};

const DEFAULT_MIME = "application/octet-stream";

/** Guess a MIME type from a file path's extension. */
export function mimeFromPath(path: string): string {
  return BY_EXTENSION[extname(path).toLowerCase()] ?? DEFAULT_MIME;
}
