export { blobUrl } from "@waldrive/shared";

/** `0x1234…abcd` short form for a Sui address. */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

/** Human-readable byte size, e.g. `1.5 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/** Deterministic two-tone identicon gradient for a Sui address. */
export function addrGradient(address: string): string {
  const h = parseInt(address.slice(2, 6) || "0", 16) % 360;
  return `linear-gradient(135deg, hsl(${h} 62% 55%), hsl(${(h + 70) % 360} 62% 42%))`;
}
