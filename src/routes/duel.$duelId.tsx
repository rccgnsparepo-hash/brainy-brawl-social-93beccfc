import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Swords, Clock, Trophy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/duel/$duelId")({
  component: DuelPage,
  head: () => ({ meta: [{ title: "Duel — MindSprint" }] }),
});

const QUESTION_BANK = [
  { question: "7 × 8 = ?", options: ["54", "56", "58", "64"], answer: "56" },
  { question: "Capital of Australia?", options: ["Sydney", "Canberra", "Melbourne", "Perth"], answer: "Canberra" },
  { question: "√144 = ?", options: ["10", "11", "12", "13"], answer: "12" },
  { question: "Author of 1984?", options: ["Huxley", "Orwell", "Bradbury", "Salinger"], answer: "Orwell" },
  { question: "H2O is?", options: ["Salt", "Water", "Oxygen", "Acid"], answer: "Water" },
  { question: "15% of 200?", options: ["20", "25", "30", "35"], answer: "30" },
  { question: "Largest planet?", options: ["Saturn", "Mars", "Jupiter", "Earth"], answer: "Jupiter" },
];

function DuelPage() {
  const { duelId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [duel, setDuel] = useState<any>(null);
  const [round, setRound] = useState<any>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);

  const isA = user?.id === duel?.player_a;

  const loadDuel = async () => {
    const { data } = await supabase
      .from("duels")
      .select(`*, a:profiles!duels_player_a_fkey(handle,display_name,avatar), b:profiles!duels_player_b_fkey(handle,display_name,avatar)`)
      .eq("id", duelId)
      .maybeSingle();
    setDuel(data);
  };

  const loadCurrentRound = async () => {
    if (!duel || duel.status !== "active") return;
    const { data } = await supabase
      .from("duel_rounds")
      .select("*")
      .eq("duel_id", duelId)
      .eq("round_number", duel.current_round)
      .maybeSingle();
    if (data) {
      setRound(data);
      setPicked(isA ? data.answer_a : data.answer_b);
    } else if (duel.current_round === 0 && user?.id === duel.player_a) {
      // Player A creates round 1
      await advanceRound(1);
    }
  };

  const advanceRound = async (n: number) => {
    if (n > duel.total_rounds) {
      await supabase.rpc("finish_duel", { _duel_id: duelId });
      return;
    }
    const q = QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)];
    await supabase.from("duel_rounds").insert({
      duel_id: duelId,
      round_number: n,
      question: q.question,
      options: q.options,
      answer: q.answer,
    });
    await supabase.from("duels").update({ current_round: n }).eq("id", duelId);
  };

  useEffect(() => {
    loadDuel();
    const ch = supabase
      .channel(`duel-${duelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "duels", filter: `id=eq.${duelId}` }, () => loadDuel())
      .on("postgres_changes", { event: "*", schema: "public", table: "duel_rounds", filter: `duel_id=eq.${duelId}` }, () => loadCurrentRound())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [duelId]);

  useEffect(() => {
    loadCurrentRound();
    setTimeLeft(15);
    setPicked(null);
  }, [duel?.current_round, duel?.status]);

  // Round timer
  useEffect(() => {
    if (!round || duel?.status !== "active" || round.winner) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          resolveRound();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [round?.id]);

  const submitAnswer = async (opt: string) => {
    if (!round || picked) return;
    setPicked(opt);
    const col = isA ? "answer_a" : "answer_b";
    await supabase.from("duel_rounds").update(isA ? { answer_a: opt } : { answer_b: opt }).eq("id", round.id);
  };

  const resolveRound = async () => {
    if (!round || !duel) return;
    const { data: fresh } = await supabase.from("duel_rounds").select("*").eq("id", round.id).maybeSingle();
    if (!fresh || fresh.winner) return;
    const aRight = fresh.answer_a === fresh.answer;
    const bRight = fresh.answer_b === fresh.answer;
    let winner: string | null = null;
    let dScoreA = 0, dScoreB = 0;
    if (aRight && !bRight) { winner = duel.player_a; dScoreA = 1; }
    else if (bRight && !aRight) { winner = duel.player_b; dScoreB = 1; }
    else if (aRight && bRight) { dScoreA = 1; dScoreB = 1; }

    await supabase.from("duel_rounds").update({ winner }).eq("id", fresh.id);
    if (dScoreA || dScoreB) {
      await supabase.from("duels").update({
        score_a: duel.score_a + dScoreA,
        score_b: duel.score_b + dScoreB,
      }).eq("id", duelId);
    }
    // Player A advances next round
    if (user?.id === duel.player_a) {
      setTimeout(() => advanceRound(duel.current_round + 1), 1500);
    }
  };

  // Auto-resolve when both answered
  useEffect(() => {
    if (round && round.answer_a && round.answer_b && !round.winner) {
      resolveRound();
    }
  }, [round?.answer_a, round?.answer_b]);

  if (!duel) return <div className="p-8 text-center text-muted-foreground">Loading duel…</div>;

  const me = isA ? duel.a : duel.b;
  const opp = isA ? duel.b : duel.a;
  const myScore = isA ? duel.score_a : duel.score_b;
  const oppScore = isA ? duel.score_b : duel.score_a;
  const won = duel.winner_id === user?.id;
  const draw = duel.status === "finished" && !duel.winner_id;

  return (
    <AppShell
      title={
        <>
          <button onClick={() => nav({ to: "/arena" })} className="rounded-full glass p-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="font-display font-bold">Live Duel</div>
          <div className="rounded-full bg-destructive/15 px-2 py-1 text-[10px] font-semibold uppercase text-destructive">Live</div>
        </>
      }
    >
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <PlayerCard avatar={me?.avatar} name={me?.display_name ?? "You"} score={myScore} />
          <Swords className="h-6 w-6 text-neon-purple" />
          <PlayerCard avatar={opp?.avatar} name={opp?.display_name ?? "Waiting…"} score={oppScore} reverse />
        </div>
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Round {Math.max(1, duel.current_round)} / {duel.total_rounds}
        </div>
      </div>

      {duel.status === "active" && round && (
        <div className="mt-4 glass-strong rounded-2xl p-5 animate-fade-in">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold uppercase">Question</span>
            <span className="flex items-center gap-1 text-warning">
              <Clock className="h-3 w-3" /> {timeLeft}s
            </span>
          </div>
          <p className="mb-4 text-lg font-semibold">{round.question}</p>
          <div className="grid grid-cols-2 gap-2">
            {round.options.map((opt: string) => {
              const isPicked = picked === opt;
              const showResult = round.winner !== null || (round.answer_a && round.answer_b);
              const isCorrect = showResult && opt === round.answer;
              return (
                <button
                  key={opt}
                  disabled={!!picked}
                  onClick={() => submitAnswer(opt)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
                    isCorrect
                      ? "border-success bg-success/15 text-success"
                      : isPicked
                        ? "border-neon-purple bg-neon-purple/15"
                        : "border-glass-border bg-secondary/40"
                  } disabled:opacity-70`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {duel.status === "finished" && (
        <div className="mt-4 glass-strong rounded-3xl p-6 text-center animate-fade-in">
          <Trophy className={`mx-auto h-12 w-12 ${won ? "text-xp" : "text-muted-foreground"}`} />
          <div className="mt-2 font-display text-2xl font-bold">{draw ? "Draw" : won ? "Victory!" : "Defeat"}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Final {myScore} - {oppScore}
          </div>
          {won && <div className="mt-2 text-xp font-bold">+50 XP</div>}
          <button onClick={() => nav({ to: "/arena" })} className="mt-4 rounded-full gradient-primary px-6 py-2 text-sm font-bold text-primary-foreground">
            Back to Arena
          </button>
        </div>
      )}

      {duel.status === "waiting" && (
        <div className="mt-4 text-center text-sm text-muted-foreground">Waiting for opponent…</div>
      )}
    </AppShell>
  );
}

function PlayerCard({ avatar, name, score, reverse }: { avatar?: string; name: string; score: number; reverse?: boolean }) {
  return (
    <div className={`flex flex-1 items-center gap-2 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-2xl">{avatar ?? "👤"}</div>
      <div>
        <div className="text-xs text-muted-foreground">{reverse ? "Opponent" : "You"}</div>
        <div className="truncate text-sm font-semibold">{name}</div>
        <div className="font-display text-lg font-bold text-gradient">{score}</div>
      </div>
    </div>
  );
}
