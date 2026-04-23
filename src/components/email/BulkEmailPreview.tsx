"use client";

import React, { useState, useMemo } from "react";
import {
    ChevronLeft, ChevronRight, Send, User, Mail,
    Image as ImageIcon, Sparkles, Loader2, Search,
    CheckCircle2, Paperclip, FileImage, ExternalLink, X, Edit2, Pause, Clock
} from "lucide-react";
import type { ExcelRow, ImageConfig, EmailTemplate } from "@/app/bulk-sender/types";
import Image from "next/image";

interface BulkEmailPreviewProps {
    data: ExcelRow[];
    template: EmailTemplate;
    onConfirm: () => void;
    isSending: boolean;
    readOnly?: boolean;
    hasAgreedTerms?: boolean;
    onAgree?: () => Promise<void>;
    dispatchState?: "IDLE" | "SENDING" | "PAUSED" | "ERROR_PAUSED" | "CANCELLED" | "COMPLETED";
    dispatchProgress?: { current: number; total: number; success: number; failed: number };
    dispatchLogs?: { email: string; status: string; error?: string; rowIndex?: number }[];
    currentlyProcessing?: string | null;
    onCancelDispatch?: () => void;
    onPauseDispatch?: () => void;
    onResumeDispatch?: () => void;
    onRetryFailed?: () => void;
    onRetryCancelled?: () => void;
    onResetAndNew?: () => void;
    onDataEdit?: (rowIndex: number, newData: any) => void;
    rowStatuses?: Record<number, string>;
    onRowAction?: (index: number, action: "PAUSE" | "RESUME" | "CANCEL" | "RETRY") => void;
}

