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
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-[var(--panel)] border-r border-[var(--border)] flex flex-col p-3 gap-3 transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:h-screen md:shrink-0`}
      >
        <button
          className="md:hidden absolute top-4 right-0 bg-[var(--text)] text-[var(--accent-text)] p-2 rounded"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          ×
        </button>

        <button
          className="w-full bg-[var(--accent)] text-[var(--accent-text)] font-semibold py-2 rounded hover:opacity-90 transition-opacity"
          onClick={newChat}
        >
          + New chat
        </button>

        {/* conversation list */}
        <div className="flex flex-col gap-1 overflow-y-auto flex-1">
          {conversations.length === 0 && (
            <p className="text-sm lg:text-base text-[var(--muted)] p-2">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between rounded px-2 py-1.5 group cursor-pointer
                ${c.id === activeId
                  ? "bg-[var(--panel-2)] text-[var(--text)]"
                  : "hover:bg-[var(--panel-2)] text-[var(--muted)]"}`}
            >
              <button
                className="flex-1 text-left truncate text-sm lg:text-base"
                onClick={() => openConversation(c.id)}
              >
                {c.title}
              </button>
              <button
                className="ml-2 text-xl text-[var(--danger)] opacity-0 group-hover:opacity-100 hover:cursor-pointer transition-opacity"
                aria-label="Delete conversation"
                onClick={() => { setDeleteConfirmId(c.id); setToastMessage("Confirm delete?"); }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* user box */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] mt-auto">
          <span className="text-sm lg:text-base text-[var(--muted)] truncate max-w-[70%]">{userEmail}</span>
          <button
            className="text-sm lg:text-base text-[var(--accent)] underline underline-offset-2 hover:opacity-80"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Toast ── */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--panel)] text-[var(--text)] border border-[var(--border)] rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
          <span>{toastMessage}</span>
          <button
            className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-3 py-1 text-sm font-medium hover:opacity-90"
            onClick={handleConfirmDelete}
          >
            Yes
          </button>
          <button
            className="bg-[var(--danger)] text-white rounded px-3 py-1 text-sm font-medium hover:opacity-90"
            onClick={handleCancelDelete}
          >
            No
          </button>
        </div>
      )}

      {/* ── Main chat area ── */}
      <section className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-[var(--panel-2)] border-b border-[var(--border)]">
          <button
            className="md:hidden p-2 rounded bg-[var(--accent)] text-[var(--accent-text)]"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <span className="font-medium">{activeId ? "Conversation" : "New chat"}</span>
        </header>

        {/* messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <h2 className="text-2xl lg:text-4xl font-bold mb-2">How can I help today?</h2>
              <p className="text-[var(--muted)] lg:text-xl">Send a message to start a conversation.</p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-base lg:text-lg leading-relaxed
                  ${m.role === "user"
                    ? "bg-[var(--accent)] text-[var(--accent-text)]"
                    : "bg-[var(--panel)] text-[var(--text)]"}`}
              >
                <MarkdownRenderer content={m.content} />
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-[var(--panel)] text-[var(--muted)] rounded-2xl px-4 py-3 text-base lg:text-lg italic animate-pulse">
                Thinking…
              </div>
            </div>
          )}
          {error && <p className="text-[var(--danger)] text-center text-sm">{error}</p>}
          <div ref={bottomRef} />
        </div>

        {/* composer */}
        <form
          className="flex items-end gap-2 px-4 py-3 border-t border-[var(--border)] bg-[var(--panel)]"
          onSubmit={send}
        >
          <textarea
            className="flex-1 resize-none bg-[var(--panel-2)] text-[var(--text)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-base lg:text-lg placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition max-h-40"
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
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-[var(--accent)] text-[var(--accent-text)] font-semibold px-5 py-2.5 rounded-xl text-base lg:text-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
