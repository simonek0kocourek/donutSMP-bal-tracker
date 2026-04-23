"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SignInButton from "@/components/SignInButton";
import { useUser } from "@/hooks/useUser";
import type { UserId } from "@/lib/types";

export default function SignInPage() {
  const router = useRouter();
  const { user, ready, signIn } = useUser();

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  const handleSignIn = (id: UserId) => {
    signIn(id);
    router.replace("/dashboard");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(124,58,237,0.18), transparent 65%), radial-gradient(ellipse 60% 40% at 50% 80%, rgba(59,130,246,0.10), transparent 70%)",
        }}
      />
      <div className="grid-mask" />
      <div className="grain" />

      <div className="relative z-10 w-full max-w-sm animate-scale-in">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <div className="text-center">
            <div className="text-5xl">🍩</div>
            <h1 className="mt-3 font-display text-3xl text-white">
              Donut SMP
            </h1>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
              Track your grind.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <SignInButton user="s1xtus" onClick={() => handleSignIn("s1xtus")} />
            <SignInButton user="6PEKI9" onClick={() => handleSignIn("6PEKI9")} />
          </div>

          <div className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
            Synced online · No password
          </div>
        </div>
      </div>
    </main>
  );
}
