import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/cn";

// The console is authored for a desktop window; render it at a fixed logical size
// and scale-to-fit so the embedded UI keeps real desktop proportions instead of
// cramming into a narrow marketing frame.
const APP_W = 1280;
const APP_H = 800;

/**
 * The real WalDrive console, embedded live in a window that mirrors the desktop
 * app's chrome — macOS overlay traffic lights at the top-left (no fake title bar),
 * an active-window accent line on the top edge. Shows a poster first and mounts
 * the (heavy) app iframe on click, so the landing stays light until opted into.
 */
export function LiveApp({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => setScale(host.clientWidth / APP_W));
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-xl border border-hairline bg-canvas shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      {/* active-window top edge — like the real desktop window */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-accent-hover/70 to-transparent"
      />
      {/* macOS overlay traffic lights, integrated over the console's reserved top-left */}
      <span aria-hidden className="absolute left-4 top-3.5 z-10 flex gap-2">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </span>
      <div ref={hostRef} className="relative w-full overflow-hidden" style={{ height: APP_H * scale }}>
        {live ? (
          <iframe
            title="WalDrive live console"
            src="/app"
            className="absolute left-0 top-0 border-0"
            style={{ width: APP_W, height: APP_H, transform: `scale(${scale})`, transformOrigin: "top left" }}
          />
        ) : (
          <button
            type="button"
            className="group absolute inset-0 block"
            onClick={() => setLive(true)}
            aria-label="Launch the live console"
          >
            <img
              alt="WalDrive console: sidebar, drag-to-upload zone and a live file grid"
              className="block size-full object-cover object-top"
              loading="lazy"
              src="/landing/app-grid.png"
            />
            <span className="absolute inset-0 grid place-items-center bg-canvas/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-surface-1/90 px-4 py-2 text-sm font-medium text-ink shadow-lg">
                <Play className="size-4 fill-current" strokeWidth={0} />
                Try it live
              </span>
            </span>
          </button>
        )}
      </div>
    </figure>
  );
}
