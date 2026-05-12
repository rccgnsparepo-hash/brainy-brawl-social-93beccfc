import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Swords, MessageCircle, User } from "lucide-react";

type Tab = { to: string; icon: typeof Home; label: string; highlight?: boolean };
const tabs: Tab[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/arena", icon: Swords, label: "Arena", highlight: true },
  { to: "/chats", icon: MessageCircle, label: "Chats" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-xl">
      <div className="glass-strong border-t border-glass-border px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        <ul className="flex items-center justify-around">
          {tabs.map(({ to, icon: Icon, label, highlight }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            if (highlight) {
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className="relative -mt-6 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary glow text-primary-foreground transition-transform active:scale-95"
                    aria-label={label}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </Link>
                </li>
              );
            }
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[11px] transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-neon-blue" : ""}`} strokeWidth={active ? 2.5 : 2} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
