"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { 
  Plus, Trash2, Type, Settings2, Bold, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Move, Maximize2, ChevronDown, Image as ImageIcon
} from "lucide-react";
import type { ImageConfig, TextConfig } from "@/app/bulk-sender/types";
import { toast } from "sonner";
import Image from "next/image";
import { env } from "@/env";

const FONTS = [
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { name: "Courier New", value: "'Courier New', Courier, monospace" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Lilita One", value: "'Lilita One', sans-serif" },
  { name: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
];

interface ImageConfiguratorProps {
  configs: ImageConfig[];
  onChange: (configs: ImageConfig[]) => void;
  availableImages: { url: string; publicId: string; name: string }[];
  excelHeaders?: string[];
}

export default function ImageConfigurator({ configs, onChange, availableImages, excelHeaders = [] }: ImageConfiguratorProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(configs[0]?.id || null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeSnaps, setActiveSnaps] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [cursor, setCursor] = useState("default");

  const currentConfig = configs.find((c) => c.id === selectedImageId);

  const addImageConfig = (img: { url: string; publicId: string; name: string }) => {
    if (configs.length >= 3) {
      toast.error("Maximum 3 images per email");
      return;
    }

    // Inherit texts from existing config if available
    const existingTexts = configs.length > 0 ? configs[configs.length - 1]!.texts : [];

    const newConfig: ImageConfig = {
      id: Math.random().toString(36).substr(2, 9),
      url: img.url,
      publicId: img.publicId,
      name: img.name,
      texts: existingTexts.map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9) })), // Clone with new IDs
    };
    onChange([...configs, newConfig]);
    setSelectedImageId(newConfig.id);
  };

  const removeImage = (id: string) => {
    const updated = configs.filter((c) => c.id !== id);
    onChange(updated);
    if (selectedImageId === id) {
        setSelectedImageId(updated[0]?.id || null);
        setSelectedTextId(null);
    }
  };

  const addText = (configId: string) => {
    const config = configs.find((c) => c.id === configId);
    if (!config) return;

    const newText: TextConfig = {
      id: Math.random().toString(36).substr(2, 9),
      text: "Enter text or {Variable}",
      x: 50,
      y: 50,
      fontSize: 70,
      color: "#000000",
      fontFamily: "Arial, sans-serif",
      fontWeight: "normal",
      textAlign: "center",
      verticalAlign: "middle",
      maxWidth: 50 // 50% of image width by default
    };

    const updated = configs.map((c) =>
      c.id === configId ? { ...c, texts: [...c.texts, newText] } : c
    );
    onChange(updated);
    setSelectedTextId(newText.id);
  };

  const updateText = (configId: string, textId: string, updates: Partial<TextConfig>) => {
    const updated = configs.map((c) => {
      if (c.id === configId) {
        return {
          ...c,
          texts: c.texts.map((t) => (t.id === textId ? { ...t, ...updates } : t)),
        };
      }
      return c;
    });
    onChange(updated);
  };

  const removeText = (configId: string, textId: string) => {
    const updated = configs.map((c) => {
      if (c.id === configId) {
        return {
          ...c,
          texts: c.texts.filter((t) => t.id !== textId),
        };
      }
      return c;
    });
    onChange(updated);
    if (selectedTextId === textId) setSelectedTextId(null);
  };

  const getBoundingBox = useCallback((ctx: CanvasRenderingContext2D, text: TextConfig, canvasWidth: number, canvasHeight: number) => {
    ctx.font = `${text.fontWeight || 'normal'} ${text.fontSize}px ${text.fontFamily}`;
    const absX = (text.x / 100) * canvasWidth;
    const absY = (text.y / 100) * canvasHeight;
    const lineHeight = text.fontSize * 1.2;
    const maxWidthPx = ((text.maxWidth || 0) / 100) * canvasWidth;

    const lines: string[] = [];
    if (maxWidthPx > 0) {
      const words = text.text.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidthPx && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    } else {
      lines.push(text.text);
    }

    const totalHeight = lines.length * lineHeight;
    let startY = absY;
    if (text.verticalAlign === "middle" || !text.verticalAlign) startY = absY - (totalHeight - lineHeight) / 2;
    if (text.verticalAlign === "bottom") startY = absY - (totalHeight - lineHeight);

    const actualMaxWidth = maxWidthPx || Math.max(...lines.map(l => ctx.measureText(l).width));
    let boxX = absX;
    if (text.textAlign === "center") boxX -= actualMaxWidth / 2;
    if (text.textAlign === "right") boxX -= actualMaxWidth;

    return {
        x: boxX,
        y: startY - (lineHeight / 2),
        width: actualMaxWidth,
        height: totalHeight,
        absX,
        absY,
        lineHeight,
        startY
    };
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentConfig) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = currentConfig.url;

    img.onload = () => {
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      currentConfig.texts.forEach(text => {
        const isSelected = text.id === selectedTextId;
        const box = getBoundingBox(ctx, text, canvas.width, canvas.height);

        ctx.font = `${text.fontWeight || 'normal'} ${text.fontSize}px ${text.fontFamily}`;
        ctx.fillStyle = text.color;
        ctx.textBaseline = "middle";

        const lines: string[] = [];
        const maxWidthPx = ((text.maxWidth || 0) / 100) * canvas.width;
        if (maxWidthPx > 0) {
            const words = text.text.split(' ');
            let currentLine = '';
            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (ctx.measureText(testLine).width > maxWidthPx && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);
        } else {
            lines.push(text.text);
        }

        lines.forEach((line, index) => {
            const y = box.startY + index * box.lineHeight;
            let x = box.absX;
            if (text.textAlign === "center") x -= ctx.measureText(line).width / 2;
            if (text.textAlign === "right") x -= ctx.measureText(line).width;
            ctx.fillText(line, x, y);
        });

        if (isSelected) {
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 4;
          const padding = 15;
          ctx.setLineDash([10, 10]);
          ctx.strokeRect(box.x - padding, box.y - padding, box.width + padding * 2, box.height + padding * 2);
          ctx.setLineDash([]);

          // Move Handle
          ctx.fillStyle = "#f97316";
          ctx.beginPath(); ctx.arc(box.absX, box.absY, 12, 0, 2 * Math.PI); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(box.absX, box.absY, 6, 0, 2 * Math.PI); ctx.fill();

          // Resize Handle (Right Side)
          const rhX = box.x + box.width + padding;
          const rhY = box.y + (box.height / 2);
          ctx.fillStyle = "#f97316";
          ctx.fillRect(rhX - 6, rhY - 20, 12, 40);
          ctx.fillStyle = "#fff";
          ctx.fillRect(rhX - 2, rhY - 12, 4, 24);

          if (activeSnaps.x || activeSnaps.y) {
              ctx.strokeStyle = "#ef4444";
              ctx.lineWidth = 2;
              if (activeSnaps.x) { ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke(); }
              if (activeSnaps.y) { ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke(); }
          }
        }
      });
    };
  }, [currentConfig, selectedTextId, activeSnaps, getBoundingBox]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasMousePos(e);
    const canvas = canvasRef.current;
    if (!canvas || !currentConfig) return;
    const ctx = canvas.getContext("2d")!;

    // Check resize handles first
    if (selectedTextId) {
        const text = currentConfig.texts.find(t => t.id === selectedTextId);
        if (text) {
            const box = getBoundingBox(ctx, text, canvas.width, canvas.height);
            const padding = 15;
            const rhX = box.x + box.width + padding;
            const rhY = box.y + (box.height / 2);
            
            if (Math.abs(pos.x - rhX) < 20 && Math.abs(pos.y - rhY) < 30) {
                setIsResizing(true);
                setDragStart(pos);
                return;
            }
        }
    }

    // Check move handles
    for (let i = currentConfig.texts.length - 1; i >= 0; i--) {
        const text = currentConfig.texts[i];
        if (!text) continue;
        const absX = (text.x / 100) * canvas.width;
        const absY = (text.y / 100) * canvas.height;
        if (Math.sqrt((pos.x - absX) ** 2 + (pos.y - absY) ** 2) < 30) {
            setSelectedTextId(text.id);
            setIsDragging(true);
            setDragStart(pos);
            return;
        }
    }
    setSelectedTextId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasMousePos(e);
    const canvas = canvasRef.current;
    if (!canvas || !currentConfig) return;
    const ctx = canvas.getContext("2d")!;

    // Cursor handling
    if (selectedTextId) {
        const text = currentConfig.texts.find(t => t.id === selectedTextId);
        if (text) {
            const box = getBoundingBox(ctx, text, canvas.width, canvas.height);
            const padding = 15;
            const rhX = box.x + box.width + padding;
            const rhY = box.y + (box.height / 2);
            if (Math.abs(pos.x - rhX) < 20 && Math.abs(pos.y - rhY) < 30) setCursor("ew-resize");
            else if (Math.sqrt((pos.x - box.absX) ** 2 + (pos.y - box.absY) ** 2) < 30) setCursor("move");
            else setCursor("default");
        }
    }

    if (isDragging && selectedTextId) {
        const text = currentConfig.texts.find(t => t.id === selectedTextId);
        if (!text) return;
        
        let newAbsX = (text.x / 100) * canvasSize.width + (pos.x - dragStart.x);
        let newAbsY = (text.y / 100) * canvasSize.height + (pos.y - dragStart.y);

        const snapThreshold = 20;
        const snaps = { x: false, y: false };
        if (Math.abs(newAbsX - canvasSize.width/2) < snapThreshold) { newAbsX = canvasSize.width/2; snaps.x = true; }
        if (Math.abs(newAbsY - canvasSize.height/2) < snapThreshold) { newAbsY = canvasSize.height/2; snaps.y = true; }
        setActiveSnaps(snaps);

        updateText(currentConfig.id, selectedTextId, {
          x: (newAbsX / canvasSize.width) * 100,
          y: (newAbsY / canvasSize.height) * 100
        });
        setDragStart(pos);
    } else if (isResizing && selectedTextId) {
        const text = currentConfig.texts.find(t => t.id === selectedTextId);
        if (!text) return;
        
        const deltaX = pos.x - dragStart.x;
        
        let newWidthPx = ((text.maxWidth || 50) / 100) * canvasSize.width + deltaX;
        if (text.textAlign === "center") newWidthPx = ((text.maxWidth || 50) / 100) * canvasSize.width + (deltaX * 2);
        
        updateText(currentConfig.id, selectedTextId, {
            maxWidth: Math.max(10, (newWidthPx / canvasSize.width) * 100)
        });
        setDragStart(pos);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveSnaps({ x: false, y: false });
  };

  return (
    <div className="space-y-10">
      {/* Upload/Gallery Area */}
      {configs.length < 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upload New */}
            <CldUploadWidget
              signatureEndpoint="/api/cloudinary/sign"
              uploadPreset={env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
              options={{
                cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                apiKey: env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
                folder: "FLC_Emailer/Templates",
                tags: ["flc", "email-template"],
              }}
              onSuccess={(result: any) => {
                if (result.info) {
                  addImageConfig({
                    url: result.info.secure_url,
                    publicId: result.info.public_id,
                    name: result.info.original_filename || "uploaded-image",
                  });
                }
              }}
            >
              {({ open }) => (
                <div
                  onClick={() => open()}
                  className="w-full border-2 border-dashed border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center gap-4 bg-white/[0.02] hover:bg-flc-orange/[0.04] hover:border-flc-orange/30 transition-all cursor-pointer group shadow-2xl"
                >
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-zinc-600 group-hover:bg-flc-orange/10 group-hover:text-flc-orange transition-all duration-700 shadow-inner">
                    <Plus size={32} />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-black text-white lilita-font tracking-wider">Upload New Template</h3>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Click to upload from your PC</p>
                  </div>
                </div>
              )}
            </CldUploadWidget>

            {/* Choose from Gallery */}
            <div className="w-full glass-card !rounded-[3rem] p-10 border-white/5 bg-black/40 overflow-hidden flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white lilita-font tracking-wider">Recent Gallery</h3>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{availableImages.length} Images</span>
                </div>
                <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[140px] pr-2 custom-scrollbar">
                    {availableImages.map((img) => (
                        <div 
                            key={img.publicId}
                            onClick={() => addImageConfig(img)}
                            className="relative aspect-video rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-flc-orange/50 hover:scale-105 transition-all group"
                        >
                            <Image src={img.url} alt={img.name} fill className="object-cover" />
                            <div className="absolute inset-0 bg-flc-orange/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Plus size={16} className="text-white" />
                            </div>
                        </div>
                    ))}
                    {availableImages.length === 0 && (
                        <div className="col-span-4 py-8 text-center opacity-20">
                            <ImageIcon size={24} className="mx-auto mb-2" />
                            <p className="text-[9px] font-black uppercase">No gallery images</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Templates Sidebar */}
        <div className="xl:col-span-3 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-4">Templates</h4>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
                {configs.map((config) => (
                <div
                    key={config.id}
                    onClick={() => setSelectedImageId(config.id)}
                    className={`relative group cursor-pointer rounded-[2rem] overflow-hidden border-2 transition-all duration-500 aspect-video ${
                    selectedImageId === config.id ? "border-flc-orange ring-8 ring-flc-orange/10 scale-[1.02]" : "border-white/5 hover:border-white/20"
                    }`}
                >
                    <Image src={config.url} alt={config.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); removeImage(config.id); }}
                            className="p-4 bg-red-500 text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all"
                        >
                            <Trash2 size={24} />
                        </button>
                    </div>
                    {selectedImageId === config.id && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 border-t border-white/10 backdrop-blur-md">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Attachment Name</label>
                            <input 
                                type="text"
                                value={config.attachmentName || ""}
                                onChange={(e) => {
                                    const updated = configs.map(c => c.id === config.id ? { ...c, attachmentName: e.target.value } : c);
                                    onChange(updated);
                                }}
                                placeholder="e.g. Cert_{Name}"
                                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-flc-orange/30"
                            />
                        </div>
                    )}
                </div>
                ))}
            </div>
        </div>

        {/* Designer Canvas */}
        <div className="xl:col-span-6 space-y-6">
             <div className="flex items-center justify-between px-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Live Designer</h4>
                <button 
                    onClick={() => currentConfig && addText(currentConfig.id)}
                    disabled={!currentConfig}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-flc-orange text-white px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all disabled:opacity-20"
                >
                    <Plus size={16} /> Add Layer
                </button>
             </div>
             
             <div className="relative glass-card !rounded-[3rem] p-6 bg-black/40 border border-white/5 shadow-2xl min-h-[500px] flex items-center justify-center overflow-hidden">
                {!currentConfig ? (
                    <div className="text-center space-y-4 opacity-20">
                        <Maximize2 size={64} className="mx-auto" />
                        <p className="font-bold">Select a template</p>
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="max-w-full h-auto shadow-2xl rounded-xl bg-zinc-900"
                        style={{ cursor }}
                    />
                )}
             </div>
        </div>

        {/* Settings Sidebar */}
        <div className="xl:col-span-3 space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-4">Properties</h4>
             <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {currentConfig?.texts.map((text) => (
                    <div 
                        key={text.id} 
                        className={`glass-card p-6 space-y-6 transition-all duration-300 border ${
                            selectedTextId === text.id ? "border-flc-orange/50 ring-4 ring-flc-orange/5" : "border-white/5"
                        }`}
                        onClick={() => setSelectedTextId(text.id)}
                    >
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${selectedTextId === text.id ? "bg-flc-orange" : "bg-white/20"}`} />
                                <span className="text-xs font-black uppercase tracking-widest text-white/40">Text Layer</span>
                             </div>
                             <button onClick={() => removeText(currentConfig.id, text.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                             </button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Content</label>
                                <input
                                    type="text"
                                    value={text.text}
                                    onChange={(e) => updateText(currentConfig.id, text.id, { text: e.target.value })}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-flc-orange/30 transition-all"
                                    placeholder="Text or {Variable}"
                                />
                                {excelHeaders.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {excelHeaders.map(header => (
                                            <button
                                                key={header}
                                                onClick={() => {
                                                    const newText = text.text + ` {${header}}`;
                                                    updateText(currentConfig.id, text.id, { text: newText });
                                                }}
                                                className="text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-flc-orange/20 hover:text-flc-orange text-zinc-500 px-3 py-1.5 rounded-lg border border-white/5 transition-all"
                                            >
                                                +{header}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Font Family</label>
                                <div className="relative">
                                    <select
                                        value={text.fontFamily}
                                        onChange={(e) => updateText(currentConfig.id, text.id, { fontFamily: e.target.value })}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-flc-orange/30 appearance-none transition-all"
                                        style={{ fontFamily: text.fontFamily }}
                                    >
                                        {FONTS.map(f => (
                                            <option key={f.value} value={f.value} style={{ fontFamily: f.value, backgroundColor: '#18181b' }}>
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Formatting</label>
                                    <div className="flex flex-wrap gap-1 bg-black/20 p-1 rounded-xl">
                                        <button
                                            onClick={() => updateText(currentConfig.id, text.id, { fontWeight: text.fontWeight === "bold" ? "normal" : "bold" })}
                                            className={`p-2.5 rounded-lg transition-all ${text.fontWeight === "bold" ? "bg-flc-orange text-white" : "text-zinc-500 hover:text-white"}`}
                                        >
                                            <Bold size={18} />
                                        </button>
                                        <div className="w-px h-6 bg-white/10 mx-1 my-auto" />
                                        <button
                                            onClick={() => updateText(currentConfig.id, text.id, { textAlign: "left" })}
                                            className={`p-2.5 rounded-lg transition-all ${text.textAlign === "left" ? "bg-flc-orange text-white" : "text-zinc-500 hover:text-white"}`}
                                        >
                                            <AlignLeft size={18} />
                                        </button>
                                        <button
                                            onClick={() => updateText(currentConfig.id, text.id, { textAlign: "center" })}
                                            className={`p-2.5 rounded-lg transition-all ${text.textAlign === "center" ? "bg-flc-orange text-white" : "text-zinc-500 hover:text-white"}`}
                                        >
                                            <AlignCenter size={18} />
                                        </button>
                                        <button
                                            onClick={() => updateText(currentConfig.id, text.id, { textAlign: "right" })}
                                            className={`p-2.5 rounded-lg transition-all ${text.textAlign === "right" ? "bg-flc-orange text-white" : "text-zinc-500 hover:text-white"}`}
                                        >
                                            <AlignRight size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Size ({text.fontSize}px)</label>
                                        <input
                                            type="range" min="70" max="300"
                                            value={text.fontSize}
                                            onChange={(e) => updateText(currentConfig.id, text.id, { fontSize: parseInt(e.target.value) })}
                                            className="w-full accent-flc-orange"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Color</label>
                                        <input
                                            type="color"
                                            value={text.color}
                                            onChange={(e) => updateText(currentConfig.id, text.id, { color: e.target.value })}
                                            className="w-full h-10 bg-transparent border-none p-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
}
