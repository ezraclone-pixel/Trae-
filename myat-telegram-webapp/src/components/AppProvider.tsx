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

  // 🚀 Telegram window ထဲက raw initData ကို ဆွဲထုတ်မည့် Helper function
  const getAuthHeaders = useCallback(() => {
    const initData = typeof window !== "undefined" ? (window as any).Telegram?.WebApp?.initData || "" : "";
    return {
      "Authorization": `Bearer ${initData}`,
      "Content-Type": "application/json"
    };
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    // 🛠️ Header စနစ်ဖြင့် Profile ကို လှမ်းတောင်းခြင်း
    const res = await fetch("/api/me", { 
      cache: "no-store",
      headers: { "Authorization": getAuthHeaders().Authorization }
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMe(null);
      setError(j?.error || "Cannot load profile");
      return;
    }
    const data = await res.json();
    setMe(data);
  }, [getAuthHeaders]);

  const loginIfNeeded = useCallback(async () => {
    // 1. အရင်ဆုံး profile ရှိလား စစ်မယ် (Header ပါဝင်ပြီးသား)
    const res = await fetch("/api/me", { 
      cache: "no-store",
      headers: { "Authorization": getAuthHeaders().Authorization }
    });
    
    // ✅ အောင်မြင်ရင် Profile ရှိပြီးသားမို့လို့ true ပြန်ပြီး Dashboard ဆီ တန်းသွားမယ်
    if (res.ok) return true; 

    // 🚀 [ဇာတ်သိမ်းခန်း ပြင်ဆင်ချက်] if (res.status !== 401) စာကြောင်းကို ဖြုတ်လိုက်ပါပြီ။
    // အကြောင်းအမျိုးမျိုးကြောင့် ဒေတာမရတာနဲ့ အောက်က Telegram Auth စနစ်ဆီ အတင်းမောင်းနှင်ခိုင်းပါမယ်။
    console.log("Profile verification skipped or failed, upgrading to Telegram Authentication...");

    // 2. Telegram Web App ဟုတ်မဟုတ် စစ်ပြီး Auth လုပ်မယ်
    const initData = (window as any)?.Telegram?.WebApp?.initData as string | undefined;
    if (!initData) {
      setError("Please open this app inside Telegram");
      return false;
    }

    // 3. /api/auth/telegram ဆီကို initData ပို့ပြီး စစ်ဆေးမှု ခံယူမယ်
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
  }, [getAuthHeaders]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const tg = (window as any)?.Telegram?.WebApp;
        if (tg?.ready) tg.ready();
        if (tg?.expand) tg.expand();
        
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ taskKey }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Task failed");
      }
      await refresh();
    },
    [refresh, getAuthHeaders],
  );

  const createOrder: Ctx["createOrder"] = useCallback(
    async (productKey) => {
      setError(null);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ category: "WEBSITE", productKey }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Order failed");
      }
      await refresh();
    },
    [refresh, getAuthHeaders],
  );

  const createWithdrawal: Ctx["createWithdrawal"] = useCallback(
    async (points) => {
      setError(null);
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ points }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Withdrawal failed");
      }
      await refresh();
    },
    [refresh, getAuthHeaders],
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
                                                      
