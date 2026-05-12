import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Phone, Video } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chats/$userId")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "Chat — MindSprint" }] }),
});

function ChatPage() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [other, setOther] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: prof }, { data: msgs }] = await Promise.all([
      supabase.from("profiles").select("id, handle, display_name, avatar").eq("id", userId).maybeSingle(),
      supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true })
        .limit(200),
    ]);
    setOther(prof);
    setMessages(msgs ?? []);
    // mark unread as read
    await supabase.from("messages").update({ read: true }).eq("recipient_id", user.id).eq("sender_id", userId).eq("read", false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`chat-${[user.id, userId].sort().join("-")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as any;
        if (
          (m.sender_id === user.id && m.recipient_id === userId) ||
          (m.sender_id === userId && m.recipient_id === user.id)
        ) {
          setMessages((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.recipient_id === user.id) {
            supabase.from("messages").update({ read: true }).eq("id", m.id).then(() => {});
          }
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!user || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    const { error } = await supabase.from("messages").insert({ sender_id: user.id, recipient_id: userId, content: text });
    if (error) toast.error(error.message);
  };

  return (
    <AppShell
      title={
        <>
          <button onClick={() => nav({ to: "/chats" })} className="rounded-full glass p-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-base">{other?.avatar ?? "👤"}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{other?.display_name ?? "…"}</div>
              <div className="truncate text-[11px] text-muted-foreground">@{other?.handle ?? ""}</div>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => toast("Voice calls coming soon")} className="rounded-full glass p-2"><Phone className="h-4 w-4" /></button>
            <button onClick={() => toast("Video calls coming soon")} className="rounded-full glass p-2"><Video className="h-4 w-4" /></button>
          </div>
        </>
      }
    >
      <div className="flex min-h-[60vh] flex-col gap-2 pb-2">
        {messages.length === 0 && <div className="text-center text-xs text-muted-foreground">Say hi 👋</div>}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "gradient-primary text-primary-foreground" : "glass"}`}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-20 mt-3 flex gap-2 rounded-full glass-strong p-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message…"
          className="flex-1 bg-transparent px-3 text-sm outline-none"
        />
        <button onClick={send} disabled={!draft.trim()} className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-primary-foreground disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </AppShell>
  );
}
