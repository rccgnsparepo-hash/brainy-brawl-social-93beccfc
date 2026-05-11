import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Swords, Zap, Trophy, Radio, Clock } from "lucide-react";
import { liveDuels, schools, posts } from "@/lib/mock-data";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/arena")({
  component: ArenaPage,
  head: () => ({
    meta: [
      { title: "Arena — MindSprint Social" },
      { name: "description", content: "Live brain duels, challenge boards, and school wars." },
    ],
  }),
});

function ArenaPage() {
  const [matching, setMatching] = useState(false);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (!matching) return;
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 400);
    return () => clearInterval(t);
  }, [matching]);

  return (
    <AppShell
      title={
        <>
          <div>
            <div className="font-display text-lg font-bold">Arena</div>
            <div className="text-[11px] text-muted-foreground">Live · {liveDuels.reduce((a, d) => a + d.viewers, 0)} watching</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-2 py-1 text-[10px] font-semibold uppercase text-destructive">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> Live
          </div>
        </>
      }
    >
      {/* Quick match CTA */}
      <button
        onClick={() => setMatching((v) => !v)}
        className={`relative w-full overflow-hidden rounded-2xl gradient-primary p-5 text-left text-primary-foreground transition-transform active:scale-[0.99] ${matching ? "animate-glow-pulse" : "glow"}`}
      >
        <div className="flex items-center gap-3">
          <Swords className="h-7 w-7" />
          <div>
            <div className="font-display text-xl font-bold">
              {matching ? `Finding opponent${".".repeat(dots)}` : "Quick Duel"}
            </div>
            <div className="text-xs opacity-90">5 questions · 10s each · +50 XP if you win</div>
          </div>
        </div>
      </button>

      {/* Live duels */}
      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Radio className="h-4 w-4 text-neon-pink" /> Live Duels
        </h2>
        <div className="space-y-2">
          {liveDuels.map((d) => (
            <div key={d.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <Player avatar={d.a.avatar} name={d.a.username} />
              <div className="flex flex-col items-center text-xs">
                <span className="font-display text-lg font-bold text-gradient">VS</span>
                <span className="text-muted-foreground">{d.round}</span>
              </div>
              <Player avatar={d.b.avatar} name={d.b.username} reverse />
              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-pink" />
                {d.viewers}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Challenge board */}
      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Zap className="h-4 w-4 text-xp" /> Challenge Board
        </h2>
        <div className="space-y-2">
          {posts.filter((p) => p.type === "challenge").map((p) => (
            <div key={p.id} className="glass rounded-2xl p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">@{p.user.handle}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" /> {p.challenge!.timeLimit}s
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-medium">{p.challenge!.question}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs uppercase text-muted-foreground">{p.challenge!.difficulty}</span>
                <button className="rounded-full gradient-hot px-4 py-1.5 text-xs font-bold text-primary-foreground">
                  Solve · +{p.challenge!.rewardXp} XP
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* School wars */}
      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Trophy className="h-4 w-4 text-xp" /> School Wars · Week 12
        </h2>
        <div className="glass rounded-2xl p-1">
          {schools.slice(0, 3).map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl p-3">
              <span className={`font-display text-lg font-bold ${i === 0 ? "text-xp" : "text-muted-foreground"}`}>#{i + 1}</span>
              <span className="flex-1 font-semibold">{s.shortName}</span>
              <span className="font-mono text-sm">{(s.totalXp / 1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Player({ avatar, name, reverse }: { avatar: string; name: string; reverse?: boolean }) {
  return (
    <div className={`flex flex-1 items-center gap-2 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-lg">{avatar}</div>
      <span className="truncate text-sm font-semibold">{name}</span>
    </div>
  );
}
