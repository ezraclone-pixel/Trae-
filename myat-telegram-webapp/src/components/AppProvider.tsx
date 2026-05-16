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

  // 🚀 Telegram initData (Raw String သီးသန့်) ကို ရှာဖွေပေးမည့် Helper
  const getRawTelegramInitData = useCallback(() => {
    if (typeof window === "undefined") return "";
    
    const tgWindow = window as any;
    // ၁။ Standard နည်းလမ်းအရ ယူမယ်
    let initData = tgWindow.Telegram?.WebApp?.initData || "";
    
    // ၂။ အကယ်၍ Blank ဖြစ်နေလျှင် URL Hash ထဲကနေပါ ရှာပြီး ထပ်ဆွဲထုတ်မယ်
    if (!initData && tgWindow.location?.hash) {
      const hashParams = new URLSearchParams(tgWindow.location.hash.substring(1));
      initData = hashParams.get("tgWebAppData") || "";
    }
    
    return initData;
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    const rawToken = getRawTelegramInitData();
    
    // 🛠️ Header ထဲကို Bearer တပ်ပြီး ပို့မယ်
    const res = await fetch("/api/me", { 
      cache: "no-store",
      headers: { 
        "Authorization": `Bearer ${rawToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMe(null);
      setError(j?.error || "Cannot load profile");
      return;
    }
    const data = await res.json();
    setMe(data);
  }, [getRawTelegramInitData]);

  const loginIfNeeded = useCallback(async () => {
    const rawToken = getRawTelegramInitData();
    
    // 1. အရင်ဆုံး profile ရှိလား Bearer Header နဲ့ စစ်မယ်
    const res = await fetch("/api/me", { 
      cache: "no-store",
      headers: { 
        "Authorization": `Bearer ${rawToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (res.ok) return true; 

    console.log("Profile verification skipped or failed, upgrading to Telegram Authentication...");

    // 2. /api/auth/telegram ဆီကို "Bearer " မပါတဲ့ rawToken သီးသန့်ကိုပဲ ပို့ပြီး စစ်ခိုင်းမယ် (၅၀၀ error မတက်အောင်)
    const authRes = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: rawToken }), 
    });

    if (!authRes.ok) {
      const j = await authRes.json().catch(() => ({}));
      setError(j?.error || "Authentication failed");
      return false;
    }

    return true;
  }, [getRawTelegramInitData]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const tg = (window as any)?.Telegram?.WebApp;
        if (tg) {
          if (tg.ready) tg.ready();
          if (tg.expand) tg.expand();
        }
        
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
      const rawToken = getRawTelegramInitData();
      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${rawToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ taskKey }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Task failed");
      }
      await refresh();
    },
    [refresh, getRawTelegramInitData],
  );

  const createOrder: Ctx["createOrder"] = useCallback(
    async (productKey) => {
      setError(null);
      const rawToken = getRawTelegramInitData();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${rawToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ category: "WEBSITE", productKey }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Order failed");
      }
      await refresh();
    },
    [refresh, getRawTelegramInitData],
  );

  const createWithdrawal: Ctx["createWithdrawal"] = useCallback(
    async (points) => {
      setError(null);
      const rawToken = getRawTelegramInitData();
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${rawToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ points }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Withdrawal failed");
      }
      await refresh();
    },
    [refresh, getRawTelegramInitData],
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
      
