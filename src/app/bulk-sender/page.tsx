"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mail, FileSpreadsheet, Image as ImageIcon, Eye, ArrowRight, ArrowLeft, Sparkles, Trash2, History, ChevronRight } from "lucide-react";
import ExcelDropzone from "@/components/email/ExcelDropzone";
import ImageConfigurator from "@/components/email/ImageConfigurator";
import BulkEmailPreview from "@/components/email/BulkEmailPreview";
import type { ExcelRow, EmailTemplate, EmailAccount } from "./types";
import { getEmailAccounts } from "./actions/accounts";
import { getGalleryImages } from "./actions/gallery";
import { initializeCampaign, dispatchSingleEmail, updateCampaignProgress, getCampaignHistory, getCampaignDetails } from "./actions/dispatch";
import { getAgreementStatus, acceptTerms } from "./actions/terms";
import RichTextEditor from "@/components/email/RichTextEditor";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { Code2, Type } from "lucide-react";

const STEPS = [
  { id: "data", name: "Recipients", icon: FileSpreadsheet },
  { id: "content", name: "Content", icon: Mail },
  { id: "images", name: "Certificates", icon: ImageIcon },
  { id: "preview", name: "Preview", icon: Eye },
];

export default function BulkSenderPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<ExcelRow[]>([]);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<any[]>([]);

  const [template, setTemplate] = useState<EmailTemplate>({
    subject: "Hello {Name}!",
    bodyHtml: "<h1>Welcome!</h1><p>This is a custom email for {Name}.</p>",
    images: [],
  });

  const [isSending, setIsSending] = useState(false);
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");

  // Dispatch Tracking State
  const [dispatchState, setDispatchState] = useState<"IDLE" | "SENDING" | "PAUSED" | "ERROR_PAUSED" | "CANCELLED" | "COMPLETED">("IDLE");
  const [dispatchProgress, setDispatchProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [rowStatuses, setRowStatuses] = useState<Record<number, string>>({});
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const actionRequested = useRef<"NONE" | "CANCEL" | "PAUSE" | "PAUSE_ERROR">("NONE");
  const rowStatusesRef = useRef<Record<number, string>>({});
  const dispatchStateRef = useRef(dispatchState);

  useEffect(() => {
    // Load from localStorage on mount
    const savedData = localStorage.getItem("bulk-sender-data");
    const savedTemplate = localStorage.getItem("bulk-sender-template");
    const savedStep = localStorage.getItem("bulk-sender-step");
    const savedRowStatuses = localStorage.getItem("bulk-sender-row-statuses");
    const savedLogs = localStorage.getItem("bulk-sender-logs");
    const savedProgress = localStorage.getItem("bulk-sender-progress");
    const savedAccountId = localStorage.getItem("bulk-sender-account-id");
    const savedHistoryId = localStorage.getItem("bulk-sender-history-id");
    const savedState = localStorage.getItem("bulk-sender-dispatch-state");
    
    const loadedHistoryId = savedHistoryId;
    const loadedState = savedState ? JSON.parse(savedState) : null;

    if (savedData) setData(JSON.parse(savedData));
    if (savedTemplate) setTemplate(JSON.parse(savedTemplate));
    if (savedStep) setCurrentStep(parseInt(savedStep));
    if (savedRowStatuses) {
      const rs = JSON.parse(savedRowStatuses);
      setRowStatuses(rs);
      rowStatusesRef.current = rs;
    }
    if (savedLogs) setDispatchLogs(JSON.parse(savedLogs));
    if (savedProgress) setDispatchProgress(JSON.parse(savedProgress));
    if (savedAccountId) setSelectedAccountId(savedAccountId);
    if (loadedHistoryId) setActiveHistoryId(loadedHistoryId);
    
    // Safety: if we were "sending" but the page reloaded, we are now "paused"
    if (loadedState === "SENDING" || loadedState === "RETRYING") {
      setDispatchState("PAUSED");
      dispatchStateRef.current = "PAUSED";
    } else if (loadedState) {
      setDispatchState(loadedState);
      dispatchStateRef.current = loadedState;
    }

    // Set this AFTER all localStorage loads are scheduled
    setTimeout(() => setIsInitialLoadComplete(true), 100);

    const fetchData = async () => {
      const [accRes, imgRes, histRes] = await Promise.all([
        getEmailAccounts(),
        getGalleryImages(),
        getCampaignHistory()
      ]);

      if (accRes.success && accRes.data) {
        setAccounts(accRes.data as EmailAccount[]);
        // Only set default if nothing was loaded from localStorage
        if (accRes.data.length > 0 && !savedAccountId) setSelectedAccountId(accRes.data[0]!.id);
      }
      if (imgRes.success && imgRes.data) setGalleryImages(imgRes.data);
      if (histRes.success && histRes.history) setRecentHistory(histRes.history);

      // SYNC WITH SERVER: If we have an active campaign, get the latest truth
      if (loadedHistoryId) {
        const details = await getCampaignDetails(loadedHistoryId);
        if (details.success && details.campaign) {
          const camp = details.campaign;
          const safeLogs = Array.isArray(camp.logs) ? (camp.logs as any[]) : [];
          const safeData = Array.isArray(camp.excelData) ? (camp.excelData as ExcelRow[]) : [];
          
          setData(safeData); // Sync the actual recipient list from server
          setDispatchLogs(safeLogs);
          const isOverallPaused = camp.status.includes("PAUSED");
          const isOverallCancelled = camp.status.includes("CANCELLED");
          
          setDispatchState(isOverallCancelled ? "CANCELLED" : isOverallPaused ? "PAUSED" : camp.status as any);
          
          // Reconstruct statuses
          const freshStatuses: Record<number, string> = {};
          safeData.forEach((_: any, i: number) => {
            // Default to PAUSED if overall campaign is paused, otherwise PENDING
            freshStatuses[i] = isOverallPaused ? "PAUSED" : "PENDING";
          });
          safeLogs.forEach((l: any) => { 
            if (l.rowIndex !== undefined) freshStatuses[l.rowIndex] = l.status; 
          });
          setRowStatuses(freshStatuses);
          rowStatusesRef.current = freshStatuses;

          // Update progress
          const success = safeLogs.filter((l: any) => l.status === "SUCCESS").length;
          setDispatchProgress({ current: safeLogs.length, total: safeData.length, success, failed: safeLogs.length - success });
        }
      }
    };
    fetchData();

    const checkAgreement = async () => {
      const res = await getAgreementStatus();
      if (res.success) setHasAgreedTerms(res.agreed ?? false);
    };
    checkAgreement();
  }, []);

  // Sync refs with state
  useEffect(() => {
    rowStatusesRef.current = rowStatuses;
  }, [rowStatuses]);
  useEffect(() => {
    dispatchStateRef.current = dispatchState;
  }, [dispatchState]);

  // Initialize row statuses when data changes
  useEffect(() => {
    if (!isInitialLoadComplete) return;

    if (Array.isArray(data) && data.length > 0) {
      setRowStatuses(prev => {
        const newStatuses = { ...prev || {} };
        let changed = false;

        data.forEach((_, idx) => {
          if (!newStatuses[idx]) {
            newStatuses[idx] = "PENDING";
            changed = true;
          }
        });
        return changed ? newStatuses : prev;
      });
    } else {
      setRowStatuses({});
    }
  }, [data, isInitialLoadComplete]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isInitialLoadComplete) return;

    localStorage.setItem("bulk-sender-data", JSON.stringify(data));
    localStorage.setItem("bulk-sender-template", JSON.stringify(template));
    localStorage.setItem("bulk-sender-step", currentStep.toString());
    localStorage.setItem("bulk-sender-account-id", selectedAccountId || "");
    localStorage.setItem("bulk-sender-row-statuses", JSON.stringify(rowStatuses));
    localStorage.setItem("bulk-sender-logs", JSON.stringify(dispatchLogs));
    localStorage.setItem("bulk-sender-progress", JSON.stringify(dispatchProgress));
    localStorage.setItem("bulk-sender-history-id", activeHistoryId || "");
    localStorage.setItem("bulk-sender-dispatch-state", JSON.stringify(dispatchState));
  }, [data, template, currentStep, rowStatuses, dispatchLogs, dispatchProgress, activeHistoryId, dispatchState, selectedAccountId]);

  const handleSend = async () => {
    if (!selectedAccountId) {
      toast.error("Please select an email account");
      return;
    }

    // Use ref to avoid stale closure — state may not have flushed yet
    const currentState = dispatchStateRef.current;
    const isResuming = currentState === "PAUSED" || currentState === "ERROR_PAUSED" || currentState === "CANCELLED" || currentState === "COMPLETED";

    setDispatchState("SENDING");
    actionRequested.current = "NONE";
    setIsSending(true);

    let currentHistoryId = activeHistoryId;

    if (!isResuming) {
      setDispatchProgress({ current: 0, total: data.length, success: 0, failed: 0 });
      setDispatchLogs([]);
      const freshStatuses: Record<number, string> = {};
      if (Array.isArray(data)) {
        data.forEach((_, i) => freshStatuses[i] = "PENDING");
      }
      setRowStatuses(freshStatuses);
      rowStatusesRef.current = freshStatuses;

      const sanitizedTemplate = JSON.parse(JSON.stringify(template));
      const sanitizedData = JSON.parse(JSON.stringify(data));

      const initRes = await initializeCampaign({
        accountId: selectedAccountId,
        template: sanitizedTemplate,
        data: sanitizedData
      });
      if (initRes.success && initRes.historyId) {
        currentHistoryId = initRes.historyId;
        setActiveHistoryId(initRes.historyId);
      } else {
        toast.error("Failed to initialize campaign tracking in database.");
        setIsSending(false);
        setDispatchState("IDLE");
        return;
      }
    } else if (currentState === "ERROR_PAUSED" && currentHistoryId) {
      await updateCampaignProgress({
        historyId: currentHistoryId,
        logs: JSON.parse(JSON.stringify(dispatchLogs)),
        status: "PROCESSING",
        excelData: JSON.parse(JSON.stringify(data))
      });
    }

    const logs = [...dispatchLogs];

    // Recalculate counts from current ref (most up-to-date)
    const currentStatuses = rowStatusesRef.current;
    let successCount = Object.values(currentStatuses).filter(s => s === "SUCCESS").length;
    let failCount = Object.values(currentStatuses).filter(s => s === "FAILED").length;
    let processedCount = successCount + failCount;

    for (let i = 0; i < data.length; i++) {
      if (actionRequested.current !== "NONE") break;

      const rowStatus = rowStatusesRef.current[i];
      if (rowStatus === "SUCCESS" || rowStatus === "CANCELLED" || rowStatus === "PAUSED") continue;

      const row = data[i]!;
      const targetEmail = (row.Email || row.email || Object.values(row)[0]) as string;
      setCurrentlyProcessing(targetEmail);
      setRowStatuses(prev => ({ ...prev, [i]: "SENDING" }));

      const result = await dispatchSingleEmail({
        accountId: selectedAccountId,
        row: JSON.parse(JSON.stringify(row)),
        template: JSON.parse(JSON.stringify(template)),
        rowIndex: i + 1
      });

      const updatedLog = { ...result.log, rowIndex: i };
      logs.push(updatedLog);
      setDispatchLogs([...logs]);

      processedCount++;
      if (result.success) {
        successCount++;
        setRowStatuses(prev => ({ ...prev, [i]: "SUCCESS" }));
      } else {
        failCount++;
        setRowStatuses(prev => ({ ...prev, [i]: "FAILED" }));
      }

      setDispatchProgress({ current: processedCount, total: data.length, success: successCount, failed: failCount });
      setCurrentlyProcessing(null);

      if (currentHistoryId) {
        await updateCampaignProgress({
          historyId: currentHistoryId,
          logs: JSON.parse(JSON.stringify(logs)),
          status: "PROCESSING"
        });
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      if ((actionRequested.current as string) === "PAUSE_ERROR") break;
    }

    if ((actionRequested.current as string) === "PAUSE") {
      // Mark all remaining PENDING rows as PAUSED
      const pausedStatuses = { ...rowStatusesRef.current };
      Object.keys(pausedStatuses).forEach(k => {
        if (pausedStatuses[parseInt(k)] === "PENDING") pausedStatuses[parseInt(k)] = "PAUSED";
      });
      setRowStatuses(pausedStatuses);
      rowStatusesRef.current = pausedStatuses;
      setDispatchState("PAUSED");
      if (currentHistoryId) {
        await updateCampaignProgress({ historyId: currentHistoryId, logs: JSON.parse(JSON.stringify(logs)), status: "PAUSED" });
      }
      setIsSending(false);
      return;
    }
    if ((actionRequested.current as string) === "PAUSE_ERROR") {
      setDispatchState("ERROR_PAUSED");
      if (currentHistoryId) {
        await updateCampaignProgress({ historyId: currentHistoryId, logs: JSON.parse(JSON.stringify(logs)), status: "ERROR_PAUSED" });
      }
      setIsSending(false);
      return;
    }

    // Determine final status based on actual outcomes
    const allSuccess = successCount === data.length;
    const isCancelled = (actionRequested.current as string) === "CANCEL";

    let finalState: typeof dispatchState;
    let finalStatus: string;

    if (allSuccess) {
      finalState = "COMPLETED";
      finalStatus = "COMPLETED";
    } else if (isCancelled) {
      finalState = "CANCELLED";
      finalStatus = `CANCELLED (${successCount}/${data.length} sent)`;
    } else {
      finalState = "COMPLETED";
      finalStatus = failCount === 0 ? "COMPLETED" : "PARTIAL";
    }

    setDispatchState(finalState);

    if (currentHistoryId) {
      await updateCampaignProgress({ historyId: currentHistoryId, logs: JSON.parse(JSON.stringify(logs)), status: finalStatus });
    }

    if (allSuccess) {
      toast.success(`All ${successCount} emails sent successfully!`);
    } else if (isCancelled) {
      toast.info(`Campaign cancelled. Sent ${successCount} emails.`);
    } else {
      toast.success(`Campaign finished! Sent ${successCount}, Failed ${failCount}`);
    }
    setIsSending(false);
  };

  const handleResumeAll = () => {
    const next = { ...rowStatusesRef.current };
    Object.keys(next).forEach(k => { if (next[parseInt(k)] === "PAUSED") next[parseInt(k)] = "PENDING"; });
    setRowStatuses(next);
    rowStatusesRef.current = next;
    handleSend();
  };

  const handleRetryFailed = () => {
    const next = { ...rowStatusesRef.current };
    Object.keys(next).forEach(k => { if (next[parseInt(k)] === "FAILED") next[parseInt(k)] = "PENDING"; });
    setRowStatuses(next);
    rowStatusesRef.current = next;
    handleSend();
  };

  const handleRetryCancelled = () => {
    const next = { ...rowStatusesRef.current };
    Object.keys(next).forEach(k => { if (next[parseInt(k)] === "CANCELLED") next[parseInt(k)] = "PENDING"; });
    setRowStatuses(next);
    rowStatusesRef.current = next;
    handleSend();
  };

  const handleRowAction = async (index: number, action: "PAUSE" | "RESUME" | "CANCEL" | "RETRY") => {
    if (action === "PAUSE") {
      setRowStatuses(prev => ({ ...prev, [index]: "PAUSED" }));
      toast.info(`Email #${index + 1} paused`);
    } else if (action === "RESUME" || action === "RETRY") {
      setRowStatuses(prev => ({ ...prev, [index]: "PENDING" }));
      // If not already sending, start sending
      if (dispatchState !== "SENDING") {
        handleSend();
      }
    } else if (action === "CANCEL") {
      setRowStatuses(prev => ({ ...prev, [index]: "CANCELLED" }));
      toast.info(`Email #${index + 1} cancelled`);
    }
  };

  const handleCancelDispatch = () => {
    actionRequested.current = "CANCEL";
    // Mark all PENDING and PAUSED rows as CANCELLED immediately
    const next = { ...rowStatusesRef.current };
    Object.keys(next).forEach(k => {
      const s = next[parseInt(k)];
      if (s === "PENDING" || s === "PAUSED") next[parseInt(k)] = "CANCELLED";
    });
    setRowStatuses(next);
    rowStatusesRef.current = next;
    if (dispatchState === "PAUSED" || dispatchState === "ERROR_PAUSED") {
      setDispatchState("CANCELLED");
      setIsSending(false);
      if (activeHistoryId) {
        updateCampaignProgress({
          historyId: activeHistoryId,
          logs: JSON.parse(JSON.stringify(dispatchLogs)),
          status: `CANCELLED (${dispatchProgress.success}/${data.length} sent)`
        });
      }
    } else {
      toast.info("Cancelling... waiting for current email to finish.");
    }
  };

  const handlePauseDispatch = () => {
    actionRequested.current = "PAUSE";
    // Immediately mark PENDING rows as PAUSED for instant visual feedback
    const next = { ...rowStatusesRef.current };
    Object.keys(next).forEach(k => {
      if (next[parseInt(k)] === "PENDING") next[parseInt(k)] = "PAUSED";
    });
    setRowStatuses(next);
    rowStatusesRef.current = next;
    toast.info("Pausing... current email will finish sending.");
  };

  const handleDataEdit = (rowIndex: number, newData: any) => {
    setData(prev => {
      const arr = [...prev];
      arr[rowIndex] = newData;
      return arr;
    });
  };

  const handleLoadHistory = async (historyId: string) => {
    const res = await getCampaignDetails(historyId);
    if (res.success && res.campaign) {
      const { campaign } = res;
      setData(campaign.excelData as ExcelRow[]);
      setTemplate({
        subject: campaign.subject || "",
        bodyHtml: campaign.bodyHtml || "",
        images: (campaign.imagesConfig as unknown as any[]) || []
      });
      setSelectedAccountId(campaign.accountId);
      setActiveHistoryId(campaign.id);

      // Reconstruct row statuses from logs
      const statuses: Record<number, string> = {};
      const safeData = Array.isArray(campaign.excelData) ? (campaign.excelData as ExcelRow[]) : [];
      const safeLogs = Array.isArray(campaign.logs) ? (campaign.logs as any[]) : [];
      
      const isOverallPaused = campaign.status.includes("PAUSED");
      
      safeData.forEach((_: any, i: number) => {
        statuses[i] = isOverallPaused ? "PAUSED" : "PENDING";
      });
      safeLogs.forEach((log: any) => {
        if (log.rowIndex !== undefined) {
          statuses[log.rowIndex] = log.status;
        }
      });
      setRowStatuses(statuses);
      rowStatusesRef.current = statuses;
      setDispatchLogs(safeLogs);

      // Update progress
      const success = safeLogs.filter((l: any) => l.status === "SUCCESS").length;
      const failed = safeLogs.filter((l: any) => l.status !== "SUCCESS").length;
      setDispatchProgress({ 
        current: safeLogs.length, 
        total: safeData.length, 
        success, 
        failed 
      });

      setDispatchState("PAUSED"); // Treat as paused so user can resume
      dispatchStateRef.current = "PAUSED";
      setCurrentStep(3); // Go straight to preview
      toast.success("Campaign loaded from history");
    } else {
      toast.error(res.error || "Failed to load campaign");
    }
  };

  const handleNewData = (excelData: ExcelRow[]) => {
    setData(excelData);
    setRowStatuses({});
    rowStatusesRef.current = {};
    setDispatchLogs([]);
    setDispatchProgress({ current: 0, total: excelData.length, success: 0, failed: 0 });
    setDispatchState("IDLE");
    dispatchStateRef.current = "IDLE";
    setCurrentStep(1); // Move to content step
  };

  const handleResetAndNew = () => {
    setDispatchState("IDLE");
    dispatchStateRef.current = "IDLE";
    setDispatchProgress({ current: 0, total: 0, success: 0, failed: 0 });
    setDispatchLogs([]);
    setRowStatuses({});
    rowStatusesRef.current = {};
    setActiveHistoryId(null);
    setCurrentlyProcessing(null);
    actionRequested.current = "NONE";
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep === 0 && data.length === 0) {
      toast.error("Please upload recipient data first");
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const resetProgress = () => {
    if (confirm("Clear all draft progress?")) {
      const keys = [
        "bulk-sender-data", "bulk-sender-template", "bulk-sender-step",
        "bulk-sender-row-statuses", "bulk-sender-logs", "bulk-sender-progress",
        "bulk-sender-history-id", "bulk-sender-dispatch-state"
      ];
      keys.forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl pt-4 pb-20">
      {/* Progress Stepper */}
      <div className="flex justify-between items-center mb-4 max-w-2xl mx-auto px-8 relative">
        <div className="absolute top-5 left-0 w-full h-[2px] bg-white/5 -z-10" />
        <div
          className="absolute top-5 left-0 h-[2px] bg-flc-orange -z-10 transition-all duration-700 ease-in-out"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-4 relative px-4 group">
            <button
              onClick={() => {
                // If moving to preview and we are in IDLE, make sure it's fresh
                if (idx === 3 && dispatchState === "IDLE") {
                  setDispatchLogs([]);
                  setActiveHistoryId(null);
                }
                setCurrentStep(idx);
              }}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 cursor-pointer ${idx <= currentStep
                ? "bg-flc-orange text-white shadow-[0_0_20px_rgba(242,140,40,0.3)] scale-110"
                : "bg-flc-purple-dark text-zinc-600 border-2 border-white/5 hover:border-flc-orange/30"
                }`}
            >
              <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${idx <= currentStep ? "text-flc-orange" : "text-zinc-600"}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="min-h-[600px]">
          {currentStep === 0 && (
            <div className="max-w-[1400px] mx-auto space-y-6">
              <div className="text-center space-y-2 relative">
                <button
                  onClick={resetProgress}
                  className="absolute right-0 top-0 text-[10px] font-black text-zinc-600 hover:text-red-500 uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Reset Draft
                </button>
                <h2 className="text-2xl sm:text-4xl font-black lilita-font text-white tracking-tight">Campaign Data</h2>
                <p className="text-zinc-500 text-sm sm:text-base font-medium">Select your sender and upload the recipient list.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-flc-orange/10 flex items-center justify-center text-flc-orange">
                        <span className="font-black text-xs">01</span>
                      </div>
                      <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Select Sender Account</label>
                    </div>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full h-16 px-6 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 focus:border-flc-orange/30 focus:ring-4 focus:ring-flc-orange/5 outline-none font-bold text-lg text-white appearance-none transition-all shadow-xl"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} className="bg-flc-purple-dark">{acc.emailAddress}</option>
                      ))}
                      {accounts.length === 0 && <option disabled>No accounts connected</option>}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-flc-orange/10 flex items-center justify-center text-flc-orange">
                        <span className="font-black text-xs">02</span>
                      </div>
                      <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Upload Recipient List</label>
                    </div>
                    <div className="glass-card !rounded-[3rem] p-2 bg-white/[0.02] border-white/5">
                      <ExcelDropzone onDataLoaded={handleNewData} />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  {recentHistory.length > 0 ? (
                    <div className="glass-card !rounded-[2.5rem] p-8 bg-white/5 border-white/10 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-white lilita-font tracking-tight">Resume Recent</h4>
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Pick up where you left off</p>
                        </div>
                        <History size={20} className="text-flc-orange" />
                      </div>
                      <div className="space-y-3 flex-1">
                        {recentHistory.slice(0, 5).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleLoadHistory(item.id)}
                            className="w-full text-left p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-flc-orange/30 transition-all group flex items-center justify-between"
                          >
                            <div className="space-y-0.5 overflow-hidden">
                              <p className="text-sm font-black text-white truncate group-hover:text-flc-orange transition-colors">
                                {item.subject || "No Subject"}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <p className={`text-[9px] font-bold uppercase tracking-widest ${item.status === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500'
                                  }`}>
                                  {item.status}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-zinc-600 group-hover:text-flc-orange transition-all" />
                          </button>
                        ))}
                      </div>
                      {recentHistory.length > 5 && (
                        <button
                          onClick={() => window.location.href = '/history'}
                          className="mt-6 text-center w-full py-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                          View All History
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="glass-card !rounded-[3rem] p-10 bg-white/5 border-white/10 h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                      <History size={48} className="text-zinc-700" />
                      <div className="space-y-1">
                        <p className="font-black text-white uppercase tracking-widest text-xs">No Recent Campaigns</p>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Your past work will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {data.length > 0 && (
                <div className="glass-card p-8 !rounded-[2rem] border-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white uppercase tracking-wider">Data Loaded</h4>
                        <p className="text-zinc-500 text-sm font-bold">{data.length} recipients found</p>
                      </div>
                    </div>
                    <button onClick={() => setData([])} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Clear Data</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6 max-w-full mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-flc-orange/10 flex items-center justify-center text-flc-orange shadow-inner">
                        <Mail className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl sm:text-3xl font-black lilita-font tracking-tight">Compose Email</h3>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => setEditorMode("visual")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editorMode === "visual" ? "bg-flc-orange text-white" : "text-zinc-500 hover:text-white"
                          }`}
                      >
                        <Type size={12} />
                        Visual
                      </button>
                      <button
                        onClick={() => setEditorMode("html")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editorMode === "html" ? "bg-flc-orange text-white" : "text-zinc-500 hover:text-white"
                          }`}
                      >
                        <Code2 size={12} />
                        HTML
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 glass-card p-8 !rounded-[2.5rem]">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-2">Subject Line</label>
                      <input
                        type="text"
                        value={template.subject}
                        onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                        className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/5 focus:border-flc-orange/30 focus:ring-4 focus:ring-flc-orange/5 outline-none text-xl font-bold text-white transition-all"
                        placeholder="e.g. Invitation for {Name}"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-2">
                        {editorMode === "visual" ? "Message Content" : "HTML Source Code"}
                      </label>

                      <div className="rounded-[2.5rem] overflow-hidden shadow-2xl">
                        {editorMode === "visual" ? (
                          <RichTextEditor
                            value={template.bodyHtml}
                            onChange={(val) => setTemplate({ ...template, bodyHtml: val })}
                          />
                        ) : (
                          <div className="h-[450px] border border-white/5 bg-zinc-950">
                            <Editor
                              height="100%"
                              defaultLanguage="html"
                              theme="vs-dark"
                              value={template.bodyHtml}
                              onChange={(val) => setTemplate({ ...template, bodyHtml: val || "" })}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 16,
                                padding: { top: 30, bottom: 30 },
                                wordWrap: "on",
                                fontFamily: "JetBrains Mono"
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-black lilita-font tracking-tight">Live Preview</h3>
                  </div>

                  <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] h-[650px] flex flex-col overflow-hidden border border-zinc-200">
                    {/* Gmail Browser Bar */}
                    <div className="bg-zinc-100 px-6 py-3 flex items-center gap-4 border-b border-zinc-200">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                      </div>
                      <div className="bg-white px-4 py-1 rounded-md border border-zinc-200 flex-1 text-[10px] text-zinc-400 font-medium truncate">
                        mail.google.com/mail/u/0/#inbox
                      </div>
                    </div>

                    {/* Gmail Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Toolbar */}
                      <div className="px-6 py-3 border-b border-zinc-100 flex items-center gap-6 text-zinc-500">
                        <ArrowLeft size={18} />
                        <div className="w-px h-4 bg-zinc-200" />
                        <Trash2 size={18} />
                        <Mail size={18} />
                      </div>

                      <div className="p-8 space-y-8 overflow-y-auto">
                        {/* Subject */}
                        <h4 className="text-2xl font-medium text-zinc-900 px-2">
                          {template.subject.replace(/{(\w+)}/g, "John Doe")}
                        </h4>

                        {/* Sender Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold">
                            F
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-zinc-900">
                                {accounts.find(a => a.id === selectedAccountId)?.orgName || "Finite Loop Club"}
                                <span className="font-normal text-zinc-500 ml-2">&lt;{accounts.find(a => a.id === selectedAccountId)?.emailAddress || "sender@flc.com"}&gt;</span>
                              </p>
                              <p className="text-xs text-zinc-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">to me</p>
                          </div>
                        </div>

                        {/* Body */}
                        <div
                          className="prose prose-zinc max-w-none text-zinc-800 email-preview-content"
                          dangerouslySetInnerHTML={{ __html: template.bodyHtml.replace(/{(\w+)}/g, `<span class="bg-blue-100 text-blue-600 px-1 rounded font-bold">[$1]</span>`) }}
                        />
                      </div>
                    </div>
                  </div>
                  <style jsx global>{`
                        .email-preview-content h1 { font-size: 2rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; }
                        .email-preview-content h2 { font-size: 1.5rem !important; font-weight: 700 !important; margin-bottom: 0.75rem !important; }
                        .email-preview-content h3 { font-size: 1.25rem !important; font-weight: 600 !important; margin-bottom: 0.5rem !important; }
                        .email-preview-content p { margin-bottom: 1rem !important; }
                        .email-preview-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
                        .email-preview-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
                        .email-preview-content strong { font-weight: 700 !important; }
                        .email-preview-content em { font-style: italic !important; }
                    `}</style>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="max-w-full mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-4xl font-black lilita-font tracking-tight">Certificate Designer</h2>
                <p className="text-zinc-500 text-sm sm:text-base font-medium">Map dynamic text to your certificate images.</p>
              </div>
              <div className="glass-card p-2 sm:p-4 !rounded-[2rem] sm:!rounded-[4rem]">
                <ImageConfigurator
                  configs={template.images}
                  onChange={(imgs) => setTemplate({ ...template, images: imgs })}
                  availableImages={galleryImages}
                  excelHeaders={data.length > 0 ? Object.keys(data[0]!) : []}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="max-w-full mx-auto">
              <BulkEmailPreview
                data={data}
                template={template}
                onConfirm={handleSend}
                isSending={isSending}
                hasAgreedTerms={hasAgreedTerms}
                dispatchState={dispatchState}
                dispatchProgress={dispatchProgress}
                dispatchLogs={dispatchLogs}
                rowStatuses={rowStatuses}
                onRowAction={handleRowAction}
                currentlyProcessing={currentlyProcessing}
                onPauseDispatch={handlePauseDispatch}
                onCancelDispatch={handleCancelDispatch}
                onResumeDispatch={handleResumeAll}
                onRetryFailed={handleRetryFailed}
                onRetryCancelled={handleRetryCancelled}
                onResetAndNew={handleResetAndNew}
                onDataEdit={handleDataEdit}
                onAgree={async () => {
                  const res = await acceptTerms();
                  if (res.success) {
                    setHasAgreedTerms(true);
                    window.location.reload();
                  } else {
                    toast.error(res.error || "Failed to accept terms");
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Floating Controls */}
        <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-[90%] sm:w-fit min-w-0 sm:min-w-[400px] max-w-md glass-card p-3 sm:p-4 flex items-center justify-between !rounded-full border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] z-50">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-full text-zinc-400 font-black uppercase text-[10px] sm:text-xs tracking-widest hover:text-white hover:bg-white/5 transition-all disabled:opacity-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {currentStep < STEPS.length - 1 && (
            <button
              onClick={nextStep}
              className="btn-primary flex items-center justify-center gap-2 sm:gap-3 !px-6 sm:!px-10 !py-3 sm:!py-4 !rounded-full !text-[10px] sm:!text-xs !font-black !uppercase !tracking-widest flex-1 sm:flex-none ml-2 sm:ml-0"
            >
              Next Step
              <ArrowRight className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
