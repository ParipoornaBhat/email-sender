"use client";

import React from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-zinc-900/20 animate-pulse rounded-[2.5rem]" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
      [{ color: [] }, { background: [] }],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "link",
    "color",
    "background",
  ];

  return (
    <div className="quill-container">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="bg-white rounded-[2rem] overflow-hidden min-h-[400px]"
      />
      <style jsx global>{`
        .quill-container .ql-toolbar.ql-snow {
          border: none !important;
          background: #f8fafc !important;
          padding: 1rem 1.5rem !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .quill-container .ql-container.ql-snow {
          border: none !important;
          font-family: inherit !important;
          font-size: 1.125rem !important;
        }
        .quill-container .ql-editor {
          min-height: 350px !important;
          padding: 2rem !important;
          color: #1e293b !important;
        }
        .quill-container .ql-editor.ql-blank::before {
          color: #94a3b8 !important;
          font-style: normal !important;
        }
        .quill-container .ql-snow .ql-stroke {
          stroke: #475569 !important;
        }
        .quill-container .ql-snow .ql-fill {
          fill: #475569 !important;
        }
        .quill-container .ql-snow .ql-picker {
          color: #475569 !important;
        }
      `}</style>
    </div>
  );
}
