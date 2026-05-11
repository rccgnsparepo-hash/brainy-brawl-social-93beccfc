import { useState } from "react";
import { Heart, MessageCircle, Repeat2, Share, Zap, Trophy, Swords, Clock } from "lucide-react";
import type { FeedPost } from "@/lib/types";
import { timeAgo } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toggleLike, toggleRepost, addComment, fetchComments } from "@/lib/feed";
import { toast } from "sonner";

export function PostCard({ post }: { post: FeedPost }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);
  const [reposted, setReposted] = useState(!!post.reposted_by_me);
  const [reposts, setReposts] = useState(post.reposts_count);
  const [comments, setComments] = useState(post.comments_count);
  const [solved, setSolved] = useState<null | "right" | "wrong">(null);
  const [xpPop, setXpPop] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [rewardXp, setRewardXp] = useState(0);

  const handleLike = async () => {
    if (!user) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    await toggleLike(post.id, user.id, !next);
  };

  const handleRepost = async () => {
    if (!user) return;
    const next = !reposted;
    setReposted(next);
    setReposts((n) => n + (next ? 1 : -1));
    await toggleRepost(post.id, user.id, !next);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/`;
    try {
      if (navigator.share) await navigator.share({ title: "MindSprint", text: post.content, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {}
  };

  const handleAnswer = async (opt: string) => {
    if (!post.challenge || solved || !user) return;
    const { data, error } = await supabase.rpc("solve_challenge", {
      _challenge_id: post.challenge.id,
      _answer: opt,
      _time_taken_ms: 0,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as { correct: boolean; reward: number };
    setSolved(result.correct ? "right" : "wrong");
    if (result.correct && result.reward > 0) {
      setRewardXp(result.reward);
      setXpPop(true);
      setTimeout(() => setXpPop(false), 800);
    }
  };

  const openComments = async () => {
    setShowComments((v) => !v);
    if (!showComments && commentList.length === 0) {
      const c = await fetchComments(post.id);
      setCommentList(c);
    }
  };

  const submitComment = async () => {
    if (!user || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    const { error } = await addComment(post.id, user.id, text);
    if (error) return toast.error(error.message);
    setComments((n) => n + 1);
    const c = await fetchComments(post.id);
    setCommentList(c);
  };

  const p = post.profile;

  return (
    <article className="glass relative animate-slide-up rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-primary text-xl">
          {p?.avatar ?? "👤"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="truncate font-semibold">{p?.display_name ?? "Unknown"}</span>
            <span className="truncate text-muted-foreground">@{p?.handle ?? "unknown"}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{timeAgo(post.created_at)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {p?.school ?? ""} · Lv {p?.level ?? 1}
          </div>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-snug">{post.content}</p>

      {post.type === "challenge" && post.challenge && (
        <div className="glass-strong mt-3 rounded-xl p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium uppercase tracking-wide text-foreground">
              <Zap className="h-3 w-3 text-xp" /> Challenge
            </span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.challenge.time_limit}s
              </span>
              <span className="text-xp">+{post.challenge.reward_xp} XP</span>
              <span
                className={`uppercase ${
                  post.challenge.difficulty === "hard"
                    ? "text-neon-pink"
                    : post.challenge.difficulty === "medium"
                      ? "text-warning"
                      : "text-success"
                }`}
              >
                {post.challenge.difficulty}
              </span>
            </div>
          </div>
          <p className="mb-3 text-sm font-medium">{post.challenge.question}</p>
          {!solved ? (
            <div className="grid grid-cols-2 gap-2">
              {(post.challenge.options ?? []).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className="rounded-lg border border-glass-border bg-secondary/40 px-3 py-2 text-sm transition-all hover:border-neon-purple hover:bg-secondary active:scale-[0.98]"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div
              className={`rounded-lg p-3 text-center text-sm font-semibold ${
                solved === "right" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}
            >
              {solved === "right"
                ? rewardXp > 0
                  ? `Correct! +${rewardXp} XP`
                  : "Correct! (already solved)"
                : `Not quite — answer was "${post.challenge.answer}"`}
            </div>
          )}
          <div className="mt-2 text-right text-xs text-muted-foreground">{post.challenge.solved_count} solved</div>
        </div>
      )}

      {post.type === "achievement" && post.achievement_title && (
        <div className="glass-strong mt-3 flex items-center gap-3 rounded-xl p-3 animate-glow-pulse">
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-hot text-xl">
            {post.achievement_icon ?? "⚡"}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Achievement</div>
            <div className="font-display font-semibold">{post.achievement_title}</div>
          </div>
          <Trophy className="ml-auto h-5 w-5 text-xp" />
        </div>
      )}

      {post.type === "duel" && (
        <div className="glass-strong mt-3 flex items-center gap-3 rounded-xl p-3">
          <Swords className="h-5 w-5 text-neon-purple" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Duel result</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-muted-foreground">
        <button onClick={openComments} className="flex items-center gap-1 text-sm hover:text-foreground">
          <MessageCircle className="h-[18px] w-[18px]" />
          <span>{comments}</span>
        </button>
        <button
          onClick={handleRepost}
          className={`flex items-center gap-1 text-sm transition-colors ${reposted ? "text-success" : "hover:text-foreground"}`}
        >
          <Repeat2 className="h-[18px] w-[18px]" />
          <span>{reposts}</span>
        </button>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${liked ? "text-neon-pink" : "hover:text-foreground"}`}
        >
          <Heart className={`h-[18px] w-[18px] ${liked ? "fill-current animate-pop" : ""}`} />
          <span>{likes}</span>
        </button>
        <button onClick={handleShare} className="hover:text-foreground">
          <Share className="h-[18px] w-[18px]" />
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2 border-t border-glass-border pt-3">
          {commentList.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <span className="text-base">{c.profile?.avatar ?? "👤"}</span>
              <div className="flex-1">
                <span className="font-semibold">{c.profile?.display_name}</span>{" "}
                <span className="text-muted-foreground">@{c.profile?.handle}</span>
                <p className="text-[13px]">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Write a comment…"
              maxLength={280}
              className="flex-1 rounded-full border border-glass-border bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-neon-purple"
            />
            <button onClick={submitComment} disabled={!draft.trim()} className="rounded-full gradient-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-40">
              Send
            </button>
          </div>
        </div>
      )}

      {xpPop && (
        <div className="pointer-events-none absolute right-4 top-4 animate-xp-pop font-display text-lg font-bold text-xp">
          +{rewardXp} XP
        </div>
      )}
    </article>
  );
}
