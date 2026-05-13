import { supabase } from "@/integrations/supabase/client";

export const pairFolder = (a: string, b: string) => [a, b].sort().join("__");

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadChatBg(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/bg-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("chat-backgrounds").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("chat-backgrounds").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadChatMedia(meId: string, peerId: string, file: File | Blob, name?: string): Promise<{ url: string; size: number; mime: string }> {
  const folder = pairFolder(meId, peerId);
  const fname = name || (file instanceof File ? file.name : `voice-${Date.now()}.webm`);
  const safe = fname.replace(/[^\w.\-]/g, "_");
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("chat-media").upload(path, file, { upsert: false, contentType: (file as any).type });
  if (error) throw error;
  // signed URL (private bucket)
  const { data: signed } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60 * 24 * 7);
  return { url: signed?.signedUrl ?? path, size: (file as any).size ?? 0, mime: (file as any).type ?? "application/octet-stream" };
}
