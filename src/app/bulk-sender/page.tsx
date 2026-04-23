"use client";

import React, { useState, useEffect } from "react";
import { Mail, FileSpreadsheet, Image as ImageIcon, Eye, ArrowRight, ArrowLeft, Sparkles, Trash2 } from "lucide-react";
import ExcelDropzone from "@/components/email/ExcelDropzone";
import ImageConfigurator from "@/components/email/ImageConfigurator";
import BulkEmailPreview from "@/components/email/BulkEmailPreview";
import type { ExcelRow, EmailTemplate, EmailAccount } from "./types";
import { getEmailAccounts } from "./actions/accounts";
import { getGalleryImages } from "./actions/gallery";
import { dispatchBulkEmails } from "./actions/dispatch";
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

  useEffect(() => {
    // Load from localStorage on mount
    const savedData = localStorage.getItem("bulk-sender-data");
    const savedTemplate = localStorage.getItem("bulk-sender-template");
    const savedStep = localStorage.getItem("bulk-sender-step");

    if (savedData) setData(JSON.parse(savedData));
    if (savedTemplate) setTemplate(JSON.parse(savedTemplate));
    if (savedStep) setCurrentStep(parseInt(savedStep));

    const fetchData = async () => {
      const [accRes, imgRes] = await Promise.all([
        getEmailAccounts(),
        getGalleryImages()
      ]);
      
      if (accRes.success && accRes.data) {
        setAccounts(accRes.data as EmailAccount[]);
        if (accRes.data.length > 0) setSelectedAccountId(accRes.data[0]!.id);
      }
      if (imgRes.success && imgRes.data) setGalleryImages(imgRes.data);
    };
    fetchData();

    const checkAgreement = async () => {
        const res = await getAgreementStatus();
        if (res.success) setHasAgreedTerms(res.agreed ?? false);
    };
    checkAgreement();
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("bulk-sender-data", JSON.stringify(data));
    localStorage.setItem("bulk-sender-template", JSON.stringify(template));
    localStorage.setItem("bulk-sender-step", currentStep.toString());
  }, [data, template, currentStep]);

  const handleSend = async () => {
    if (!selectedAccountId) {
        toast.error("Please select an email account");
        return;
    }
    setIsSending(true);
    const res = await dispatchBulkEmails({
        accountId: selectedAccountId,
        data,
        template,
    });
    
    if (res.success) {
        toast.success(res.message || "Bulk send completed!");
        localStorage.removeItem("bulk-sender-data");
        localStorage.removeItem("bulk-sender-template");
        localStorage.removeItem("bulk-sender-step");
        setCurrentStep(0);
        setData([]);
    } else {
        toast.error(res.error || "Failed to send bulk emails");
    }
    setIsSending(false);
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
      localStorage.removeItem("bulk-sender-data");
      localStorage.removeItem("bulk-sender-template");
      localStorage.removeItem("bulk-sender-step");
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl pt-12 pb-32">
      {/* Progress Stepper */}
      <div className="flex justify-between items-center mb-20 max-w-4xl mx-auto px-8 relative">
        <div className="absolute top-7 left-0 w-full h-[2px] bg-white/5 -z-10" />
        <div 
          className="absolute top-7 left-0 h-[2px] bg-flc-orange -z-10 transition-all duration-700 ease-in-out" 
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />
        
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-4 relative px-4 group">
            <button 
              onClick={() => setCurrentStep(idx)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 cursor-pointer ${
                idx <= currentStep 
                  ? "bg-flc-orange text-white shadow-[0_0_30px_rgba(242,140,40,0.3)] scale-110" 
                  : "bg-flc-purple-dark text-zinc-600 border-2 border-white/5 hover:border-flc-orange/30"
              }`}
            >
              <step.icon size={28} />
            </button>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${idx <= currentStep ? "text-flc-orange" : "text-zinc-600"}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="min-h-[600px]">
          {currentStep === 0 && (
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4 relative">
                <button
                  onClick={resetProgress}
                  className="absolute right-0 top-0 text-[10px] font-black text-zinc-600 hover:text-red-500 uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Reset Draft
                </button>
                <h2 className="text-6xl font-black lilita-font text-white tracking-tight">Campaign Data</h2>
                <p className="text-zinc-500 text-xl font-medium">Select your sender and upload the recipient list.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-2">1. Select Sender Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full h-18 px-6 rounded-[1.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 focus:border-flc-orange/30 focus:ring-4 focus:ring-flc-orange/5 outline-none font-bold text-lg text-white appearance-none transition-all shadow-2xl"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-flc-purple-dark">{acc.emailAddress}</option>
                    ))}
                    {accounts.length === 0 && <option disabled>No accounts connected</option>}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-2">2. Upload Excel/CSV</label>
                  <ExcelDropzone onDataLoaded={setData} />
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
            <div className="space-y-10 max-w-7xl mx-auto">
               <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                  <div className="lg:col-span-3 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-flc-orange/10 flex items-center justify-center text-flc-orange shadow-inner">
                          <Mail size={24} />
                        </div>
                        <h3 className="text-4xl font-black lilita-font tracking-tight">Compose Email</h3>
                      </div>
                      
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => setEditorMode("visual")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            editorMode === "visual" ? "bg-flc-orange text-white" : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          <Type size={14} />
                          Visual
                        </button>
                        <button
                          onClick={() => setEditorMode("html")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            editorMode === "html" ? "bg-flc-orange text-white" : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          <Code2 size={14} />
                          HTML
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-8 glass-card p-10 !rounded-[3rem]">
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
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                        <Eye size={24} />
                      </div>
                      <h3 className="text-4xl font-black lilita-font tracking-tight">Live Preview</h3>
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
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-6xl font-black lilita-font tracking-tight">Certificate Designer</h2>
                <p className="text-zinc-500 text-xl font-medium">Map dynamic text to your certificate images.</p>
              </div>
              <div className="glass-card p-4 !rounded-[4rem]">
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
            <div className="max-w-6xl mx-auto">
              <BulkEmailPreview 
                data={data} 
                template={template} 
                onConfirm={handleSend} 
                isSending={isSending}
                hasAgreedTerms={hasAgreedTerms}
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
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-fit min-w-[400px] glass-card p-4 flex items-center justify-between !rounded-full border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] z-50">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-3 px-8 py-4 rounded-full text-zinc-400 font-black uppercase text-xs tracking-widest hover:text-white hover:bg-white/5 transition-all disabled:opacity-0"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={nextStep}
              className="btn-primary flex items-center gap-3 !px-10 !py-4 !rounded-full !text-xs !font-black !uppercase !tracking-widest"
            >
              Next Step
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
