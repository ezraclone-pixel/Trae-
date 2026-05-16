"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type MeResponse = {
  user: {
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    photoUrl?: string | null;
    points: number;
    reservedPoints: number;
    availablePoints: number;
    referrerId?: string | null;
    referralCount: number;
  };
  tasks: {
    periodKey: string;
    daily_login: boolean;
    phrase: boolean;
    follow_channel: boolean;
    join_group: boolean;
  };
  config: {
    rate: { ptsPerMMK: number };
    minWithdrawalPts: number;
    mainChannel: string;
    communityGroup: string;
  };
};

type Ctx = {
  me: MeResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  completeTask: (taskKey: "daily_login" | "follow_channel" | "join_group") => Promise<void>;
  createOrder: (productKey: string) => Promise<void>;
  createWithdrawal: (points: number) => Promise<void>;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/me", { cache: "no-store" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMe(null);
      setError(j?.error || "Cannot load profile");
      return;
    }
    const data = await res.json();
    setMe(data);
  }, []);

  const loginIfNeeded = useCallback(async () => {
    // 1. အရင်ဆုံး profile ရှိလား စစ်မယ်
    const res = await fetch("/api/me", { cache: "no-store" });
    if (res.ok) return true; // Profile ရှိရင် ဘာမှလုပ်စရာမလို၊ ဆက်သွားမယ်
    if (res.status !== 401) return false;

    // 2. 401 ပြရင် Telegram Web App ဟုတ်မဟုတ် စစ်ပြီး Auth လုပ်မယ်
    const initData = (window as any)?.Telegram?.WebApp?.initData as string | undefined;
    if (!initData) {
      setError("Please open this app inside Telegram");
      return false;
    }

    // 3. Auth API ဆီ ပို့မယ်
    const authRes = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });

    if (!authRes.ok) {
      const j = await authRes.json().catch(() => ({}));
      setError(j?.error || "Authentication failed");
      return false;
    }

    return true; // Login အောင်မြင်သွားပြီ
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const tg = (window as any)?.Telegram?.WebApp;
        if (tg?.ready) tg.ready();
        if (tg?.expand) tg.expand();
        
        // Login အရင်လုပ်မယ်၊ အောင်မြင်မှ Profile ကို Refresh လုပ်မယ်
        const loginSuccess = await loginIfNeeded();
        if (loginSuccess && isMounted) {
          await refresh();
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Startup error");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [loginIfNeeded, refresh]);

  const completeTask: Ctx["completeTask"] = useCallback(
    async (taskKey) => {
      setError(null);
      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskKey }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Task failed");
      }
      await refresh();
    },
    [refresh],
  );

  const createOrder: Ctx["createOrder"] = useCallback(
    async (productKey) => {
      setError(null);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category: "WEBSITE", productKey }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Order failed");
      }
      await refresh();
    },
    [refresh],
  );

  const createWithdrawal: Ctx["createWithdrawal"] = useCallback(
    async (points) => {
      setError(null);
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ points }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Withdrawal failed");
      }
      await refresh();
    },
    [refresh],
  );

  return (
    <AppContext.Provider value={{ me, loading, error, refresh, completeTask, createOrder, createWithdrawal }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
          }
  
