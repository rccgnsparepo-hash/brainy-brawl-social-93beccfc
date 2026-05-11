import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/post-card";
import { posts, currentUser } from "@/lib/mock-data";
import { Flame, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Home — MindSprint Social" },
      { name: "description", content: "Your live feed of brain challenges, duels, and school rivalries." },
    ],
  }),
});

function HomePage() {
  const xpToNext = 5000;
  const pct = Math.min(100, (currentUser.xp / xpToNext) * 100);

  return (
    <AppShell
      title={
        <>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-base">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-base font-bold leading-tight">MindSprint</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Social</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs">
            <Flame className="h-3.5 w-3.5 text-neon-pink" />
            <span className="font-semibold">{currentUser.streak}</span>
            <span className="text-muted-foreground">day streak</span>
          </div>
        </>
      }
    >
      {/* XP card */}
      <div className="glass mb-3 rounded-2xl p-4 animate-fade-in">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Level {currentUser.level}</span>
          <span>{currentUser.xp.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Global rank</span>
          <span className="font-display font-bold text-gradient">#{currentUser.rank}</span>
        </div>
      </div>

      <div className="space-y-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </AppShell>
  );
}
