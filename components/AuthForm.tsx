"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        router.push("/chat");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else if (data.session) {
        router.push("/chat");
        router.refresh();
      } else {
        setInfo("Check your email to confirm your account, then log in.");
      }
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <form
        className="w-full max-w-sm bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-8 flex flex-col gap-5 shadow-xl"
        onSubmit={onSubmit}
      >
        <h1 className="text-2xl font-bold text-[var(--text)]">
          {isLogin ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-sm text-[var(--muted)] -mt-2">
          {isLogin ? "Log in to continue chatting." : "Sign up to start chatting."}
        </p>

        <label className="flex flex-col gap-1 text-sm text-[var(--text)]">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="bg-[var(--panel-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-[var(--text)]">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="bg-[var(--panel-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
          />
        </label>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {info && <p className="text-sm text-[var(--ok)]">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--accent)] text-[var(--accent-text)] font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
        </button>

        <p className="text-sm text-[var(--muted)] text-center">
          {isLogin ? "No account? " : "Already have one? "}
          <Link
            href={isLogin ? "/signup" : "/login"}
            className="text-[var(--accent)] underline underline-offset-2 hover:opacity-80"
          >
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </p>
      </form>
    </main>
  );
}
