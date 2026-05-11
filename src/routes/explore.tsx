import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Search, TrendingUp, Swords, Users, School } from "lucide-react";
import { trending, posts, schools, users } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  head: () => ({
    meta: [
      { title: "Explore — MindSprint Social" },
      { name: "description", content: "Discover trending challenges, school wars, and top minds." },
    ],
  }),
});

const sections = ["Trending", "School Wars", "Brain Challenges", "People"] as const;

function ExplorePage() {
  const [tab, setTab] = useState<(typeof sections)[number]>("Trending");
  const [q, setQ] = useState("");

  return (
    <AppShell
      title={
        <div className="flex w-full items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users, schools, posts…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      }
    >
      <div className="no-scrollbar -mx-3 mb-3 flex gap-2 overflow-x-auto px-3">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              tab === s ? "gradient-primary text-primary-foreground glow" : "glass text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {tab === "Trending" && (
        <div className="glass rounded-2xl p-1 animate-fade-in">
          {trending.map((t) => (
            <button key={t.tag} className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-secondary/50">
              <div>
                <div className="text-xs text-muted-foreground">Trending in your area</div>
                <div className="font-display font-semibold">{t.tag}</div>
                <div className="text-xs text-muted-foreground">{t.posts} posts</div>
              </div>
              <TrendingUp className="h-5 w-5 text-neon-blue" />
            </button>
          ))}
        </div>
      )}

      {tab === "School Wars" && (
        <div className="space-y-2 animate-fade-in">
          {schools.map((s, i) => (
            <div key={s.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hot font-display font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{s.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">{s.members} members</div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-gradient">{(s.totalXp / 1000).toFixed(0)}k</div>
                <div className={`text-xs ${s.weeklyChange >= 0 ? "text-success" : "text-destructive"}`}>
                  {s.weeklyChange >= 0 ? "+" : ""}{s.weeklyChange}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Brain Challenges" && (
        <div className="space-y-2 animate-fade-in">
          {posts.filter((p) => p.type === "challenge").map((p) => (
            <div key={p.id} className="glass rounded-2xl p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.user.school}</span>
                <span className="text-xp">+{p.challenge!.rewardXp} XP</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-medium">{p.challenge!.question}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <Swords className="h-3.5 w-3.5" />
                <span>{p.challenge!.solved} solved</span>
                <span>·</span>
                <span className="uppercase">{p.challenge!.difficulty}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "People" && (
        <div className="space-y-2 animate-fade-in">
          {users.slice(1).map((u) => (
            <div key={u.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-xl">{u.avatar}</div>
              <div className="flex-1">
                <div className="font-semibold">{u.username}</div>
                <div className="text-xs text-muted-foreground">@{u.handle} · {u.school}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Lv {u.level}</div>
                <button className="mt-1 rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Follow</button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> 1,284 students online
          </div>
        </div>
      )}
    </AppShell>
  );
}
