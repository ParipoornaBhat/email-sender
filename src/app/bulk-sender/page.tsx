"use client";

import React, { useState, useEffect } from "react";
import { Mail, FileSpreadsheet, Image as ImageIcon, Eye, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import ExcelDropzone from "@/components/email/ExcelDropzone";
import ImageConfigurator from "@/components/email/ImageConfigurator";
import CampaignDispatcher from "@/components/email/CampaignDispatcher";
import type { ExcelRow, EmailTemplate, EmailAccount } from "./types";
import { getEmailAccounts } from "./actions/accounts";
import { getGalleryImages } from "./actions/gallery";
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
  // ── Wizard State ───────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<ExcelRow[]>([]);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");

  const [template, setTemplate] = useState<EmailTemplate>({
    subject: "Hello {Name}!",
    bodyHtml: "<h1>Welcome!</h1><p>This is a custom email for {Name}.</p>",
    images: [],
  });

  // ── Fetch accounts & gallery on mount ──────────────
  useEffect(() => {
    const fetchData = async () => {
      const [accRes, imgRes] = await Promise.all([
        getEmailAccounts(),
        getGalleryImages(),
      ]);
      if (accRes.success && accRes.data) {
        setAccounts(accRes.data as EmailAccount[]);
        if (accRes.data.length > 0) setSelectedAccountId(accRes.data[0]!.id);
      }
      if (imgRes.success && imgRes.data) setGalleryImages(imgRes.data);
    };
    fetchData();
  }, []);

  // ── Navigation ─────────────────────────────────────
  const nextStep = () => {
    if (currentStep === 0 && data.length === 0) {
      toast.error("Please upload recipient data first");
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleNewData = (excelData: ExcelRow[]) => {
    setData(excelData);
    setCurrentStep(1);
  };

  const handleResetFromDispatcher = () => {
    setData([]);
    setCurrentStep(0);
  };

  // ── Render ─────────────────────────────────────────
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
              onClick={() => setCurrentStep(idx)}
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

          {/* ── Step 0: Recipients ── */}
          {currentStep === 0 && (
            <div className="max-w-[1400px] mx-auto space-y-6">
              <div className="text-center space-y-2">
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
                  {data.length > 0 ? (
                    <div className="glass-card p-8 !rounded-[2rem] border-emerald-500/10 h-full flex flex-col justify-center">
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
                  ) : (
                    <div className="glass-card !rounded-[3rem] p-10 bg-white/5 border-white/10 h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                      <FileSpreadsheet size={48} className="text-zinc-700" />
                      <div className="space-y-1">
                        <p className="font-black text-white uppercase tracking-widest text-xs">Upload Excel / CSV</p>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Your recipient list goes here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Content ── */}
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
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-flc-orange/30 outline-none text-white font-bold text-lg transition-all"
                        placeholder="e.g. Hello {Name}!"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-2">Email Body</label>
                      {editorMode === "visual" ? (
                        <RichTextEditor
                          value={template.bodyHtml}
                          onChange={(html) => setTemplate({ ...template, bodyHtml: html })}
                        />
                      ) : (
                        <div className="rounded-2xl overflow-hidden border border-white/10">
                          <Editor
                            height="400px"
                            defaultLanguage="html"
                            value={template.bodyHtml}
                            onChange={(value) => setTemplate({ ...template, bodyHtml: value || "" })}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              wordWrap: "on",
                              padding: { top: 16 },
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-2">
                  <div className="glass-card !rounded-[2.5rem] p-6 sticky top-24">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 ml-2">Live Preview</h4>
                    <div className="bg-white/5 rounded-2xl p-6 min-h-[300px] space-y-4">
                      <div className="border-b border-white/10 pb-4 space-y-2">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subject</p>
                        <p className="text-white font-bold text-lg">
                          {data[0]
                            ? template.subject.replace(/{([^}]+)}/g, (_, key) => String(data[0]![key] || `{${key}}`))
                            : template.subject}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Body</p>
                        <div
                          className="prose prose-invert prose-sm max-w-none text-zinc-300 email-preview-content"
                          dangerouslySetInnerHTML={{
                            __html: data[0]
                              ? template.bodyHtml.replace(/{([^}]+)}/g, (_, key) => String(data[0]![key] || `{${key}}`))
                              : template.bodyHtml
                          }}
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

          {/* ── Step 2: Certificates ── */}
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

          {/* ── Step 3: Preview & Dispatch ── */}
          {currentStep === 3 && (
            <CampaignDispatcher
              mode="new"
              initialData={data}
              template={template}
              accountId={selectedAccountId}
              onReset={handleResetFromDispatcher}
            />
          )}
        </div>
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
  );
}
