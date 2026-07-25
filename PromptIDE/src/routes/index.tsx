import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Loader2, Plus, Trash2, Save, Zap, Clock, Hash, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt IDE — Multi-Model Prompt Playground" },
      {
        name: "description",
        content:
          "Write, test, and compare prompts across GPT, Gemini and more. A prompt engineer's IDE with versioning and side-by-side model output.",
      },
      { property: "og:title", content: "Prompt IDE — Multi-Model Prompt Playground" },
      {
        property: "og:description",
        content: "Compare prompts across models side by side. Version, iterate, ship.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PromptIDE,
});

type ModelId =
  | "google/gemini-3-flash-preview"
  | "google/gemini-3.5-flash"
  | "google/gemini-3.1-flash-lite"
  | "google/gemini-3.1-pro-preview"
  | "openai/gpt-5.4-mini"
  | "openai/gpt-5.4-nano"
  | "openai/gpt-5.6-terra"
  | "openai/gpt-5.6-luna";

const MODELS: { id: ModelId; label: string; vendor: string; tag: string }[] = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", vendor: "Google", tag: "fast" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash", vendor: "Google", tag: "balanced" },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", vendor: "Google", tag: "cheap" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", vendor: "Google", tag: "reasoning" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini", vendor: "OpenAI", tag: "balanced" },
  { id: "openai/gpt-5.4-nano", label: "GPT-5.4 Nano", vendor: "OpenAI", tag: "fast" },
  { id: "openai/gpt-5.6-terra", label: "GPT-5.6 Terra", vendor: "OpenAI", tag: "flagship" },
  { id: "openai/gpt-5.6-luna", label: "GPT-5.6 Luna", vendor: "OpenAI", tag: "fast" },
];

type RunResult = {
  content: string;
  elapsed: number;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  error?: string;
  loading?: boolean;
};

type Version = {
  id: string;
  name: string;
  system: string;
  prompt: string;
  savedAt: number;
};

const STORAGE_KEY = "prompt-ide:versions:v1";

