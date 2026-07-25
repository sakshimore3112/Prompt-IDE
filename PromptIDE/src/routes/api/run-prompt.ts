import { createFileRoute } from "@tanstack/react-router";

type RunBody = {
  model: string;
  system?: string;
  prompt: string;
  temperature?: number;
};

export const Route = createFileRoute("/api/run-prompt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json({ error: "Missing LOVABLE_API_KEY" }, { status: 500 });
        }

        let body: RunBody;
        try {
          body = (await request.json()) as RunBody;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!body?.model || !body?.prompt) {
          return Response.json({ error: "model and prompt are required" }, { status: 400 });
        }

        const messages: Array<{ role: string; content: string }> = [];
        if (body.system?.trim()) messages.push({ role: "system", content: body.system });
        messages.push({ role: "user", content: body.prompt });

        const started = Date.now();
        try {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
            },
            body: JSON.stringify({
              model: body.model,
              messages,
              temperature: body.temperature ?? 0.7,
            }),
          });

          const elapsed = Date.now() - started;

          if (!upstream.ok) {
            const text = await upstream.text();
            return Response.json(
              {
                error: text || `Upstream error ${upstream.status}`,
                status: upstream.status,
                elapsed,
              },
              { status: upstream.status },
            );
          }

          const data = (await upstream.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
          };

          const content = data.choices?.[0]?.message?.content ?? "";
          return Response.json({
            content,
            usage: data.usage ?? null,
            elapsed,
          });
        } catch (err) {
          return Response.json(
            { error: (err as Error).message, elapsed: Date.now() - started },
            { status: 500 },
          );
        }
      },
    },
  },
});
