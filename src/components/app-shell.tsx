import { ReactNode } from "react";
import { DoodleBg } from "./doodle-bg";

export function AppShell({ children, title, fullScreen = false }: { children: ReactNode; title?: ReactNode; fullScreen?: boolean }) {
  return (
    <div className={`relative mx-auto min-h-screen ${fullScreen ? "max-w-none pb-0" : "max-w-xl pb-28"}`}>
      <DoodleBg />
      {title && (
        <header className="glass sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-3">
          {title}
        </header>
      )}
      <main className={fullScreen ? "min-h-[calc(100dvh-64px)]" : "px-3 pt-3"}>{children}</main>
    </div>
  );
}
