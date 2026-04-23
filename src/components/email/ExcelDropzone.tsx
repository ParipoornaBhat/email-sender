"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileSpreadsheet, X, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import type { ExcelRow } from "@/app/bulk-sender/types";
import { toast } from "sonner";

interface ExcelDropzoneProps {
  onDataLoaded: (data: ExcelRow[]) => void;
}

export default function ExcelDropzone({ onDataLoaded }: ExcelDropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("No sheets found in file");
        
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet!) as ExcelRow[];
        
        if (json.length === 0) throw new Error("File is empty");
        
        setRowCount(json.length);
        onDataLoaded(json);
        toast.success(`Loaded ${json.length} rows from ${file.name}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse Excel file. Ensure it's a valid .xlsx or .csv");
        setFileName(null);
      }
    };

    reader.readAsArrayBuffer(file);
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    setRowCount(0);
    onDataLoaded([]);
  };

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-[2.5rem] p-10 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center text-center group ${
        isDragActive
          ? "border-flc-orange bg-flc-orange/10 scale-105"
          : fileName
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-white/5 bg-white/[0.02] hover:border-flc-orange/30 hover:bg-flc-orange/[0.04]"
      }`}
    >
      <input {...getInputProps()} />
      
      {fileName ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4 text-emerald-500">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 size={32} />
            </div>
            <span className="text-xl font-black truncate max-w-[250px] text-white">{fileName}</span>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-500 font-bold text-sm">
                {rowCount} recipients loaded
            </p>
            <button
                onClick={clearFile}
                className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto mt-4"
            >
                <X size={14} /> Clear Selection
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-zinc-600 mb-6 group-hover:text-flc-orange group-hover:bg-flc-orange/10 transition-all duration-500">
            <FileSpreadsheet size={40} />
          </div>
          <h3 className="text-2xl font-black text-white lilita-font tracking-wide">
            {isDragActive ? "Drop to Load" : "Upload Recipient Data"}
          </h3>
          <p className="text-sm text-zinc-500 font-medium mt-2 max-w-[200px]">
            Drag & drop your Excel or CSV file here, or click to select.
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const ws = XLSX.utils.json_to_sheet([
                { Name: "John Doe", Email: "john@example.com", Event: "Workshop" },
                { Name: "Jane Smith", Email: "jane@example.com", Event: "Hackathon" },
              ]);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Recipients");
              XLSX.writeFile(wb, "flc_email_template.xlsx");
            }}
            className="mt-6 text-[10px] font-black text-flc-orange uppercase tracking-widest hover:underline"
          >
            Download Sample Template
          </button>
        </>
      )}
    </div>
  );
}
