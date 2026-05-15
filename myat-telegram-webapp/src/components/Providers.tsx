"use client";

import { AppProvider } from "@/components/AppProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

