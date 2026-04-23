"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SignInButton from "@/components/SignInButton";
import LiquidEtherBackground from "@/components/LiquidEtherBackground";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] px-4 py-10">
      {/* LiquidEther full-screen background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <LiquidEtherBackground
          colors={["#6608ffff", "#6c9ceaff", "#b9acacff"]}
        />
      </div>

      {/* Subtle vignette so card pops */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm animate-scale-in">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl shadow-2xl">
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
