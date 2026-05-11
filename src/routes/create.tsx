import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useState } from "react";
import { FileText, Zap, BarChart3, Swords, Plus, X } from "lucide-react";
import { currentUser } from "@/lib/mock-data";

export const Route = createFileRoute("/create")({
  component: CreatePage,
  head: () => ({
    meta: [
      { title: "Create — MindSprint Social" },
      { name: "description", content: "Post a thought, drop a brain challenge, or send a duel invite." },
    ],
  }),
});

const types = [
  { id: "text", label: "Post", icon: FileText, color: "text-neon-blue" },
  { id: "challenge", label: "Challenge", icon: Zap, color: "text-xp" },
  { id: "poll", label: "Poll", icon: BarChart3, color: "text-success" },
  { id: "duel", label: "Duel Invite", icon: Swords, color: "text-neon-pink" },
] as const;

function CreatePage() {
  const [type, setType] = useState<(typeof types)[number]["id"]>("text");
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [timer, setTimer] = useState(15);
  const [diff, setDiff] = useState<"easy" | "medium" | "hard">("medium");
  const [posted, setPosted] = useState(false);

  const xpReward = diff === "hard" ? 50 : diff === "medium" ? 30 : 15;

  const submit = () => {
    setPosted(true);
    setTimeout(() => {
      setPosted(false);
      setContent("");
      setQuestion("");
      setAnswer("");
      setOptions(["", ""]);
    }, 1500);
  };

  return (
    <AppShell
      title={
        <>
          <div className="font-display text-lg font-bold">Create</div>
          <button
            onClick={submit}
            disabled={!content && !question}
            className="rounded-full gradient-primary px-4 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
          >
            Post
          </button>
        </>
      }
    >
      <div className="no-scrollbar -mx-3 mb-3 flex gap-2 overflow-x-auto px-3">
        {types.map((t) => {
          const Icon = t.icon;
          const active = type === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                active ? "gradient-primary text-primary-foreground glow" : "glass text-muted-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "" : t.color}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-lg">{currentUser.avatar}</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === "challenge" ? "Hype up your challenge…" :
              type === "duel" ? "Calling out an opponent? Tag them." :
              type === "poll" ? "What's the question for the crowd?" :
              "What's on your mind?"
            }
            rows={3}
            className="flex-1 resize-none bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
        </div>

        {type === "challenge" && (
          <div className="mt-3 space-y-3 border-t border-glass-border pt-3 animate-fade-in">
            <Field label="Question">
              <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What is 13 × 17?" className="input" />
            </Field>
            <Field label="Correct answer">
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="221" className="input" />
            </Field>
            <Field label="Options (multiple choice)">
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => setOptions(options.map((o, j) => j === i ? e.target.value : o))}
                      placeholder={`Option ${i + 1}`}
                      className="input flex-1"
                    />
                    {options.length > 2 && (
                      <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="rounded-lg bg-secondary p-2 text-muted-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 4 && (
                  <button onClick={() => setOptions([...options, ""])} className="flex items-center gap-1 text-xs text-neon-blue">
                    <Plus className="h-3 w-3" /> Add option
                  </button>
                )}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Timer · ${timer}s`}>
                <input type="range" min={5} max={30} step={5} value={timer} onChange={(e) => setTimer(+e.target.value)} className="w-full accent-[var(--neon-purple)]" />
              </Field>
              <Field label="Difficulty">
                <div className="flex gap-1">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button key={d} onClick={() => setDiff(d)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold uppercase ${diff === d ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3 text-sm">
              <span className="text-muted-foreground">Reward</span>
              <span className="font-display font-bold text-xp">+{xpReward} XP</span>
            </div>
          </div>
        )}

        {type === "duel" && (
          <div className="mt-3 rounded-xl bg-secondary/40 p-3 text-sm text-muted-foreground animate-fade-in">
            Tap <span className="font-semibold text-foreground">Post</span> to send a public 1v1 invite. First to accept duels you instantly.
          </div>
        )}

        {type === "poll" && (
          <div className="mt-3 space-y-2 animate-fade-in">
            {options.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => setOptions(options.map((o, j) => j === i ? e.target.value : o))}
                placeholder={`Choice ${i + 1}`}
                className="input w-full"
              />
            ))}
            {options.length < 4 && (
              <button onClick={() => setOptions([...options, ""])} className="flex items-center gap-1 text-xs text-neon-blue">
                <Plus className="h-3 w-3" /> Add choice
              </button>
            )}
          </div>
        )}
      </div>

      {posted && (
        <div className="glass-strong fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-4 text-center animate-pop">
          <div className="text-2xl">🚀</div>
          <div className="font-display font-bold">Posted!</div>
        </div>
      )}

      <style>{`.input{background:oklch(1 0 0 / 0.06);border:1px solid var(--glass-border);border-radius:0.75rem;padding:0.625rem 0.75rem;font-size:14px;color:var(--foreground);outline:none;width:100%}.input:focus{border-color:var(--neon-purple)}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
