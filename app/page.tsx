import type { CSSProperties } from "react";

import { BalloonGame } from "@/components/game/balloon-game";
import { Intro } from "@/components/home/intro";
import { SiteHeader } from "@/components/site/site-header";

const darkZoneStyle: CSSProperties = {
  ["--background" as string]: "#000000",
  ["--foreground" as string]: "#ededed",
  ["--muted" as string]: "#7a7a7a",
  background: "var(--background)",
  color: "var(--foreground)",
};

export default function Home() {
  return (
    <>
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-2xl flex-col px-6 py-10 sm:py-12">
        <div aria-hidden className="grow" />
        <div className="w-full">
          <SiteHeader />
          <main className="mt-8">
            <Intro />
          </main>
        </div>
        <div aria-hidden className="grow-[2]" />
      </div>
      <footer style={darkZoneStyle}>
        <div className="mx-auto max-w-2xl px-6">
          <BalloonGame />
        </div>
      </footer>
    </>
  );
}
