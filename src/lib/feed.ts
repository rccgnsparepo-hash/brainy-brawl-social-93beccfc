import { supabase } from "@/integrations/supabase/client";
import type { FeedPost } from "./types";

export async function fetchFeed(currentUserId: string | null): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `id, user_id, type, content, challenge_id, duel_id, achievement_title, achievement_icon,
       likes_count, comments_count, reposts_count, created_at,
       profile:profiles!posts_user_id_fkey ( id, handle, display_name, avatar, school, level ),
       challenge:challenges!posts_challenge_id_fkey ( id, question, answer, options, time_limit, reward_xp, difficulty, solved_count )`,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const ids = (data ?? []).map((p: any) => p.id);
  let liked = new Set<string>();
  let reposted = new Set<string>();
  if (currentUserId && ids.length) {
    const [{ data: l }, { data: r }] = await Promise.all([
      supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", ids),
      supabase.from("reposts").select("post_id").eq("user_id", currentUserId).in("post_id", ids),
    ]);
    liked = new Set((l ?? []).map((x: any) => x.post_id));
    reposted = new Set((r ?? []).map((x: any) => x.post_id));
  }

  return (data ?? []).map((p: any) => ({
    ...p,
    liked_by_me: liked.has(p.id),
    reposted_by_me: reposted.has(p.id),
  })) as FeedPost[];
}

export async function fetchUserPosts(userId: string): Promise<FeedPost[]> {
  const { data } = await supabase
    .from("posts")
    .select(
      `id, user_id, type, content, challenge_id, duel_id, achievement_title, achievement_icon,
       likes_count, comments_count, reposts_count, created_at,
       profile:profiles!posts_user_id_fkey ( id, handle, display_name, avatar, school, level ),
       challenge:challenges!posts_challenge_id_fkey ( id, question, answer, options, time_limit, reward_xp, difficulty, solved_count )`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as any;
}

export async function toggleLike(postId: string, userId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  }
}

export async function toggleRepost(postId: string, userId: string, current: boolean) {
  if (current) {
    await supabase.from("reposts").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("reposts").insert({ post_id: postId, user_id: userId });
  }
}

export async function addComment(postId: string, userId: string, content: string) {
  return supabase.from("comments").insert({ post_id: postId, user_id: userId, content });
}

export async function fetchComments(postId: string) {
  const { data } = await supabase
    .from("comments")
    .select(`id, content, created_at, user_id, profile:profiles!comments_user_id_fkey ( handle, display_name, avatar )`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return data ?? [];
}