export default function BulkEmailPreview({
    data,
    template,
    onConfirm,
    isSending,
    readOnly = false,
    hasAgreedTerms = false,
    onAgree,
    dispatchState = "IDLE",
    dispatchProgress = { current: 0, total: 0, success: 0, failed: 0 },
    dispatchLogs = [],
    currentlyProcessing = null,
    onCancelDispatch,
    onPauseDispatch,
    onResumeDispatch,
    onRetryFailed,
    onRetryCancelled,
    onResetAndNew,
    onDataEdit,
    rowStatuses = {},
    onRowAction
}: BulkEmailPreviewProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Reconstruct row statuses from logs if in read-only mode
    const effectiveRowStatuses = useMemo(() => {
        if (!readOnly) return rowStatuses;
        const statuses: Record<number, string> = {};
        dispatchLogs.forEach(log => {
            if (log.rowIndex !== undefined && log.rowIndex !== null) {
                statuses[log.rowIndex] = log.status;
            }
        });
        return statuses;
    }, [readOnly, rowStatuses, dispatchLogs]);
    const [localAcceptedTerms, setLocalAcceptedTerms] = useState(false);
    const [isAgreeing, setIsAgreeing] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null); // For inline row editing
    const [editData, setEditData] = useState<any>(null); // For inline editing

    const interpolate = (text: string, row: ExcelRow) => {
        return text.replace(/{([^}]+)}/g, (_, key) => {
            return String(row[key] || `{${key}}`);
        });
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter(row => {
            const str = JSON.stringify(row).toLowerCase();
            return str.includes(searchTerm.toLowerCase());
        });
    }, [data, searchTerm]);

    const currentRow = filteredData[selectedIndex] || filteredData[0] || data[0];

    const interpolatedSubject = currentRow ? interpolate(template.subject, currentRow) : "";
    const interpolatedBody = currentRow ? interpolate(template.bodyHtml, currentRow) : "";

    const terminalEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [dispatchLogs]);

    const isCurrentlySending = dispatchState === "SENDING";

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Global Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 sm:px-4">
                <div className="space-y-2">
                    <h3 className="text-2xl sm:text-4xl font-black text-white lilita-font tracking-tight">
                        {dispatchState === "IDLE" ? "Final Dispatch Check" : "Live Dispatch Progress"}
                    </h3>
                    <p className="text-zinc-500 font-medium text-sm sm:text-base">
                        {dispatchState === "IDLE" 
                            ? "Review and verify individual recipient data before mass dispatch."
                            : "Real-time progress and granular control of your campaign."}
                    </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-4">
                    {!hasAgreedTerms && dispatchState === "IDLE" && !readOnly ? (
                        <div className="flex flex-col items-end gap-4 bg-flc-orange/5 p-6 rounded-[2rem] border border-flc-orange/20">
                             {/* ... same terms code ... */}
                             <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={localAcceptedTerms}
                                    onChange={(e) => setLocalAcceptedTerms(e.target.checked)}
                                    className="w-5 h-5 rounded-lg accent-flc-orange border-white/10 bg-white/5"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                    I agree to the <a href="/terms" target="_blank" className="text-flc-orange hover:underline">Terms</a> & <a href="/privacy" target="_blank" className="text-flc-orange hover:underline">Privacy Policy</a>
                                </span>
                            </label>
                            <button
                                onClick={async () => {
                                    if (onAgree) {
                                        setIsAgreeing(true);
                                        await onAgree();
                                        setIsAgreeing(false);
                                    }
                                }}
                                disabled={!localAcceptedTerms || isAgreeing}
                                className="btn-primary flex items-center gap-3 !px-8 !py-4 !rounded-xl !text-xs !font-black !uppercase !tracking-widest"
                            >
                                {isAgreeing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Agree & Enable Sending
                            </button>
                        </div>
                    ) : !readOnly ? (
                        <div className="flex flex-wrap items-center gap-3">
                            {dispatchState === "IDLE" && (
                                <button
                                    onClick={onConfirm}
                                    disabled={isSending || data.length === 0}
                                    className="btn-primary group relative !px-12 !py-5 !rounded-2xl !text-sm !font-black !uppercase !tracking-[0.2em] shadow-2xl shadow-flc-orange/20 overflow-hidden active:scale-95"
                                >
                                    <div className="flex items-center gap-3">
                                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        <span>Send to {data.length} Recipients</span>
                                    </div>
                                </button>
                            )}
                            {/* Global Controls */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* PAUSE: visible while actively sending */}
                                {isCurrentlySending && (
                                    <button onClick={onPauseDispatch}
                                        className="bg-flc-orange/10 text-flc-orange border border-flc-orange/20 px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-flc-orange hover:text-white transition-all flex items-center gap-3">
                                        <span className="w-2 h-2 bg-flc-orange rounded-full animate-pulse" />
                                        Pause Dispatch
                                    </button>
                                )}
                                {/* RESUME PENDING: visible when any row is pending AND not currently sending */}
                                {!isCurrentlySending && Object.values(rowStatuses).some(s => s === "PENDING") && (
                                    <button onClick={onConfirm}
                                        className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                        <Send size={16} />
                                        Resume Pending
                                    </button>
                                )}
                                {/* RESUME PAUSED: visible whenever any row is paused */}
                                {Object.values(rowStatuses).some(s => s === "PAUSED") && (
                                    <button onClick={onResumeDispatch}
                                        className="bg-flc-orange/10 text-flc-orange border border-flc-orange/20 px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-flc-orange hover:text-white transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                                        <Send size={16} />
                                        Resume Paused
                                    </button>
                                )}
                                {/* RETRY FAILED: visible when not sending AND any row failed */}
                                {!isCurrentlySending && Object.values(rowStatuses).some(s => s === "FAILED") && (
                                    <button onClick={onRetryFailed}
                                        className="bg-red-500/10 text-red-500 border border-red-500/20 px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                        <Sparkles size={16} />
                                        Retry Failed
                                    </button>
                                )}
                                {/* RETRY CANCELLED: visible when not sending AND any row cancelled */}
                                {!isCurrentlySending && Object.values(rowStatuses).some(s => s === "CANCELLED") && (
                                    <button onClick={onRetryCancelled}
                                        className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-zinc-500 hover:text-white transition-all flex items-center gap-3">
                                        <Sparkles size={16} />
                                        Retry Cancelled
                                    </button>
                                )}
                                {/* CANCEL ALL: only when there are still pending/sending rows */}
                                {(isCurrentlySending || dispatchState === "PAUSED" || dispatchState === "ERROR_PAUSED") && Object.values(rowStatuses).some(s => s === "PENDING" || s === "PAUSED" || s === "SENDING") && (
                                    <button onClick={onCancelDispatch}
                                        className="bg-red-500/10 text-red-500 border border-red-500/20 px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                        Cancel All
                                    </button>
                                )}
                                {/* NEW CAMPAIGN: visible when not idle and not actively sending */}
                                {!isCurrentlySending && dispatchState !== "IDLE" && (
                                    <button onClick={onResetAndNew}
                                        className="bg-white/5 text-zinc-400 border border-white/10 px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:text-white transition-all">
                                        New Campaign
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Global Progress Bar (only during dispatch) */}
            {dispatchState !== "IDLE" && (
                <div className="glass-card !rounded-[2rem] border-white/5 bg-black/40 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Overall Progress</p>
                                <p className="text-2xl font-black text-white">{dispatchProgress.current} <span className="text-zinc-600">/ {dispatchProgress.total}</span></p>
                            </div>
                            <div className="h-10 w-px bg-white/5" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Success</p>
                                <p className="text-2xl font-black text-green-500">{dispatchProgress.success}</p>
                            </div>
                            <div className="h-10 w-px bg-white/5" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Failed</p>
                                <p className="text-2xl font-black text-red-500">{dispatchProgress.failed}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                 dispatchState === "SENDING" ? "bg-flc-orange/10 text-flc-orange animate-pulse" : 
                                 dispatchState === "COMPLETED" ? "bg-green-500/10 text-green-500" :
                                 dispatchState === "CANCELLED" ? "bg-red-500/10 text-red-500" :
                                 "bg-zinc-500/10 text-zinc-400"
                             }`}>
                                 {dispatchState}
                             </div>
                        </div>
                    </div>
                    <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden relative">
                        <div 
                            className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                                dispatchState === "CANCELLED" || dispatchState === "ERROR_PAUSED" ? "bg-red-500" : "bg-flc-orange"
                            }`}
                            style={{ width: `${(dispatchProgress.current / dispatchProgress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col xl:flex-row xl:h-[750px] gap-6">
                {/* Left Pane: Recipients List */}
                <div className="w-full xl:w-1/4 flex flex-col glass-card !rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden min-h-[300px] xl:min-h-0">
                    <div className="p-6 border-b border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Recipient Directory</h4>
                            <span className="text-[10px] font-bold bg-flc-orange/10 text-flc-orange px-3 py-1 rounded-full">{data.length} Loaded</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                            <input
                                type="text"
                                placeholder="Search recipients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white outline-none focus:border-flc-orange/30 transition-all placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredData.map((row, idx) => {
                            const email = row.Email || row.email || Object.values(row)[0];
                            const name = row.Name || row.name || email;
                            const isSelected = currentRow === row;
                            const status = effectiveRowStatuses[idx] || "PENDING";

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedIndex(idx)}
                                    className={`p-4 border-b border-white/5 cursor-pointer transition-all relative group ${isSelected ? "bg-flc-orange/10" : "hover:bg-white/[0.02]"
                                        }`}
                                >
                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-flc-orange shadow-[0_0_10px_rgba(249,115,22,0.5)]" />}
                                    
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                                                status === "SUCCESS" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                                                status === "FAILED" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                                                status === "SENDING" ? "bg-flc-orange animate-pulse" :
                                                status === "PAUSED" ? "bg-zinc-500" :
                                                status === "CANCELLED" ? "bg-zinc-700" :
                                                "bg-zinc-800"
                                            }`} />
                                            <span className={`text-sm font-black truncate ${isSelected ? "text-flc-orange" : "text-white"}`}>
                                                {name}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-bold text-zinc-700">#{idx + 1}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold text-zinc-500 truncate">{email}</span>
                                            {status === "FAILED" && (
                                                <span className="text-[9px] font-black text-red-500 mt-1 uppercase tracking-tighter">
                                                    Error: {dispatchLogs.find(l => l.rowIndex === idx)?.error || "Delivery failed"}
                                                </span>
                                            )}
                                            {status === "PAUSED" && (
                                                <span className="text-[9px] font-black text-zinc-400 mt-1 uppercase tracking-tighter">
                                                    Email Paused
                                                </span>
                                            )}
                                            {status === "CANCELLED" && (
                                                <span className="text-[9px] font-black text-zinc-600 mt-1 uppercase tracking-tighter">
                                                    Email Cancelled
                                                </span>
                                            )}
                                            {status === "SENDING" && (
                                                <span className="text-[9px] font-black text-flc-orange mt-1 uppercase tracking-tighter animate-pulse">
                                                    Sending...
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Row Actions */}
                                        <div className={`flex items-center gap-2 transition-all duration-300 ${isSelected || status !== "PENDING" ? "opacity-100" : "opacity-100"}`}>
                                            {!readOnly && status === "PENDING" && isCurrentlySending && (
                                                <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onRowAction?.(idx, "PAUSE"); }}
                                                        className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all shadow-lg active:scale-90"
                                                        title="Pause this email"
                                                    >
                                                        <Pause size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onRowAction?.(idx, "CANCEL"); }}
                                                        className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90 border border-red-500/20"
                                                        title="Cancel this email"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {status === "PAUSED" && (
                                                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onRowAction?.(idx, "RESUME"); }}
                                                        className="p-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-lg active:scale-90 border border-green-500/20"
                                                        title="Resume this email"
                                                    >
                                                        <Send size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onRowAction?.(idx, "CANCEL"); }}
                                                        className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90 border border-red-500/20"
                                                        title="Cancel this email"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditIndex(idx); setEditData(row); }}
                                                        className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all shadow-lg active:scale-90 border border-white/10"
                                                        title="Edit data"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {(status === "FAILED" || status === "CANCELLED") && (
                                                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onRowAction?.(idx, "RETRY"); }}
                                                        className="p-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-90 border border-blue-500/20"
                                                        title="Retry this email"
                                                    >
                                                        <Sparkles size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditIndex(idx); setEditData(row); }}
                                                        className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all shadow-lg active:scale-90 border border-white/10"
                                                        title="Edit data"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {status === "PENDING" && (
                                                <div className="p-2 rounded-full bg-zinc-500/10" title="In queue - Pending">
                                                    <Clock size={16} className="text-zinc-500 animate-pulse" />
                                                </div>
                                            )}
                                            {status === "PAUSED" && !isSending && (
                                                <div className="p-2 rounded-full bg-flc-orange/10" title="Paused">
                                                    <Pause size={16} className="text-flc-orange" />
                                                </div>
                                            )}
                                            {status === "SUCCESS" && (
                                                <div className="p-2 rounded-full bg-green-500/10">
                                                    <CheckCircle2 size={16} className="text-green-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline Edit UI */}
                                    {editIndex === idx && editData && (
                                        <div className="mt-4 p-4 rounded-xl bg-black/60 border border-white/10 space-y-4 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="grid grid-cols-1 gap-3">
                                                {Object.entries(editData).map(([key, value]) => (
                                                    <div key={key} className="space-y-1">
                                                        <label className="text-[9px] font-black uppercase text-zinc-600">{key}</label>
                                                        <input 
                                                            type="text"
                                                            value={String(value || "")}
                                                            onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-flc-orange/50 transition-all"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => {
                                                        onDataEdit?.(idx, editData);
                                                        setEditIndex(null);
                                                        setEditData(null);
                                                    }}
                                                    className="flex-1 bg-flc-orange text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Save Changes
                                                </button>
                                                <button 
                                                    onClick={() => { setEditIndex(null); setEditData(null); }}
                                                    className="px-4 py-2 bg-white/5 text-zinc-400 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredData.length === 0 && (
                            <div className="p-12 text-center space-y-4 opacity-20">
                                <Search size={48} className="mx-auto" />
                                <p className="font-bold">No recipients found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Pane: Content Preview */}
                <div className="w-full xl:w-3/4 flex flex-col glass-card !rounded-[2.5rem] border-white/5 bg-black/20 overflow-hidden min-h-[500px] xl:min-h-0">
                    {!currentRow ? (
                        <div className="flex-1 flex items-center justify-center opacity-20">
                            <p className="text-xl font-bold">Select a recipient to preview</p>
                        </div>
                    ) : (
                        <>
                            {/* Preview Header */}
                            <div className="p-4 sm:p-8 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[1.5rem] bg-flc-orange/10 flex shrink-0 items-center justify-center text-flc-orange shadow-inner">
                                        <User className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </div>
                                    <div className="space-y-1 overflow-hidden">
                                        <h4 className="text-xl sm:text-2xl font-black text-white lilita-font tracking-tight truncate">{currentRow.Name || currentRow.name || "Recipient"}</h4>
                                        <p className="text-xs sm:text-sm font-bold text-zinc-500 truncate">{currentRow.Email || currentRow.email || "No email"}</p>
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col items-end gap-2 text-right">
                                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Subject</p>
                                    <p className="text-lg font-black text-flc-orange truncate max-w-[300px]">{interpolatedSubject}</p>
                                </div>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                                {/* Email Body */}
                                <div className="flex-[2] p-4 sm:p-10 overflow-y-auto border-b md:border-b-0 md:border-r border-white/5 bg-white selection:bg-flc-orange/20 min-h-[400px]">
                                    <div
                                        className="prose prose-sm sm:prose-lg max-w-none text-zinc-800"
                                        dangerouslySetInnerHTML={{ __html: interpolatedBody }}
                                    />
                                </div>

                                {/* Attachments Column */}
                                <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-black/40 custom-scrollbar space-y-4 sm:space-y-6 max-h-[300px] md:max-h-none">
                                    <div className="flex items-center justify-between mb-4">
                                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Attachments</h5>
                                        <span className="text-[10px] font-bold text-flc-orange">{template.images.length} Files</span>
                                    </div>

                                    {template.images.map((img, idx) => (
                                        <div key={img.id} className="glass-card !rounded-2xl border-white/5 overflow-hidden bg-black/40 group">
                                            <div className="relative aspect-video bg-zinc-900 flex items-center justify-center">
                                                <Image src={img.url} alt="Attachment" fill className="object-contain opacity-50 transition-opacity group-hover:opacity-70" />

                                                {img.texts.map((text) => (
                                                    <div
                                                        key={text.id}
                                                        className="absolute flex items-center"
                                                        style={{
                                                            left: `${text.x}%`,
                                                            top: `${text.y}%`,
                                                            transform: text.textAlign === "center" ? "translate(-50%, -50%)" : text.textAlign === "right" ? "translate(-100%, -50%)" : "translate(0, -50%)",
                                                            color: text.color,
                                                            fontSize: `calc((${text.fontSize} / 1000) * 100%)`,
                                                            fontFamily: text.fontFamily,
                                                            fontWeight: text.fontWeight || "normal",
                                                            textAlign: text.textAlign as any || "center",
                                                            width: text.maxWidth ? `${text.maxWidth}%` : "auto",
                                                            wordBreak: "break-word",
                                                            lineHeight: 1.2
                                                        }}
                                                    >
                                                        <span className="block w-full">{interpolate(text.text, currentRow)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-4 bg-white/5 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileImage size={14} className="text-zinc-500 shrink-0" />
                                                    <span className="text-[9px] font-black font-mono text-zinc-400 truncate">
                                                        {img.attachmentName ? interpolate(img.attachmentName, currentRow) + ".png" : `attachment_${idx + 1}.png`}
                                                    </span>
                                                </div>
                                                <Sparkles size={12} className="text-flc-orange/40 shrink-0" />
                                            </div>
                                        </div>
                                    ))}

                                    {template.images.length === 0 && (
                                        <div className="p-12 text-center opacity-10 border-2 border-dashed border-white/10 rounded-2xl">
                                            <ImageIcon size={32} className="mx-auto mb-2" />
                                            <p className="text-[10px] font-black uppercase">No Certificates</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
}
