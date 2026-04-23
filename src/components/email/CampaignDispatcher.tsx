"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import BulkEmailPreview from "./BulkEmailPreview";
import type { ExcelRow, EmailTemplate, EmailAccount } from "@/app/bulk-sender/types";
import {
  initializeCampaign,
  dispatchSingleEmail,
  updateCampaignProgress,
  getCampaignDetails,
} from "@/app/bulk-sender/actions/dispatch";
import { getAgreementStatus, acceptTerms } from "@/app/bulk-sender/actions/terms";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

type DispatchState = "IDLE" | "SENDING" | "PAUSED" | "ERROR_PAUSED" | "CANCELLED" | "COMPLETED";

interface CampaignDispatcherProps {
  /** "new" = fresh campaign, "resume" = load from server */
  mode: "new" | "resume";

  // For "new" mode — parent provides these
  initialData?: ExcelRow[];
  template?: EmailTemplate;
  accountId?: string;

  // For "resume" mode — component fetches from server
  campaignId?: string;

  // Callbacks
  onComplete?: () => void;
  onReset?: () => void;
}

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export default function CampaignDispatcher({
  mode,
  initialData,
  template: externalTemplate,
  accountId,
  campaignId,
  onComplete,
  onReset,
}: CampaignDispatcherProps) {
  // ── State ──────────────────────────────────────────
  const [data, setData] = useState<ExcelRow[]>([]);
  const [template, setTemplate] = useState<EmailTemplate>({ subject: "", bodyHtml: "", images: [] });
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const [dispatchState, setDispatchState] = useState<DispatchState>("IDLE");
  const [dispatchProgress, setDispatchProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [rowStatuses, setRowStatuses] = useState<Record<number, string>>({});
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(mode === "resume");

  // ── Refs (prevent stale closures) ──────────────────
  const actionRequested = useRef<"NONE" | "CANCEL" | "PAUSE" | "PAUSE_ERROR">("NONE");
  const rowStatusesRef = useRef<Record<number, string>>({});
  const dispatchStateRef = useRef<DispatchState>(dispatchState);

  // Sync refs
  useEffect(() => { rowStatusesRef.current = rowStatuses; }, [rowStatuses]);
  useEffect(() => { dispatchStateRef.current = dispatchState; }, [dispatchState]);

  // ── Initialization ─────────────────────────────────

  useEffect(() => {
    // Check terms agreement
    const checkTerms = async () => {
      const res = await getAgreementStatus();
      if (res.success) setHasAgreedTerms(res.agreed ?? false);
    };
    checkTerms();

    if (mode === "new") {
      // New campaign: use props directly
      const safeData = Array.isArray(initialData) ? initialData : [];
      setData(safeData);
      setTemplate(externalTemplate || { subject: "", bodyHtml: "", images: [] });
      setSelectedAccountId(accountId || "");

      // Initialize row statuses for all rows as PENDING
      const statuses: Record<number, string> = {};
      safeData.forEach((_, i) => { statuses[i] = "PENDING"; });
      setRowStatuses(statuses);
      rowStatusesRef.current = statuses;
      setDispatchProgress({ current: 0, total: safeData.length, success: 0, failed: 0 });

    } else if (mode === "resume" && campaignId) {
      // Resume campaign: fetch from server
      const loadCampaign = async () => {
        setLoading(true);
        const res = await getCampaignDetails(campaignId);
        if (res.success && res.campaign) {
          const camp = res.campaign;
          const safeData = Array.isArray(camp.excelData) ? (camp.excelData as ExcelRow[]) : 
            (typeof camp.excelData === "string" ? JSON.parse(camp.excelData || "[]") : []);
          const safeLogs = Array.isArray(camp.logs) ? (camp.logs as any[]) : 
            (typeof camp.logs === "string" ? JSON.parse(camp.logs || "[]") : []);
          const safeImages = Array.isArray(camp.imagesConfig) ? camp.imagesConfig : 
            (typeof camp.imagesConfig === "string" ? JSON.parse(camp.imagesConfig || "[]") : []);

          setData(safeData);
          setTemplate({
            subject: camp.subject || "",
            bodyHtml: camp.bodyHtml || "",
            images: safeImages as any[],
          });
          setSelectedAccountId(camp.accountId);
          setActiveHistoryId(camp.id);
          setDispatchLogs(safeLogs);

          // Determine overall state
          const isOverallPaused = camp.status.includes("PAUSED");
          const isOverallCancelled = camp.status.includes("CANCELLED");
          const isCompleted = camp.status === "COMPLETED";

          if (isOverallCancelled) {
            setDispatchState("CANCELLED");
          } else if (isCompleted) {
            setDispatchState("COMPLETED");
          } else if (isOverallPaused) {
            setDispatchState("PAUSED");
          } else {
            // PROCESSING status from a previous session = treat as PAUSED
            setDispatchState("PAUSED");
          }

          // Reconstruct per-row statuses
          const statuses: Record<number, string> = {};
          const defaultStatus = (isOverallPaused || camp.status === "PROCESSING") ? "PAUSED" : 
                                isOverallCancelled ? "CANCELLED" : "PENDING";
          const typedSafeData = safeData as ExcelRow[];
          typedSafeData.forEach((_: any, i: number) => { statuses[i] = defaultStatus; });
          safeLogs.forEach((l: any) => {
            if (l.rowIndex !== undefined) statuses[l.rowIndex] = l.status;
          });
          setRowStatuses(statuses);
          rowStatusesRef.current = statuses;

          // Progress
          const success = safeLogs.filter((l: any) => l.status === "SUCCESS").length;
          const failed = safeLogs.filter((l: any) => l.status === "FAILED").length;
          setDispatchProgress({
            current: safeLogs.length,
            total: safeData.length,
            success,
            failed,
          });
        } else {
          toast.error(res.error || "Failed to load campaign");
        }
        setLoading(false);
      };
      loadCampaign();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, campaignId]);

  // ── Dispatch Engine ────────────────────────────────

  const handleSend = async () => {
    if (!selectedAccountId) {
      toast.error("Please select an email account");
      return;
    }

    const currentState = dispatchStateRef.current;
    const isResuming = currentState === "PAUSED" || currentState === "ERROR_PAUSED" ||
                       currentState === "CANCELLED" || currentState === "COMPLETED";

    setDispatchState("SENDING");
    actionRequested.current = "NONE";
    setIsSending(true);

    let currentHistoryId = activeHistoryId;

    if (!isResuming) {
      // First send — create DB record
      setDispatchProgress({ current: 0, total: data.length, success: 0, failed: 0 });
      setDispatchLogs([]);
      const freshStatuses: Record<number, string> = {};
      data.forEach((_, i) => { freshStatuses[i] = "PENDING"; });
      setRowStatuses(freshStatuses);
      rowStatusesRef.current = freshStatuses;

      const initRes = await initializeCampaign({
        accountId: selectedAccountId,
        template: JSON.parse(JSON.stringify(template)),
        data: JSON.parse(JSON.stringify(data)),
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
        excelData: JSON.parse(JSON.stringify(data)),
      });
    }

    const logs = [...dispatchLogs];
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
        rowIndex: i + 1,
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
          status: "PROCESSING",
        });
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      if ((actionRequested.current as string) === "PAUSE_ERROR") break;
    }

    // ── Post-loop: determine final status ──

    if ((actionRequested.current as string) === "PAUSE") {
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

    const allSuccess = successCount === data.length;
    const isCancelled = (actionRequested.current as string) === "CANCEL";
    let finalState: DispatchState;
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

    if (allSuccess) toast.success(`All ${successCount} emails sent successfully!`);
    else if (isCancelled) toast.info(`Campaign cancelled. Sent ${successCount} emails.`);
    else toast.success(`Campaign finished! Sent ${successCount}, Failed ${failCount}`);

    setIsSending(false);
    onComplete?.();
  };

  // ── Action Handlers ────────────────────────────────

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

  const handleRowAction = (index: number, action: "PAUSE" | "RESUME" | "CANCEL" | "RETRY") => {
    if (action === "PAUSE") {
      setRowStatuses(prev => ({ ...prev, [index]: "PAUSED" }));
      toast.info(`Email #${index + 1} paused`);
    } else if (action === "RESUME" || action === "RETRY") {
      setRowStatuses(prev => ({ ...prev, [index]: "PENDING" }));
      if (dispatchState !== "SENDING") handleSend();
    } else if (action === "CANCEL") {
      setRowStatuses(prev => ({ ...prev, [index]: "CANCELLED" }));
      toast.info(`Email #${index + 1} cancelled`);
    }
  };

  const handleCancelDispatch = () => {
    actionRequested.current = "CANCEL";
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
          status: `CANCELLED (${dispatchProgress.success}/${data.length} sent)`,
        });
      }
    } else {
      toast.info("Cancelling... waiting for current email to finish.");
    }
  };

  const handlePauseDispatch = () => {
    actionRequested.current = "PAUSE";
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
    onReset?.();
  };

  // ── Render ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-16 h-16 border-4 border-white/5 border-t-flc-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-card p-16 text-center space-y-4 !rounded-[3rem]">
        <p className="text-zinc-500 text-lg font-bold">No recipient data found for this campaign.</p>
      </div>
    );
  }

  return (
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
  );
}
