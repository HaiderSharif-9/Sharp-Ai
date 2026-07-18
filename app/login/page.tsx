"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Tell Sharp your name first.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute w-[500px] h-[500px] rounded-full bg-edge-violet/10 blur-3xl"
        style={{ top: "-10%", left: "-10%" }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full bg-edge-ember/10 blur-3xl"
        style={{ bottom: "-10%", right: "-10%" }}
      />

      <div className="card cut-tr px-8 py-9 w-full max-w-sm relative z-10 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-edge-violet flex items-center justify-center cut-tr">
            <span className="font-display font-bold text-sm text-graphite">S</span>
          </div>
          <span className="font-display font-semibold text-xl tracking-tight text-paper">Sharp</span>
        </div>
        <p className="text-sm text-ash mb-7">
          {mode === "signin" ? "Welcome back — sign in to continue" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-graphite-raised border border-graphite-line rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-edge-violet transition-colors placeholder:text-ash"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-graphite-raised border border-graphite-line rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-edge-violet transition-colors placeholder:text-ash"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-graphite-raised border border-graphite-line rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-edge-violet transition-colors placeholder:text-ash"
          />

          {error && <p className="text-xs text-edge-ember">{error}</p>}
          {message && <p className="text-xs text-edge-violet">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="font-medium text-sm px-4 py-2.5 cut-tr bg-edge-violet text-graphite hover:brightness-110 transition-all disabled:opacity-40 mt-1"
          >
            {loading ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-graphite-line" />
          <span className="text-xs text-ash">or</span>
          <div className="flex-1 h-px bg-graphite-line" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-2.5 font-medium text-sm px-4 py-2.5 rounded-lg border border-graphite-line text-paper hover:border-edge-violet hover:bg-graphite transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              fill="#4285F4"
              d="M15.7 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.7 3.7 0 01-1.6 2.42v2h2.6c1.5-1.4 2.4-3.5 2.4-5.88z"
            />
            <path
              fill="#34A853"
              d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2c-.72.48-1.64.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H.85v2.07A8 8 0 008 16z"
            />
            <path
              fill="#FBBC05"
              d="M3.53 9.54a4.8 4.8 0 010-3.08V4.39H.85a8 8 0 000 7.22l2.68-2.07z"
            />
            <path
              fill="#EA4335"
              d="M8 3.18c1.17 0 2.23.4 3.06 1.19l2.3-2.3A8 8 0 000 4.39l2.68 2.07C3.16 4.58 4.92 3.18 8 3.18z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="w-full text-center text-xs text-ash hover:text-edge-violet mt-6 transition-colors"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
