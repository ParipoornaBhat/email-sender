"use client";

import React from "react";
import { authClient } from "@/server/better-auth/client";
import { Shield, Mail } from "lucide-react";
import { toast } from "sonner";

import Image from "next/image";

export default function SignInPage() {
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    }, {
        onSuccess: () => { toast.success("Signed in successfully!"); },
        onError: (ctx) => { toast.error(ctx.error.message || "Failed to sign in"); },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="glass-card p-12 max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-24 h-24 relative rounded-[2rem] flex items-center justify-center shadow-2xl shadow-black/20 overflow-hidden">
          <Image src="/FLC.jpg" alt="FLC Logo" fill className="object-cover" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-4xl font-black lilita-font tracking-tight">Welcome Back</h2>
          <p className="text-zinc-500">Sign in to manage your bulk email campaigns.</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full btn-glass !py-5 flex items-center justify-center gap-4 text-lg !rounded-3xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-black uppercase tracking-widest">Sign in with Google</span>
        </button>

        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            Finite Loop Club • Secure Access
        </p>
      </div>
    </div>
  );
}
