import { useEffect } from "react";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { ValueProps } from "./ValueProps";
import { Features } from "./Features";
import { Pieces } from "./Pieces";
import { Mcp } from "./Mcp";
import { GetStarted } from "./GetStarted";
import { ClosingCta, Footer } from "./Footer";

/** Marketing homepage at `/`. The live console lives at `/app`. */
export function Landing() {
  useEffect(() => {
    const prev = document.title;
    document.title = "WalDrive — a desktop drive for the data your agents store on Walrus";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <Nav />
      <main>
        <Hero />
        <ValueProps />
        <Features />
        <Pieces />
        <Mcp />
        <GetStarted />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
