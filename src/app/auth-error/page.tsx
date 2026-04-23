"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Image from "next/image";

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    let errorTitle = "Authentication Error";
    let errorDescription = "Something went wrong while trying to sign you in. Please try again.";
    
    // Map Better Auth errors to user-friendly messages
    if (error === "state_mismatch") {
        errorTitle = "Session Expired";
        errorDescription = "Your login session expired or became invalid before it could complete. This usually happens if you take too long to sign in or if your browser blocks cross-site tracking. Please try signing in again.";
    } else if (error === "access_denied") {
        errorTitle = "Access Denied";
        errorDescription = "You did not grant the necessary permissions to sign in, or your account is restricted.";
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4 overflow-hidden relative">
            
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-red-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-flc-orange/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-flc-orange/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Image 
                            src="/FLC.jpg" 
                            alt="FLC Logo" 
                            width={100} 
                            height={100} 
                            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                        />
                    </div>
                </div>

                {/* Error Card */}
                <div className="glass-card !rounded-[2rem] border-red-500/20 bg-black/40 p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50" />
                    
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <h1 className="text-3xl font-black text-white lilita-font tracking-wide mb-3">
                        {errorTitle}
                    </h1>
                    
                    <p className="text-zinc-400 font-medium leading-relaxed mb-8 text-sm">
                        {errorDescription}
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link 
                            href="/signin"
                            className="group relative flex items-center justify-center gap-2 w-full bg-white text-black font-black uppercase tracking-widest py-4 px-6 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            <span>Try Again</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-black/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </Link>
                        
                        <Link 
                            href="/"
                            className="group flex items-center justify-center gap-2 w-full bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest py-4 px-6 rounded-full hover:bg-white/10 transition-all duration-300"
                        >
                            <Home className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            <span className="text-zinc-400 group-hover:text-white transition-colors">Go Home</span>
                        </Link>
                    </div>
                </div>

                {/* Technical Error Code */}
                {error && (
                    <p className="text-center text-zinc-600 text-[10px] font-mono mt-8 uppercase tracking-widest">
                        Error Code: {error}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-flc-orange border-t-transparent rounded-full" />
            </div>
        }>
            <AuthErrorContent />
        </Suspense>
    );
}
