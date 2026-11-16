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
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>{isLogin ? "Welcome back" : "Create account"}</h1>
        <p className="muted">
          {isLogin ? "Log in to continue chatting." : "Sign up to start chatting."}
        </p>

        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </label>

        {error && <p className="error">{error}</p>}
        {info && <p className="info">{info}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
        </button>

        <p className="muted small">
          {isLogin ? "No account? " : "Already have one? "}
          <Link href={isLogin ? "/signup" : "/login"}>
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </p>
      </form>
    </main>
  );
}
