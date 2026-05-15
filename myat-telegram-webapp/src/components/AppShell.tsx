"use client";

import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/components/AppProvider";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { loading, error } = useApp();
  return (
    <div className="min-h-screen bg-zinc-50 pb-16 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b bg-white/95 px-4 py-3 backdrop-blur dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {loading ? "Loading…" : ""}
          </div>
        </div>
        {error ? (
          <div className="mx-auto mt-2 max-w-md rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-md p-4">{children}</main>
      <BottomNav />
    </div>
  );
}

