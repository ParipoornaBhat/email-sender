"use client";

import React, { useState, useEffect } from "react";
import { getEmailHistory } from "./actions";
import { History, Calendar, Mail, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";
import BulkEmailPreview from "@/components/email/BulkEmailPreview";
import Modal from "@/components/ui/Modal";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

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
    switch (status) {
      case "COMPLETED": return <CheckCircle2 className="text-emerald-500" size={18} />;
      case "FAILED": return <XCircle className="text-red-500" size={18} />;
      default: return <AlertTriangle className="text-amber-500" size={18} />;
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl pt-12 pb-24">
      <div className="mb-16 space-y-2">
        <h2 className="text-5xl font-black lilita-font tracking-tight text-white">Campaign History</h2>
        <p className="text-zinc-500 text-lg font-medium">Detailed logs of your past bulk email dispatches.</p>
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
          {history.map((record) => (
            <div 
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="glass-card p-8 flex items-center justify-between group cursor-pointer hover:scale-[1.01] active:scale-[0.99] !rounded-[2.5rem] border-white/5"
            >
              <div className="flex items-center gap-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
                  record.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" : 
                  record.status === "FAILED" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                }`}>
                  <Mail size={28} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-black text-2xl text-white tracking-tight truncate max-w-md">{record.subject}</h3>
                  <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">
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
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block space-y-1">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sender Account</p>
                    <p className="text-sm font-bold text-zinc-300">{record.account.emailAddress}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-flc-orange group-hover:bg-flc-orange/10 transition-all">
                    <ChevronRight size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail View Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Review Campaign"
        maxWidth="max-w-[90vw]"
      >
        {selectedRecord && (
          <div className="max-w-none mx-auto p-4">
            <BulkEmailPreview 
              data={JSON.parse(selectedRecord.excelData)}
              template={{
                subject: selectedRecord.subject,
                bodyHtml: selectedRecord.bodyHtml,
                images: JSON.parse(selectedRecord.imagesConfig || "[]")
              }}
              onConfirm={() => {}}
              isSending={false}
              readOnly={true}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
