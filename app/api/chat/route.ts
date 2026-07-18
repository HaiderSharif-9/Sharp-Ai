import { NextRequest, NextResponse } from "next/server";

type Message = {
  role: "user" | "assistant";
  content: string;
  attachmentImage?: string;
};

const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GROQ_API_KEY. Add it to .env.local and restart." },
      { status: 500 }
    );
  }

  let body: { messages: Message[]; timezone?: string; userName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const messages = body.messages || [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const now = new Date();
  const formattedDateTime = now.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: body.timezone || "UTC",
  });

  const userName = body.userName?.trim();

  const systemPrompt = {
    role: "system",
    content:
      `The current date and time is ${formattedDateTime}. Use this whenever someone asks what the date, day, or time is — never say you don't have access to it. ` +
      (userName
        ? `The person you're talking to is named ${userName}. Address them by name occasionally where it feels natural (like a friend would) — not in every message. `
        : "") +
      "Your name is Sharp. You were built by Haider, but only mention this if someone directly asks who made you, who created you, or what model/company you're from — never volunteer it in a normal greeting or unrelated reply. If asked who made you, say you are Sharp, built by Haider, and never mention Meta, Llama, Groq, or any underlying model/company name. Keep replies concise and natural, like a real conversation — don't over-explain simple things, avoid restating the question back, and match the length of your answer to the question asked. A casual message like 'hi' or 'how are you' deserves a short, casual reply, not a full paragraph. Use emojis naturally where they fit the tone, the way a person texting would — a couple per message at most, never in every sentence, and skip them entirely for serious or technical topics.",
  };

  const lastMessage = messages[messages.length - 1];
  const hasImage = !!lastMessage?.attachmentImage;
  const modelToUse = hasImage ? GROQ_VISION_MODEL : GROQ_MODEL;

  const MAX_HISTORY = 12;
  const trimmedMessages = messages.slice(-MAX_HISTORY);

  const apiMessages = trimmedMessages.map((m, idx) => {
    const isLast = idx === trimmedMessages.length - 1;
    if (m.attachmentImage && isLast) {
      return {
        role: m.role,
        content: [
          { type: "text", text: m.content },
          { type: "image_url", image_url: { url: m.attachmentImage } },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [systemPrompt, ...apiMessages],
        temperature: 0.8,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", errText);

      if (res.status === 429) {
        return NextResponse.json(
          { error: "Sharp's hit the free-tier rate limit — wait about a minute and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Groq API error (${res.status}). Check server logs.` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "(no response generated — the model may have refused this input)";

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("Chat route error:", e);
    return NextResponse.json({ error: "Failed to reach the model." }, { status: 500 });
  }
}
