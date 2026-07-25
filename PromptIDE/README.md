# 🧠 Prompt IDE

> **An Integrated Development Environment for Prompt Engineers.**
> Write once. Run against multiple LLMs in parallel. Compare latency, tokens, and quality — side by side.

<p align="center">
  <img alt="Stack" src="https://img.shields.io/badge/TanStack_Start-v1-orange?style=for-the-badge" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="AI" src="https://img.shields.io/badge/Multi--Model-GPT_%2B_Gemini-a855f7?style=for-the-badge" />
</p>

---

## ✨ Why this project exists

Picking the right model is the single most expensive decision in an AI product.
GPT-5.6 is smart but slow. Gemini Flash is fast but sometimes sloppy. Nano is
cheap but hallucinates on edge cases. **Prompt IDE** turns that guesswork into
a measurable, side-by-side experiment — the same way an IDE turned "coding by
guessing" into "coding with feedback."

> **One prompt → N models → real numbers.**
> Choose the winner based on evidence, not vibes.

---

## 🎯 Features

- ⚡ **Fan-out execution** — run one prompt against up to **4 models in parallel** using `Promise.all`.
- 🧮 **Live metrics** — latency (ms), total tokens, and **tokens/sec** per model.
- 🎛 **Full control surface** — separate System / User editors, temperature slider (0 → 2), keyboard shortcut `⌘↵` / `Ctrl+Enter` to run.
- 💾 **Version history** — save prompt iterations to `localStorage`, reload with one click. Your prompt library, versioned.
- 🧩 **Model registry** — Gemini 3 Flash / 3.5 / Pro / Lite, GPT-5.4 Mini / Nano, GPT-5.6 Terra / Luna. Add more in one line.
- 🔒 **Server-side key handling** — API keys never touch the browser. All calls proxied through a typed server route.
- 🎨 **Dark developer aesthetic** — amber-on-charcoal, JetBrains Mono, no rounded pastel nonsense. Built to look like a tool, not a toy.

---

## 🧭 The Analogy

| A traditional IDE gives you… | Prompt IDE gives you… |
| --- | --- |
| Code editor with syntax highlighting | System + User prompt editors |
| Run button + console output | Run button + N model outputs |
| CPU / memory profiler | Latency, tokens, tok/s per model |
| Git commit history | localStorage version history |
| Cross-browser testing | Cross-model testing |

---

## 🏗 Architecture

```text
   ┌─────────────────────────────┐
   │        Browser (React)      │
   │  System · Prompt · Models   │
   └──────────────┬──────────────┘
                  │  Promise.all — 1 request per selected model
                  ▼
   ┌─────────────────────────────┐
   │   POST /api/run-prompt      │  ← TanStack Start server route
   │   (server-only, key-safe)   │
   └──────────────┬──────────────┘
                  │  fan-out to upstream gateway
                  ▼
   ┌─────────────────────────────┐
   │   AI Gateway → OpenAI /     │
   │   Google / …                │
   └──────────────┬──────────────┘
                  ▼
        { content, usage, elapsed }  ─►  side-by-side result cards
```

**Why this shape?**
- Server route keeps the API key off the client — a hard requirement for any production LLM app.
- Parallel fan-out means wall-clock time = *slowest* model, not the *sum* of all models.
- A single normalized response shape (`content` / `usage` / `elapsed`) means adding a new provider is a config change, not a rewrite.

---

## 🧪 Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **TanStack Start v1** (SSR + file-based routes) | Type-safe routes, server functions, edge-ready |
| Language | **TypeScript** (strict) | Kills a whole class of runtime bugs |
| Styling | **Tailwind CSS v4** + semantic tokens | Themeable, no hardcoded colors |
| UI primitives | **shadcn/ui**, **lucide-react**, **sonner** | Accessible, unstyled-by-default components |
| Runtime | Edge-compatible Worker | Cold-start-friendly, globally fast |

---

## 🚀 Getting Started

```bash
# 1. Install
bun install

# 2. Set your API key
echo "AI_API_KEY=sk-..." > .env


# 3. Run
bun run dev
```

Open **http://localhost:8080** → write a prompt → pick 2–4 models → hit **Run**.

---

## 📖 Usage

1. **System box** — set the model's role (`"You are a concise expert…"`).
2. **Prompt box** — the actual task.
3. **Temperature** — 0 for deterministic, 2 for wildly creative.
4. **Pick models** — click chips to select up to 4.
5. **Run** (`⌘↵`) — outputs stream into side-by-side cards with live metrics.
6. **Save Version** — snapshot a winning prompt so you can iterate without losing it.

---

## 💡 What this project demonstrates

- **Prompt engineering as a discipline** — treating prompts as versioned artifacts with measurable outcomes, not throwaway strings.
- **LLM systems thinking** — fan-out, cost/latency/quality tradeoffs, provider-agnostic abstractions.
- **Full-stack execution** — SSR framework, typed server routes, secure key handling, responsive UI.
- **Product intuition** — the tool solves a real workflow every AI engineer has (which model do I ship?).

---

## 🛣 Roadmap

- [ ] Streaming responses (token-by-token render)
- [ ] 👍 / 👎 rating buttons + persisted scoreboard per prompt
- [ ] A/B prompt mode (two prompts, one model)
- [ ] Export runs as JSON / share-links
- [ ] Cost estimator (input × output pricing per provider)

---

## 👤 Author

**Sakshi** — built to explore how far a well-designed workbench can push prompt-engineering productivity.

> *If a carpenter's skill is measured by their tools, a prompt engineer's should be too.*
