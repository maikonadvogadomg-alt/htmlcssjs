import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

// ─── IA Embutida (gratuita via Replit AI Integrations) ───────────────────────
// Usa max_tokens máximo para garantir respostas completas
router.post("/ai/chat", async (req, res) => {
  try {
    const { messages, system, stream } = req.body as {
      messages: { role: string; content: string }[];
      system?: string;
      stream?: boolean;
    };

    const baseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
    const apiKey  = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

    if (!baseUrl || !apiKey) {
      res.status(503).json({ error: "Serviço de IA integrado não configurado. Configure uma chave de API nas configurações." });
      return;
    }

    const chatMessages = [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ];

    const useStream = Boolean(stream);

    const aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_completion_tokens: 16384,
        temperature: 0.7,
        stream: useStream,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      let errMsg = errText.slice(0, 400);
      try { const j = JSON.parse(errText); errMsg = j.error?.message ?? errMsg; } catch {}
      res.status(aiRes.status).json({ error: errMsg });
      return;
    }

    if (useStream) {
      // ── Modo streaming: passa o SSE direto para o cliente ──
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const reader = aiRes.body!;
      (reader as any).pipe(res);
      return;
    }

    const data = await aiRes.json() as { choices: { message: { content: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? "";
    res.json({ content });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Erro no chat de IA");
    res.status(500).json({ error: msg });
  }
});

export default router;
