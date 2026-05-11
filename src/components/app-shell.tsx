import { ReactNode } from "react";

export function AppShell({ children, title }: { children: ReactNode; title?: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-xl pb-28">
      {title && (
        <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3">
          {title}
        </header>
      )}
      <main className="px-3 pt-3">{children}</main>
    </div>
  );
}
