import { ReactNode } from "react";
import { DoodleBg } from "./doodle-bg";

export function AppShell({ children, title }: { children: ReactNode; title?: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-screen max-w-xl pb-28">
      <DoodleBg />
      {title && (
        <header className="glass sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-3">
          {title}
        </header>
      )}
      <main className="px-3 pt-3">{children}</main>
    </div>
  );
}
