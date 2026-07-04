// AI Assistant edge function — chat with optional image/file attachments, streamed.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Attachment = {
  kind: "image" | "file";
  mime: string;
  name?: string;
  dataUrl: string; // data:<mime>;base64,....
};

type ChatMsg = {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
};

function buildMessage(m: ChatMsg) {
  if (!m.attachments || m.attachments.length === 0) {
    return { role: m.role, content: m.content };
  }
  const parts: any[] = [];
  if (m.content?.trim()) parts.push({ type: "text", text: m.content });
  for (const a of m.attachments) {
    if (a.kind === "image") {
      parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
    } else {
      parts.push({
        type: "file",
        file: { filename: a.name || "file", file_data: a.dataUrl },
      });
    }
  }
  return { role: m.role, content: parts };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      messages = [],
      noteContext = "",
      noteTitle = "",
    }: { messages: ChatMsg[]; noteContext?: string; noteTitle?: string } = await req.json();

    const system = [
      "You are the NeuroNotes AI Assistant, embedded in the user's personal note editor.",
      "You help the user research topics, understand ideas, summarize, expand, extract key points, and answer questions.",
      "When the user attaches images or documents, analyze them carefully and respond about their content.",
      "Prefer concise, well-structured markdown. Use short paragraphs, bullet points, and bold for key terms.",
      noteTitle ? `The user is currently editing a note titled: "${noteTitle}".` : "",
      noteContext
        ? `Here is the current content of that note for context (may be empty):\n---\n${noteContext.slice(0, 6000)}\n---`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        ...messages.map(buildMessage),
      ],
      stream: true,
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      const status = resp.status;
      let userMsg = "The AI service is temporarily unavailable. Please try again.";
      if (status === 429) userMsg = "Rate limit reached. Please wait a moment and try again.";
      if (status === 402) userMsg = "AI credits exhausted. Please add credits to continue.";
      return new Response(JSON.stringify({ error: userMsg, detail: text }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resp.body) {
      return new Response(JSON.stringify({ error: "No response body from AI gateway" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pipe the upstream SSE stream straight through to the client.
    // The gateway sends OpenAI-style lines: "data: {json}\n\n" ... "data: [DONE]\n\n"
    return new Response(resp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});