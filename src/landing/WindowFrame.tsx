import { cn } from "@/lib/cn";

/** A faux macOS window chrome wrapping a product screenshot. */
export function WindowFrame({
  src,
  alt,
  label = "WalDrive",
  className,
}: {
  src: string;
  alt: string;
  label?: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl border border-hairline bg-surface-1 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      <div className="flex h-9 items-center gap-2 border-b border-hairline bg-surface-2/60 px-4">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[12px] text-ink-tertiary">{label}</span>
      </div>
      <img alt={alt} className="block w-full" loading="lazy" src={src} />
    </figure>
  );
}
