"use client";

import React, { useState, useMemo } from "react";
import {
    ChevronLeft, ChevronRight, Send, User, Mail,
    Image as ImageIcon, Sparkles, Loader2, Search,
    CheckCircle2, Paperclip, FileImage, ExternalLink
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
}

export default function BulkEmailPreview({
    data,
    template,
    onConfirm,
    isSending,
    readOnly = false,
    hasAgreedTerms = false,
    onAgree
}: BulkEmailPreviewProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [localAcceptedTerms, setLocalAcceptedTerms] = useState(false);
    const [isAgreeing, setIsAgreeing] = useState(false);

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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-2">
                    <h3 className="text-5xl font-black text-white lilita-font tracking-tight">Final Dispatch Check</h3>
                    <p className="text-zinc-500 font-medium text-lg">Review and verify individual recipient data before mass dispatch.</p>
                </div>

                {!readOnly && (
                    <div className="flex flex-col items-end gap-4">
                        {!hasAgreedTerms ? (
                            <div className="flex flex-col items-end gap-4 bg-flc-orange/5 p-6 rounded-[2rem] border border-flc-orange/20 animate-in fade-in zoom-in duration-500">
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
                        ) : (
                            <button
                                onClick={onConfirm}
                                disabled={isSending || data.length === 0}
                                className="btn-primary group relative !px-12 !py-5 !rounded-2xl !text-sm !font-black !uppercase !tracking-[0.2em] shadow-2xl shadow-flc-orange/20 overflow-hidden active:scale-95 disabled:opacity-50"
                            >
                                {isSending ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Dispatching...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        <span>Send to {data.length} Recipients</span>
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[750px]">
                {/* Left Pane: Recipients List */}
                <div className="xl:col-span-4 flex flex-col glass-card !rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden">
                    <div className="p-6 border-b border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Recipient Directory</h4>
                            <span className="text-[10px] font-bold bg-flc-orange/10 text-flc-orange px-3 py-1 rounded-full">{data.length} Loaded</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-white outline-none focus:border-flc-orange/30 transition-all placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredData.map((row, idx) => {
                            const email = row.Email || row.email || Object.values(row)[0];
                            const name = row.Name || row.name || email;
                            const isSelected = currentRow === row;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedIndex(idx)}
                                    className={`p-6 border-b border-white/5 cursor-pointer transition-all relative group ${isSelected ? "bg-flc-orange/10" : "hover:bg-white/[0.02]"
                                        }`}
                                >
                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-flc-orange shadow-[0_0_15px_rgba(249,115,22,0.5)]" />}
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-sm font-black truncate max-w-[180px] ${isSelected ? "text-flc-orange" : "text-white"}`}>
                                            {name}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-600">#{idx + 1}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-zinc-500 truncate max-w-[200px]">{email}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-black text-zinc-700 uppercase">{template.images.length} <Paperclip size={10} className="inline ml-1" /></span>
                                        </div>
                                    </div>
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
                <div className="xl:col-span-8 flex flex-col glass-card !rounded-[2.5rem] border-white/5 bg-black/20 overflow-hidden">
                    {!currentRow ? (
                        <div className="flex-1 flex items-center justify-center opacity-20">
                            <p className="text-xl font-bold">Select a recipient to preview</p>
                        </div>
                    ) : (
                        <>
                            {/* Preview Header */}
                            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-flc-orange/10 flex items-center justify-center text-flc-orange shadow-inner">
                                        <User size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-2xl font-black text-white lilita-font tracking-tight">{currentRow.Name || currentRow.name || "Recipient"}</h4>
                                        <p className="text-sm font-bold text-zinc-500">{currentRow.Email || currentRow.email || "No email"}</p>
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col items-end gap-2 text-right">
                                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Subject</p>
                                    <p className="text-lg font-black text-flc-orange truncate max-w-[300px]">{interpolatedSubject}</p>
                                </div>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-hidden flex">
                                {/* Email Body */}
                                <div className="flex-1 p-8 overflow-y-auto border-r border-white/5 bg-white selection:bg-flc-orange/20">
                                    <div
                                        className="prose prose-lg max-w-none text-zinc-800"
                                        dangerouslySetInnerHTML={{ __html: interpolatedBody }}
                                    />
                                </div>

                                {/* Attachments Column */}
                                <div className="w-1/3 p-6 overflow-y-auto bg-black/40 custom-scrollbar space-y-6">
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
