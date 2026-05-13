import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const issueLivekitToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { room: string; identity?: string; name?: string }) => d)
  .handler(async ({ data, context }) => {
    const { AccessToken } = await import("livekit-server-sdk");
    const apiKey = process.env.LIVEKIT_API_KEY!;
    const apiSecret = process.env.LIVEKIT_API_SECRET!;
    const url = process.env.LIVEKIT_URL!;
    if (!apiKey || !apiSecret || !url) throw new Error("LiveKit env not configured");

    const identity = data.identity || context.userId;
    const at = new AccessToken(apiKey, apiSecret, { identity, name: data.name ?? identity, ttl: "1h" });
    at.addGrant({ roomJoin: true, room: data.room, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    return { token, url, identity, room: data.room };
  });
