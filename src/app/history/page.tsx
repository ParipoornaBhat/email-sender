"use client";

import React, { useState, useEffect } from "react";
import { getEmailHistory } from "./actions";
import { History, Calendar, Mail, CheckCircle2, XCircle, AlertTriangle, ChevronRight, ArrowLeft, Pause } from "lucide-react";
import { toast } from "sonner";
import CampaignDispatcher from "@/components/email/CampaignDispatcher";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await getEmailHistory();
      if (res.success && res.data) {
        setHistory(res.data);
      } else {
        toast.error(res.error || "Failed to load history");
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status.includes("CANCELLED")) return <XCircle className="text-zinc-500" size={18} />;
    if (status.includes("PAUSED")) return <Pause className="text-amber-500" size={18} />;
    
    switch (status) {
      case "COMPLETED": return <CheckCircle2 className="text-emerald-500" size={18} />;
      case "FAILED": return <XCircle className="text-red-500" size={18} />;
      case "PROCESSING": return <AlertTriangle className="text-amber-500 animate-pulse" size={18} />;
      default: return <AlertTriangle className="text-amber-500" size={18} />;
    }
  };

  // ── Active Campaign View ───────────────────────────
  if (activeCampaignId) {
    return (
      <div className="container mx-auto px-4 max-w-7xl pt-4 pb-24">
        <button
          onClick={() => setActiveCampaignId(null)}
          className="flex items-center gap-3 mb-6 text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to History</span>
        </button>

        <CampaignDispatcher
          mode="resume"
          campaignId={activeCampaignId}
          onReset={() => setActiveCampaignId(null)}
        />
      </div>
    );
  }

  // ── Campaign List View ─────────────────────────────
  return (
    <div className="container mx-auto px-4 max-w-7xl pt-4 pb-24">
      <div className="mb-8 space-y-1">
        <h2 className="text-3xl sm:text-4xl font-black lilita-font tracking-tight text-white">Campaign History</h2>
        <p className="text-zinc-500 text-sm sm:text-base font-medium">Detailed logs of your past bulk email dispatches.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-16 h-16 border-4 border-white/5 border-t-flc-orange rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card p-24 text-center space-y-8 !rounded-[3rem]">
          <div className="mx-auto w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center text-zinc-600">
            <History size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black">No Records Yet</h3>
            <p className="text-zinc-500 text-lg max-w-md mx-auto">Your successfully sent campaigns will appear here for auditing and review.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((record) => {
            const rawLogs = record.logs;
            const rawData = record.excelData;
            
            const logs = Array.isArray(rawLogs) ? rawLogs : (typeof rawLogs === "string" ? JSON.parse(rawLogs || "[]") : []);
            const excelData = Array.isArray(rawData) ? rawData : (typeof rawData === "string" ? JSON.parse(rawData || "[]") : []);

            const successCount = Array.isArray(logs) ? logs.filter((l: any) => l.status === "SUCCESS").length : 0;
            const failCount = Array.isArray(logs) ? logs.filter((l: any) => l.status !== "SUCCESS").length : 0;
            const totalCount = Array.isArray(excelData) ? excelData.length : 0;

            return (
              <div 
                key={record.id}
                onClick={() => setActiveCampaignId(record.id)}
                className="glass-card p-6 flex flex-col md:flex-row items-center justify-between group cursor-pointer hover:scale-[1.01] active:scale-[0.99] !rounded-[2rem] border-white/5 transition-all gap-6"
              >
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner shrink-0 ${
                    record.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" : 
                    record.status === "FAILED" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                  }`}>
                    <Mail size={20} />
                  </div>
                  
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-black text-xl text-white tracking-tight truncate">{record.subject}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">
                      <span className="flex items-center gap-2">
                          <Calendar size={14} className="text-zinc-600" />
                          {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                          record.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-400"
                      }`}>
                          <StatusIcon status={record.status} />
                          {record.status}
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-emerald-500/60">{successCount} Sent</span>
                      <span className="text-red-500/60">{failCount} Failed</span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-zinc-400">{totalCount} Total</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right hidden lg:block space-y-1">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Account</p>
                      <p className="text-xs font-bold text-zinc-300 truncate max-w-[150px]">{record.account.emailAddress}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-flc-orange group-hover:bg-flc-orange/10 transition-all shadow-lg">
                      <ChevronRight size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
