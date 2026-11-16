
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const HISTORY_LIMIT = 20;

interface ChatBody {
  conversationId?: string | null;
  message?: string;
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // OpenRouter configuration
  const token = process.env.OPENROUTER_API_KEY;
  const model =
    process.env.OPENROUTER_MODEL || "openrouter/free";

  if (!token) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not set on the server" },
      { status: 500 }
    );
  }

  let body: ChatBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const text = body.message?.trim();

  if (!text) {
    return NextResponse.json(
      { error: "Message is empty" },
      { status: 400 }
    );
  }

  if (text.length > 4000) {
    return NextResponse.json(
      { error: "Message too long" },
      { status: 400 }
    );
  }

  // 1. Find or create conversation
  let conversationId = body.conversationId ?? null;

  if (!conversationId) {
    const title =
      text.length > 40 ? text.slice(0, 40) + "…" : text;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title,
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not create conversation" },
        { status: 500 }
      );
    }

    conversationId = data.id as string;
  }

  // 2. Save user message
  const { error: insertErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: text,
    });

  if (insertErr) {
    return NextResponse.json(
      { error: insertErr.message },
      { status: 500 }
    );
  }

  // 3. Load conversation history
  const { data: history, error: histErr } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (histErr) {
    return NextResponse.json(
      { error: histErr.message },
      { status: 500 }
    );
  }

  const context = (history ?? []).reverse();

  // 4. Call OpenRouter
  let reply: string;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "My AI Chatbot",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful, concise assistant in a practice chat app.",
          },
          ...context,
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();

      console.error("OpenRouter error:", response.status, detail);

      return NextResponse.json(
        {
          error: `OpenRouter error (${response.status}): ${detail.slice(0, 500)}`,
        },
        { status: 502 }
      );
    }

    const json = await response.json();

    reply =
      json?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!reply) {
      reply = "(The model returned an empty response.)";
    }
  } catch (e) {
    console.error("OpenRouter request failed:", e);

    return NextResponse.json(
      {
        error: `Could not reach model: ${(e as Error).message}`,
      },
      { status: 502 }
    );
  }

  // 5. Save assistant response
  const { data: saved, error: saveErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "assistant",
      content: reply,
    })
    .select("id, conversation_id, role, content, created_at")
    .single();

  if (saveErr || !saved) {
    return NextResponse.json(
      {
        error: saveErr?.message ?? "Could not save reply",
      },
      { status: 500 }
    );
  }

  // 6. Update conversation timestamp
  await supabase
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return NextResponse.json({
    conversationId,
    message: saved,
  });
}
