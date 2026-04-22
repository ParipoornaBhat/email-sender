"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

export default function Toaster() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/80 group-[.toaster]:dark:bg-zinc-950/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-zinc-950 group-[.toaster]:dark:text-zinc-50 group-[.toaster]:border-zinc-200 group-[.toaster]:dark:border-zinc-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-zinc-500 group-[.toast]:dark:text-zinc-400",
          actionButton:
            "group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-50 group-[.toast]:dark:bg-zinc-50 group-[.toast]:dark:text-zinc-900",
          cancelButton:
            "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500 group-[.toast]:dark:bg-zinc-800 group-[.toast]:dark:text-zinc-400",
        },
      }}
    />
  );
}
