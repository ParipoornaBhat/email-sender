"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEmailHistory } from "./actions";
import { History, Calendar, Mail, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import BulkEmailPreview from "@/components/email/BulkEmailPreview";
import Modal from "@/components/ui/Modal";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const router = useRouter();

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
      case "PROCESSING": return <AlertTriangle className="text-amber-500 animate-pulse" size={18} />;
      default: return <AlertTriangle className="text-amber-500" size={18} />;
    }
  };

  const selectedData = React.useMemo(() => {
    if (!selectedRecord) return null;
    return {
      data: JSON.parse(selectedRecord.excelData),
      template: {
        subject: selectedRecord.subject,
        bodyHtml: selectedRecord.bodyHtml,
        images: JSON.parse(selectedRecord.imagesConfig || "[]")
      },
      logs: JSON.parse(selectedRecord.logs || "[]")
    };
  }, [selectedRecord]);

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
            const logs = JSON.parse(record.logs || "[]");
            const successCount = logs.filter((l: any) => l.status === "SUCCESS").length;
            const failCount = logs.filter((l: any) => l.status !== "SUCCESS").length;
            const totalCount = JSON.parse(record.excelData).length;

            return (
              <div 
                key={record.id}
                onClick={() => setSelectedRecord(record)}
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
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        const logs = JSON.parse(record.logs || "[]");
                        const excelData = JSON.parse(record.excelData);
                        
                        // Reconstruct row statuses
                        const statuses: Record<number, string> = {};
                        excelData.forEach((_: any, i: number) => statuses[i] = "PENDING");
                        logs.forEach((log: any) => {
                          if (log.rowIndex !== undefined) {
                            statuses[log.rowIndex] = log.status;
                          }
                        });

                        // Calculate progress
                        const successCount = logs.filter((l: any) => l.status === "SUCCESS").length;
                        const failCount = logs.filter((l: any) => l.status !== "SUCCESS").length;

                        // Store in local storage
                        localStorage.setItem("bulk-sender-data", record.excelData);
                        localStorage.setItem("bulk-sender-template", JSON.stringify({
                          subject: record.subject,
                          bodyHtml: record.bodyHtml,
                          images: JSON.parse(record.imagesConfig || "[]")
                        }));
                        localStorage.setItem("bulk-sender-step", "3");
                        localStorage.setItem("bulk-sender-history-id", record.id);
                        localStorage.setItem("bulk-sender-logs", record.logs || "[]");
                        localStorage.setItem("bulk-sender-row-statuses", JSON.stringify(statuses));
                        localStorage.setItem("bulk-sender-progress", JSON.stringify({
                          current: logs.length,
                          total: excelData.length,
                          success: successCount,
                          failed: failCount
                        }));
                        localStorage.setItem("bulk-sender-dispatch-state", JSON.stringify("PAUSED"));
                        
                        router.push("/bulk-sender");
                      }}
                      className="p-3 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-flc-orange/20 transition-all shadow-lg group/btn"
                      title="Resume or Retry this campaign"
                    >
                      <Sparkles size={18} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-flc-orange group-hover:bg-flc-orange/10 transition-all shadow-lg">
                        <ChevronRight size={24} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
          <div className="max-w-none mx-auto">
            <BulkEmailPreview 
              data={selectedData.data}
              template={selectedData.template}
              dispatchLogs={selectedData.logs}
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
