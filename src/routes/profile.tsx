import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { currentUser, posts } from "@/lib/mock-data";
import { Flame, Trophy, Swords, Zap, Settings, Share2 } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: `@${"alexrivers"} — MindSprint`, },
      { name: "description", content: "Status card, XP, streak, badges, and posts." },
    ],
  }),
});

const badges = [
  { icon: "🔥", label: "Streak 10" },
  { icon: "⚔️", label: "Duelist" },
  { icon: "🧠", label: "Sharp Mind" },
  { icon: "🏆", label: "Top 200" },
  { icon: "📚", label: "Scholar" },
  { icon: "⚡", label: "Speedster" },
];

function ProfilePage() {
  const [tab, setTab] = useState<"posts" | "challenges" | "duels">("posts");
  const u = currentUser;
  const winRate = Math.round((u.wins / (u.wins + u.losses)) * 100);
  const xpToNext = 5000;
  const pct = Math.min(100, (u.xp / xpToNext) * 100);

  return (
    <AppShell
      title={
        <>
          <div className="font-display text-lg font-bold">Profile</div>
          <div className="flex gap-2">
            <button className="rounded-full glass p-2"><Share2 className="h-4 w-4" /></button>
            <button className="rounded-full glass p-2"><Settings className="h-4 w-4" /></button>
          </div>
        </>
      }
    >
      {/* Status card */}
      <div className="relative overflow-hidden rounded-3xl glass-strong p-5 animate-fade-in">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full gradient-hot opacity-30 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full gradient-primary opacity-30 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-4xl glow">{u.avatar}</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl font-bold">{u.username}</div>
            <div className="text-sm text-muted-foreground">@{u.handle}</div>
            <div className="mt-1 inline-block rounded-full bg-secondary/60 px-2 py-0.5 text-[11px] font-semibold">
              {u.school}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Rank</div>
            <div className="font-display text-2xl font-bold text-gradient">#{u.rank}</div>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold">Level {u.level}</span>
            <span className="text-muted-foreground">{u.xp.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-4 gap-2 text-center">
          <Stat icon={<Flame className="h-4 w-4 text-neon-pink" />} value={u.streak} label="Streak" />
          <Stat icon={<Swords className="h-4 w-4 text-neon-purple" />} value={u.wins} label="Wins" />
          <Stat icon={<Zap className="h-4 w-4 text-xp" />} value={`${winRate}%`} label="Win rate" />
          <Stat icon={<Trophy className="h-4 w-4 text-success" />} value={u.level} label="Level" />
        </div>
      </div>

      {/* Badges */}
      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Badges</h2>
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3">
          {badges.map((b) => (
            <div key={b.label} className="glass flex shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-2">
              <span className="text-2xl">{b.icon}</span>
              <span className="text-[10px] font-semibold">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 rounded-2xl glass p-1">
        {(["posts", "challenges", "duels"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
              tab === t ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {tab === "posts" && posts.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
        {tab === "challenges" && posts.filter((p) => p.type === "challenge").map((p) => <PostCard key={p.id} post={p} />)}
        {tab === "duels" && posts.filter((p) => p.type === "duel").map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </AppShell>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-2">
      <div className="flex items-center justify-center">{icon}</div>
      <div className="font-display text-base font-bold">{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