function PromptIDE() {
  const [system, setSystem] = useState("You are a concise, expert assistant. Answer with structure and no filler.");
  const [prompt, setPrompt] = useState(
    "Explain prompt engineering to a junior developer in 3 bullet points, then give one example prompt.",
  );
  const [temperature, setTemperature] = useState(0.7);
  const [selected, setSelected] = useState<ModelId[]>(["google/gemini-3-flash-preview", "openai/gpt-5.4-mini"]);
  const [results, setResults] = useState<Record<string, RunResult>>({});
  const [versions, setVersions] = useState<Version[]>([]);
  const runIdRef = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setVersions(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persistVersions = useCallback((v: Version[]) => {
    setVersions(v);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleModel = (id: ModelId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : prev.length >= 4 ? prev : [...prev, id]));
  };

  const runAll = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Prompt is empty");
      return;
    }
    if (selected.length === 0) {
      toast.error("Select at least one model");
      return;
    }
    const runId = ++runIdRef.current;
    setResults(Object.fromEntries(selected.map((m) => [m, { content: "", elapsed: 0, loading: true } as RunResult])));

    await Promise.all(
      selected.map(async (model) => {
        try {
          const res = await fetch("/api/run-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model, system, prompt, temperature }),
          });
          const data = await res.json();
          if (runIdRef.current !== runId) return;
          setResults((prev) => ({
            ...prev,
            [model]: {
              content: data.content ?? "",
              elapsed: data.elapsed ?? 0,
              usage: data.usage,
              error: res.ok ? undefined : data.error || `Error ${res.status}`,
              loading: false,
            },
          }));
        } catch (err) {
          if (runIdRef.current !== runId) return;
          setResults((prev) => ({
            ...prev,
            [model]: {
              content: "",
              elapsed: 0,
              error: (err as Error).message,
              loading: false,
            },
          }));
        }
      }),
    );
  }, [prompt, system, temperature, selected]);

  const saveVersion = () => {
    const name = window.prompt("Version name:", `v${versions.length + 1}`);
    if (!name) return;
    const next: Version = {
      id: crypto.randomUUID(),
      name,
      system,
      prompt,
      savedAt: Date.now(),
    };
    persistVersions([next, ...versions]);
    toast.success(`Saved "${name}"`);
  };

  const loadVersion = (v: Version) => {
    setSystem(v.system);
    setPrompt(v.prompt);
    toast(`Loaded "${v.name}"`);
  };

  const deleteVersion = (id: string) => {
    persistVersions(versions.filter((v) => v.id !== id));
  };

  const runningCount = useMemo(() => Object.values(results).filter((r) => r.loading).length, [results]);

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" />

      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center border border-primary/30">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Prompt IDE</h1>
              <p className="text-xs text-muted-foreground font-mono">multi-model playground</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveVersion}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-primary/50 hover:bg-surface-elevated transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save version
            </button>
            <button
              onClick={runAll}
              disabled={runningCount > 0}
              className="text-xs px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50 glow-primary"
            >
              {runningCount > 0 ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running {runningCount}…
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Run ⌘↵
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-12 gap-4">
        {/* Left: prompt editor */}
        <section className="col-span-12 lg:col-span-5 space-y-4">
          <PanelLabel>System</PanelLabel>
          <textarea
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            rows={4}
            className="mono w-full panel p-3 text-sm resize-none focus:outline-none focus:border-primary/60 transition"
            placeholder="System instructions…"
          />

          <PanelLabel>Prompt</PanelLabel>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                runAll();
              }
            }}
            rows={12}
            className="mono w-full panel p-3 text-sm resize-none focus:outline-none focus:border-primary/60 transition"
            placeholder="Your prompt…"
          />

          {/* Controls */}
          <div className="panel p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground uppercase tracking-wider font-mono">Temperature</span>
                <span className="font-mono text-primary">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-2">
                Models ({selected.length}/4)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MODELS.map((m) => {
                  const active = selected.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleModel(m.id)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition font-mono ${
                        active
                          ? "border-primary/60 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Versions */}
          <div className="panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-3">Versions</div>
            {versions.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">No saved versions yet.</div>
            ) : (
              <ul className="space-y-1">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between text-xs group hover:bg-surface-elevated rounded px-2 py-1.5 transition"
                  >
                    <button onClick={() => loadVersion(v)} className="flex-1 text-left flex items-center gap-2">
                      <span className="font-mono text-primary">{v.name}</span>
                      <span className="text-muted-foreground">{new Date(v.savedAt).toLocaleString()}</span>
                    </button>
                    <button
                      onClick={() => deleteVersion(v.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Right: outputs */}
        <section className="col-span-12 lg:col-span-7 space-y-3">
          <PanelLabel>Output · side by side</PanelLabel>
          {selected.length === 0 ? (
            <div className="panel p-12 text-center text-sm text-muted-foreground">
              Select at least one model to run.
            </div>
          ) : (
            <div
              className={`grid gap-3 ${
                selected.length === 1
                  ? "grid-cols-1"
                  : selected.length === 2
                    ? "grid-cols-1 xl:grid-cols-2"
                    : "grid-cols-1 xl:grid-cols-2"
              }`}
            >
              {selected.map((id) => {
                const model = MODELS.find((m) => m.id === id)!;
                const r = results[id];
                return (
                  <div key={id} className="panel flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-xs font-semibold">{model.label}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                          {model.vendor}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleModel(id)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove model"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 p-3 overflow-auto max-h-[600px]">
                      {r?.loading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> generating…
                        </div>
                      ) : r?.error ? (
                        <div className="text-xs text-destructive font-mono whitespace-pre-wrap">{r.error}</div>
                      ) : r?.content ? (
                        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{r.content}</pre>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Press Run to generate.</div>
                      )}
                    </div>
                    {r && !r.loading && !r.error && (
                      <div className="px-3 py-2 border-t border-border flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {r.elapsed}ms
                        </span>
                        {r.usage?.total_tokens != null && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" /> {r.usage.total_tokens} tok
                          </span>
                        )}
                        {r.usage?.completion_tokens != null && r.elapsed > 0 && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" /> {((r.usage.completion_tokens / r.elapsed) * 1000).toFixed(1)}{" "}
                            tok/s
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {selected.length < 4 && (
                <button
                  onClick={() => {
                    const next = MODELS.find((m) => !selected.includes(m.id));
                    if (next) toggleModel(next.id);
                  }}
                  className="panel min-h-[200px] flex items-center justify-center text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add model
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-[1600px] mx-auto px-6 py-6 text-[11px] text-muted-foreground font-mono border-t border-border/40 mt-8">
        prompt-ide · built by Sakshi · ⌘↵ to run
      </footer>
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">{children}</div>;
}
