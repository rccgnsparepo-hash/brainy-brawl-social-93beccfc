import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Flame, Trophy, Swords, Zap, LogOut, Instagram } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { useEffect, useState } from "react";
import { useAuth, levelProgress } from "@/lib/auth";
import { fetchUserPosts } from "@/lib/feed";
import type { FeedPost } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "Profile — MindSprint" }, { name: "description", content: "Status, XP, streak, badges, posts." }],
  }),
});

function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchUserPosts(user.id).then(setPosts);
    supabase
      .from("profiles")
      .select("id, xp")
      .order("xp", { ascending: false })
      .then(({ data }) => {
        const idx = (data ?? []).findIndex((p: any) => p.id === user.id);
        setRank(idx >= 0 ? idx + 1 : null);
      });
  }, [user?.id, profile?.xp]);

  if (!profile) return null;

  const winRate = profile.wins + profile.losses > 0 ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100) : 0;
  const lvl = levelProgress(profile.xp, profile.level);
  const badges = computeBadges(profile);

  return (
    <AppShell
      title={
        <>
          <div className="font-display text-lg font-bold">Profile</div>
          <div className="flex gap-2">
            <button onClick={signOut} className="rounded-full glass p-2" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </>
      }
    >
      <div className="relative overflow-hidden rounded-3xl glass-strong p-5 animate-fade-in">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full gradient-hot opacity-30 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full gradient-primary opacity-30 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-4xl glow">{profile.avatar}</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl font-bold">{profile.display_name}</div>
            <div className="text-sm text-muted-foreground">@{profile.handle}</div>
            <div className="mt-1 inline-block rounded-full bg-secondary/60 px-2 py-0.5 text-[11px] font-semibold">{profile.school}{profile.grade ? ` · ${profile.grade}` : ""}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Rank</div>
            <div className="font-display text-2xl font-bold text-gradient">{rank ? `#${rank}` : "—"}</div>
          </div>
        </div>

        {profile.bio && <p className="relative mt-3 text-sm text-muted-foreground">{profile.bio}</p>}
        {profile.instagram && (
          <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="relative mt-2 inline-flex items-center gap-1 text-xs text-neon-pink">
            <Instagram className="h-3 w-3" /> @{profile.instagram}
          </a>
        )}

        <div className="relative mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold">Level {profile.level}</span>
            <span className="text-muted-foreground">
              {profile.xp.toLocaleString()} / {lvl.next.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full gradient-primary transition-all" style={{ width: `${lvl.pct}%` }} />
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-4 gap-2 text-center">
          <Stat icon={<Flame className="h-4 w-4 text-neon-pink" />} value={profile.streak} label="Streak" />
          <Stat icon={<Swords className="h-4 w-4 text-neon-purple" />} value={profile.wins} label="Wins" />
          <Stat icon={<Zap className="h-4 w-4 text-xp" />} value={`${winRate}%`} label="Win rate" />
          <Stat icon={<Trophy className="h-4 w-4 text-success" />} value={profile.level} label="Level" />
        </div>
      </div>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Badges</h2>
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3">
          {badges.length === 0 && <div className="text-xs text-muted-foreground">Earn XP and win duels to unlock badges.</div>}
          {badges.map((b) => (
            <div key={b.label} className="glass flex shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-2">
              <span className="text-2xl">{b.icon}</span>
              <span className="text-[10px] font-semibold">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      <h2 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your posts</h2>
      <div className="space-y-3">
        {posts.length === 0 && <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">No posts yet.</div>}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
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

function computeBadges(p: { streak: number; wins: number; level: number; xp: number }) {
  const out: { icon: string; label: string }[] = [];
  if (p.streak >= 3) out.push({ icon: "🔥", label: `Streak ${p.streak}` });
  if (p.wins >= 1) out.push({ icon: "⚔️", label: "Duelist" });
  if (p.wins >= 10) out.push({ icon: "🏆", label: "Champion" });
  if (p.level >= 5) out.push({ icon: "⚡", label: "Rising" });
  if (p.level >= 10) out.push({ icon: "🧠", label: "Sharp Mind" });
  if (p.xp >= 1000) out.push({ icon: "📚", label: "Scholar" });
  return out;
}
