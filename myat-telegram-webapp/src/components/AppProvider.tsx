"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type MeResponse = {
  [key: string]: any; 
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
  addGamePoints: (pointsEarned: number) => Promise<void>;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getRawTelegramInitData = useCallback(() => {
    if (typeof window === "undefined") return "";
    const tgWindow = window as any;
    let initData = tgWindow.Telegram?.WebApp?.initData || "";
    
    if (!initData && tgWindow.location?.hash) {
      const hashParams = new URLSearchParams(tgWindow.location.hash.substring(1));
      initData = hashParams.get("tgWebAppData") || "";
    }
    return initData;
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    const rawToken = getRawTelegramInitData();
    
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

  // 🕹️ [FIXED CORE GAME API SYNC] - တကယ့် TapSwap Logic အမှန်အတိုင်း ပြင်ဆင်ထားသည်
  const addGamePoints = useCallback(
    async (pointsEarned: number) => {
      setError(null);
      const rawToken = getRawTelegramInitData();
      
      // 1. 🔥 React State Mutation မဖြစ်စေဘဲ စနစ်မှန်အတိုင်း Frontend Display ပွိုင့်ကို အရင် realtime တိုးပေးထားမည်
      setMe((prevMe) => {
        if (!prevMe) return null;
        return {
          ...prevMe,
          user: {
            ...prevMe.user,
            points: (prevMe.user?.points || 0) + pointsEarned,
          },
        };
      });

      try {
        // 2. 🚀 Tap လုပ်ပြီးရလာတဲ့ Points တွေကို သိမ်းဖို့ သီးသန့် API Endpoint (/api/game/add-points) သို့ ပို့ခြင်း
        // မှတ်ချက်- အကယ်၍ Backend API လမ်းကြောင်းက ကွဲပြားနေပါက "/api/user/add-points" စသဖြင့် ပြောင်းလဲနိုင်ပါသည်
        const res = await fetch("/api/game/add-points", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${rawToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ points: pointsEarned }),
        });

        // အကယ်၍ API လမ်းကြောင်းမရှိသေး၍ Error တက်ခဲ့လျှင်လည်း Database က နောက်ဆုံး Data ကို ပြန်ဆွဲပြီး Sync လုပ်ပေးမည်
        if (res.ok) {
          const updatedData = await res.json();
          if (updatedData && updatedData.user) {
            setMe(updatedData);
          }
        } else {
          // API အဆင်မပြေပါက ဒေတာအမှန်ရရန် မူရင်း /api/me ကို ခေါ်ယူပြီး ပွိုင့်ပြန်ညှိမည်
          await refresh();
        }
      } catch (e) {
        console.error("Failed to sync game points to database:", e);
        await refresh();
      }
    },
    [refresh, getRawTelegramInitData]
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
    <AppContext.Provider value={{ me, loading, error, refresh, completeTask, createOrder, createWithdrawal, addGamePoints }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
    }
            
