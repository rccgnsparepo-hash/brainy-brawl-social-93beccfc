import { useEffect, ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

const PUBLIC_ROUTES = new Set(["/login", "/signup"]);

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const isPublic = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) nav({ to: "/login" });
  }, [user, loading, isPublic, nav]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full gradient-primary" />
      </div>
    );
  }

  if (!user && !isPublic) return null;

  return <>{children}</>;
}
