import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Download } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/cn";
import { CONTAINER, EASE, RELEASE_URL } from "./shared";
import { LinkCta, NavCta } from "./primitives";

const ANCHORS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Docs", href: "#docs" },
];

/** Sticky top bar that condenses (border + blur) once the page scrolls. */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-hairline bg-canvas/80 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <nav
        className={cn(
          "flex items-center transition-[height] duration-300",
          CONTAINER,
          scrolled ? "h-14" : "h-[68px]",
        )}
      >
        <a className="flex items-center gap-2.5" href="#top">
          <BrandMark className="size-7" />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">WalDrive</span>
        </a>

        <div className="mx-auto hidden items-center gap-1 md:flex">
          {ANCHORS.map((a) => (
            <a
              key={a.href}
              className="rounded-md px-3 py-1.5 text-[14px] text-ink-subtle transition-colors duration-200 hover:bg-surface-1 hover:text-ink"
              href={a.href}
            >
              {a.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LinkCta className="hidden sm:inline-flex" href={RELEASE_URL} variant="ghost">
            <Download className="size-4" strokeWidth={1.75} />
            Download
          </LinkCta>
          <NavCta to="/app" variant="primary">
            Launch app
          </NavCta>
        </div>
      </nav>
    </motion.header>
  );
}
