"use client";

import { X } from "lucide-react";
import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      
      <div className={`relative w-full ${maxWidth} bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden transform animate-in zoom-in-95 duration-300`}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={24} className="text-zinc-500" />
          </button>
        </div>
        
        <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
        
        <div className="px-8 py-4 border-t border-zinc-200/50 dark:border-zinc-800/50 flex justify-end">
            <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}
