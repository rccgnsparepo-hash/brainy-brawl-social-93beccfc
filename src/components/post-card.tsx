import { useState } from "react";
import { Heart, MessageCircle, Repeat2, Share, Zap, Trophy, Swords, CheckCircle2, Clock } from "lucide-react";
import type { Post } from "@/lib/mock-data";

export function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [solving, setSolving] = useState(false);
  const [solved, setSolved] = useState<null | "right" | "wrong">(null);
  const [xpPop, setXpPop] = useState(false);

  const handleLike = () => {
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
  };

  const handleAnswer = (opt: string) => {
    if (!post.challenge) return;
    const right = opt === post.challenge.answer;
    setSolved(right ? "right" : "wrong");
    if (right) {
      setXpPop(true);
      setTimeout(() => setXpPop(false), 800);
    }
  };

  return (
    <article className="glass relative animate-slide-up rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-primary text-xl">
          {post.user.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="truncate font-semibold">{post.user.username}</span>
            <span className="truncate text-muted-foreground">@{post.user.handle}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{post.createdAt}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {post.user.school} · Lv {post.user.level}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[15px] leading-snug">{post.content}</p>

      {post.type === "challenge" && post.challenge && (
        <div className="glass-strong mt-3 rounded-xl p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium uppercase tracking-wide text-foreground">
              <Zap className="h-3 w-3 text-xp" /> Challenge
            </span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.challenge.timeLimit}s</span>
              <span className="text-xp">+{post.challenge.rewardXp} XP</span>
              <span className={`uppercase ${
                post.challenge.difficulty === "hard" ? "text-neon-pink" :
                post.challenge.difficulty === "medium" ? "text-warning" : "text-success"
              }`}>{post.challenge.difficulty}</span>
            </div>
          </div>
          <p className="mb-3 text-sm font-medium">{post.challenge.question}</p>
          {!solved ? (
            <div className="grid grid-cols-2 gap-2">
              {post.challenge.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className="rounded-lg border border-glass-border bg-secondary/40 px-3 py-2 text-sm transition-all hover:border-neon-purple hover:bg-secondary active:scale-[0.98]"
                >
                  {opt}
                </button>
              ))}
              {!post.challenge.options && (
                <button
                  onClick={() => setSolving(true)}
                  className="col-span-2 rounded-lg gradient-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  {solving ? "Solving…" : "Accept Challenge"}
                </button>
              )}
            </div>
          ) : (
            <div className={`rounded-lg p-3 text-center text-sm font-semibold ${
              solved === "right" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
            }`}>
              {solved === "right" ? `Correct! +${post.challenge.rewardXp} XP` : `Not quite — answer was "${post.challenge.answer}"`}
            </div>
          )}
          <div className="mt-2 text-right text-xs text-muted-foreground">{post.challenge.solved} solved</div>
        </div>
      )}

      {post.type === "duel" && post.duelResult && (
        <div className={`glass-strong mt-3 flex items-center gap-3 rounded-xl p-3 ${post.duelResult.won ? "ring-1 ring-success/40" : ""}`}>
          <Swords className="h-5 w-5 text-neon-purple" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Duel {post.duelResult.won ? "Won" : "Lost"}</span>
            <span className="ml-2 text-muted-foreground">vs @{post.duelResult.opponent}</span>
          </div>
          <span className="font-display text-lg font-bold text-gradient">{post.duelResult.score}</span>
        </div>
      )}

      {post.type === "achievement" && post.achievement && (
        <div className="glass-strong mt-3 flex items-center gap-3 rounded-xl p-3 animate-glow-pulse">
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-hot text-xl">{post.achievement.icon}</div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Achievement</div>
            <div className="font-display font-semibold">{post.achievement.title}</div>
          </div>
          <Trophy className="ml-auto h-5 w-5 text-xp" />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-muted-foreground">
        <Action icon={MessageCircle} label={post.comments} />
        <Action icon={Repeat2} label={post.reposts} />
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${liked ? "text-neon-pink" : ""}`}
        >
          <Heart className={`h-[18px] w-[18px] ${liked ? "fill-current animate-pop" : ""}`} />
          <span>{likes}</span>
        </button>
        <Action icon={Share} />
      </div>

      {xpPop && post.challenge && (
        <div className="pointer-events-none absolute right-4 top-4 animate-xp-pop font-display text-lg font-bold text-xp">
          +{post.challenge.rewardXp} XP
        </div>
      )}
    </article>
  );
}

function Action({ icon: Icon, label }: { icon: any; label?: number }) {
  return (
    <button className="flex items-center gap-1 text-sm transition-colors hover:text-foreground">
      <Icon className="h-[18px] w-[18px]" />
      {label !== undefined && <span>{label}</span>}
    </button>
  );
}

export { CheckCircle2 };
