"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/types";
import MarkdownRenderer from "./MarkdownRenderer";

export default function ChatApp({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false });
    setConversations((data as Conversation[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function openConversation(id: string) {
    setActiveId(id);
    setError(null);
    setSidebarOpen(false);
    const { data } = await supabase
      .from("messages")
      .select("id, conversation_id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  }

  async function deleteConversation(id: string) {
    await supabase.from("conversations").delete().eq("id", id);
    if (id === activeId) newChat();
    loadConversations();
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteConversation(deleteConfirmId);
    }
    setToastMessage(null);
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = () => {
    setToastMessage(null);
    setDeleteConfirmId(null);
  };

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    setInput("");
    setSending(true);

    // Optimistic user message
    const temp: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeId ?? "",
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, temp]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, message: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");

      setActiveId(json.conversationId);
      setMessages((m) => [...m, json.message as Message]);
      loadConversations();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
  <button className="close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">×</button>
        <button className="new-chat" onClick={newChat}>
          + New chat
        </button>

        <div className="conv-list">
          {conversations.length === 0 && (
            <p className="muted small pad">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`conv-item ${c.id === activeId ? "active" : ""}`}
            >
              <button className="conv-title" onClick={() => openConversation(c.id)}>
                {c.title}
              </button>
              <button
                className="conv-del"
                aria-label="Delete conversation"
                onClick={() => { setDeleteConfirmId(c.id); setToastMessage('Confirm delete?'); }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="user-box">
          <span className="small muted ellipsis">{userEmail}</span>
          <button className="link-btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
        {toastMessage && (
          <div className="toast">
            <span>{toastMessage}</span>
            <button onClick={handleConfirmDelete}>Yes</button>
            <button className="toast-no" onClick={handleCancelDelete}>No</button>
          </div>
        )}

      <section className="chat">
        <header className="chat-header">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <span>{activeId ? "Conversation" : "New chat"}</span>
        </header>

        <div className="messages">
          {messages.length === 0 && !sending && (
            <div className="empty">
              <h2>How can I help today?</h2>
              <p className="muted">Send a message to start a conversation.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              <MarkdownRenderer content={m.content} />
            </div>
          ))}
          {sending && (
            <div className="msg assistant">
              <div className="bubble typing">Thinking…</div>
            </div>
          )}
          {error && <p className="error center">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <form className="composer" onSubmit={send}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Type a message…"
            rows={1}
          />
          <button type="submit" disabled={sending || !input.trim()}>
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
