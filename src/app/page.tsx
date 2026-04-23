import Link from "next/link";
import { Mail, Shield, Zap, Target, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] text-center px-4 relative">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-flc-orange/5 blur-[150px] -z-10 rounded-full" />
      
      {/* Hero Content */}
      <div className="space-y-10 max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-flc-orange text-xs font-black uppercase tracking-[0.3em] shadow-2xl">
          <Sparkles size={16} className="animate-pulse" />
          <span>Finite Loop Club • Bulk Mailer</span>
        </div>
        
        <h1 className="text-7xl md:text-[9rem] font-black lilita-font tracking-tighter leading-[0.8] drop-shadow-2xl">
          SEND <br />
          <span className="text-flc-orange">POWERFUL</span> <br />
          EMAILS
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed">
          The ultimate standalone sub-app for the Finite Loop Club. 
          Manage your audience, design dynamic certificates, and dispatch bulk campaigns with a cosmic touch.
        </p>

        <div className="flex flex-wrap justify-center gap-8 pt-8">
          <Link href="/bulk-sender" className="btn-primary flex items-center gap-3 text-xl !px-12 !py-6 !rounded-[2rem] hover:scale-110">
            Start Campaign
            <ArrowRight size={24} />
          </Link>
          <Link href="/accounts" className="btn-glass flex items-center gap-3 text-xl !px-12 !py-6 !rounded-[2rem] hover:scale-110">
            Manage Accounts
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl w-full mt-40">
        <div className="glass-card p-12 text-left space-y-8 group hover:translate-y-[-12px] transition-all duration-500 !rounded-[3rem]">
          <div className="w-16 h-16 rounded-[1.5rem] bg-flc-orange/10 flex items-center justify-center text-flc-orange group-hover:bg-flc-orange group-hover:text-white transition-all duration-500 shadow-xl shadow-flc-orange/5">
            <Shield size={32} />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black tracking-tight">Encrypted</h3>
            <p className="text-zinc-500 leading-relaxed text-lg">
              State-of-the-art AES-256 encryption for your app passwords. Your security is our absolute priority.
            </p>
          </div>
        </div>

        <div className="glass-card p-12 text-left space-y-8 group hover:translate-y-[-12px] transition-all duration-500 !rounded-[3rem] border-blue-500/10">
          <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-xl shadow-blue-500/5">
            <Mail size={32} />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black tracking-tight">Dynamic</h3>
            <p className="text-zinc-500 leading-relaxed text-lg">
              Visual designer with real-time text overlay. Perfect for generating personalized certificates in bulk.
            </p>
          </div>
        </div>

        <div className="glass-card p-12 text-left space-y-8 group hover:translate-y-[-12px] transition-all duration-500 !rounded-[3rem] border-emerald-500/10">
          <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-xl shadow-emerald-500/5">
            <Target size={32} />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black tracking-tight">Insightful</h3>
            <p className="text-zinc-500 leading-relaxed text-lg">
              Comprehensive campaign history. Review logs, success rates, and manage recipients with ease.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="mt-48 mb-20 opacity-20 hover:opacity-50 transition-opacity">
        <p className="font-black lilita-font text-4xl tracking-[0.5em] uppercase">
          Finite Loop Club
        </p>
      </div>
    </div>
  );
}
