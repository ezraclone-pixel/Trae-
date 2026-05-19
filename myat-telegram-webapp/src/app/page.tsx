"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const { me, addGamePoints } = useApp(); 
  
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const [copied, setCopied] = useState(false);

  const referralLink =
    me && botUsername
      ? `https://t.me/${botUsername}?start=ref_${me?.user?.telegramId || (me as any)?.telegramId || ""}`
      : null;

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🕹️ TAPSWAP CORE STATES
  const currentDbPoints = me?.user?.points || (me as any)?.points || 0;
  const [displayPoints, setDisplayPoints] = useState<number>(currentDbPoints);
  const [energy, setEnergy] = useState<number>(500);
  const [activeTab, setActiveTab] = useState<"earn" | "boost">("earn");

  // 🚀 BOOSTER LEVELS
  const [tapLvl, setTapLvl] = useState<number>(1);
  const [capLvl, setCapLvl] = useState<number>(1);
  const [speedLvl, setSpeedLvl] = useState<number>(1);

  const [tapEffects, setTapEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const accumulatedTapsRef = useRef<number>(0);

  // Dynamic Game Stats Calculations
  const maxEnergy = 500 + (capLvl - 1) * 500; 
  const pointsPerTap = 1 + (tapLvl - 1);       
  const energyRegenPerSec = 1 + (speedLvl - 1); 

  // Boosters Upgrade Costs Formulas
  const getTapUpgradeCost = (lvl: number) => lvl === 1 ? 200 : Math.floor(200 * Math.pow(1.5, lvl - 1));
  const getCapUpgradeCost = (lvl: number) => lvl === 1 ? 200 : Math.floor(200 * Math.pow(1.5, lvl - 1));
  const getSpeedUpgradeCost = (lvl: number) => lvl === 1 ? 2000 : Math.floor(2000 * Math.pow(1.6, lvl - 1));

  // 🔄 Database Sync Tracker
  useEffect(() => {
    setDisplayPoints(currentDbPoints);
    
    if (me?.user) {
      setTapLvl(Number((me.user as any).tapLevel || localStorage.getItem("tw_lvl_tap") || "1"));
      setCapLvl(Number((me.user as any).capLevel || localStorage.getItem("tw_lvl_cap") || "1"));
      setSpeedLvl(Number((me.user as any).speedLevel || localStorage.getItem("tw_lvl_speed") || "1"));
    }
  }, [currentDbPoints, me]);

  // ⚡ 🌟 REALTIME ENERGY SYNC LOOP (AppProvider က တိုးပေးလိုက်တဲ့ အားကို ၀.၂ စက္ကန့်တစ်ခါ လှမ်းဖတ်မည်)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const syncEnergyFromStorage = () => {
      const savedEnergy = localStorage.getItem("tw_energy") || "500";
      setEnergy(Number(savedEnergy));
    };

    syncEnergyFromStorage(); // Initial load
    const interval = setInterval(syncEnergyFromStorage, 200);

    return () => clearInterval(interval);
  }, []);

  // 💾 3-SEC AUTO BACKEND SYNC ENGINE
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (addGamePoints && accumulatedTapsRef.current > 0) {
        const pointsToSend = accumulatedTapsRef.current;
        accumulatedTapsRef.current = 0; 
        try {
          await addGamePoints(pointsToSend);
        } catch (e) {
          console.error("Database sync failed", e);
          accumulatedTapsRef.current += pointsToSend; 
        }
      }
    }, 3000);
    return () => clearInterval(syncInterval);
  }, [addGamePoints]);

  // 👆 🌟 MULTI-TOUCH CORE TAP ENGINE (လက်နှစ်ချောင်း/သုံးချောင်း ပြိုင်တူနှိပ်လို့ရစေမည့် Logic)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Zoom ဖြစ်သွားတာနှင့် Ghost Clicks များကို ကာကွယ်ရန်
    
    const rect = e.currentTarget.getBoundingClientRect();
    const touches = Array.from(e.changedTouches);
    
    let currentEnergy = Number(localStorage.getItem("tw_energy") || energy);
    let totalAddedPoints = 0;
    const newEffects: { id: number; x: number; y: number }[] = [];

    touches.forEach((touch) => {
      if (currentEnergy < pointsPerTap) return; 

      currentEnergy -= pointsPerTap;
      totalAddedPoints += pointsPerTap;

      // လက်ချောင်းတစ်ချောင်းစီရဲ့ နေရာအလိုက် Floating Effect ပြရန်
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      newEffects.push({ id: Date.now() + Math.random(), x, y });
    });

    if (totalAddedPoints === 0) return;

    // States များကို တစ်ပြိုင်တည်း Update လုပ်ခြင်း
    setDisplayPoints((prev: number) => prev + totalAddedPoints);
    setEnergy(currentEnergy);
    localStorage.setItem("tw_energy", String(currentEnergy));
    accumulatedTapsRef.current += totalAddedPoints;

    setTapEffects((prev) => [...prev, ...newEffects]);

    newEffects.forEach((eff) => {
      setTimeout(() => {
        setTapEffects((prev) => prev.filter((effect) => effect.id !== eff.id));
      }, 600);
    });
  };

  // 🚀 BOOST UPGRADE HANDLERS
  const upgradeBooster = async (type: "tap" | "cap" | "speed") => {
    if (!addGamePoints) return;

    if (type === "tap" && tapLvl < 20) {
      const cost = getTapUpgradeCost(tapLvl);
      if (displayPoints < cost) return alert("❌ Points မလုံလောက်ပါ!");
      
      try {
        setDisplayPoints((prev: number) => prev - cost);
        await addGamePoints(-cost); 
        const nextLvl = tapLvl + 1;
        setTapLvl(nextLvl);
        localStorage.setItem("tw_lvl_tap", String(nextLvl));
      } catch (err) { alert("Upgrade မအောင်မြင်ပါ"); }
    }
    
    if (type === "cap" && capLvl < 20) {
      const cost = getCapUpgradeCost(capLvl);
      if (displayPoints < cost) return alert("❌ Points မလုံလောက်ပါ!");
      
      try {
        setDisplayPoints((prev: number) => prev - cost);
        await addGamePoints(-cost);
        const nextLvl = capLvl + 1;
        setCapLvl(nextLvl);
        localStorage.setItem("tw_lvl_cap", String(nextLvl));
      } catch (err) { alert("Upgrade မအောင်မြင်ပါ"); }
    }
    
    if (type === "speed" && speedLvl < 20) {
      const cost = getSpeedUpgradeCost(speedLvl);
      if (displayPoints < cost) return alert("❌ Points မလုံလောက်ပါ!");
      
      try {
        setDisplayPoints((prev: number) => prev - cost);
        await addGamePoints(-cost);
        const nextLvl = speedLvl + 1;
        setSpeedLvl(nextLvl);
        localStorage.setItem("tw_lvl_speed", String(nextLvl));
      } catch (err) { alert("Upgrade မအောင်မြင်ပါ"); }
    }
  };

  return (
    <AppShell title="Home">
      <div className="app-container pb-28 flex flex-col justify-between min-h-[78vh] text-white select-none touch-none">
        
        {/* TOP MAIN GLOBAL COIN BALANCE DISPLAY */}
        <div className="text-center mt-6 space-y-1 relative z-10">
          <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] font-black">MYAT BALANCE</div>
          <div className="text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 flex items-center justify-center gap-2">
            🪙 {displayPoints.toLocaleString()}
          </div>
        </div>

        {/* TABS CONTAINER */}
        {activeTab === "earn" ? (
          /* =================== 🪙 EARN MAIN SCREEN =================== */
          <div className="flex flex-col items-center justify-center my-auto relative select-none">
            <div className="absolute w-72 h-72 bg-amber-500/10 blur-[90px] rounded-full pointer-events-none" />

            {/* 🔥 TAP COIN (onTouchStart သို့ ပြောင်းလဲထားသည်) */}
            <div 
              onTouchStart={handleTouchStart}
              className="relative w-64 h-64 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 p-[3px] shadow-[0_0_50px_rgba(245,158,11,0.2)] active:scale-[0.94] transition-all cursor-pointer group select-none touch-none"
            >
              <div className="w-full h-full rounded-full bg-[#0d0e12] flex items-center justify-center relative overflow-hidden pointer-events-none">
                <div className="w-[88%] h-[88%] rounded-full border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent flex flex-col items-center justify-center">
                  <span className="text-7xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] select-none">🪙</span>
                  <span className="text-[10px] font-black text-amber-500/40 tracking-[0.2em] mt-3 uppercase">Powered By Myat</span>
                </div>
              </div>

              {/* Burst Floating Text Effects */}
              {tapEffects.map((effect) => (
                <div
                  key={effect.id}
                  className="absolute pointer-events-none text-white font-black font-mono text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-float-up"
                  style={{ left: effect.x, top: effect.y, transform: 'translate(-50%, -50%)' }}
                >
                  +{pointsPerTap}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* =================== 🚀 BOOST SCREEN =================== */
          <div className="flex-1 my-6 space-y-3 relative z-10 max-w-md w-full mx-auto px-2 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-black tracking-widest text-zinc-500 uppercase">🚀 Upgrades & Boosters</h2>
              {referralLink && (
                <button
                  onClick={handleCopy}
                  className={`py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                    copied ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/5 text-zinc-400"
                  }`}
                >
                  {copied ? "Copied ✓" : "🔗 Invite Friends"}
                </button>
              )}
            </div>

            {/* 1. Multitap Boost */}
            <div className="bg-zinc-900/60 border border-white/5 p-3.5 rounded-2xl flex justify-between items-center backdrop-blur-xl">
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">👆 Multitap <span className="text-[10px] text-amber-400 font-mono">Lvl {tapLvl}/20</span></div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Increase points per tap. (+1 per tap)</div>
              </div>
              <button
                onClick={() => upgradeBooster("tap")}
                disabled={tapLvl >= 20 || displayPoints < getTapUpgradeCost(tapLvl)}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 text-[11px] font-black font-mono transition-all active:scale-95"
              >
                {tapLvl >= 20 ? "MAX" : `🪙 ${getTapUpgradeCost(tapLvl).toLocaleString()}`}
              </button>
            </div>

            {/* 2. Energy Capacity Boost */}
            <div className="bg-zinc-900/60 border border-white/5 p-3.5 rounded-2xl flex justify-between items-center backdrop-blur-xl">
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">🔋 Energy Limit <span className="text-[10px] text-cyan-400 font-mono">Lvl {capLvl}/20</span></div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Increase energy limit. (+500 capacity)</div>
              </div>
              <button
                onClick={() => upgradeBooster("cap")}
                disabled={capLvl >= 20 || displayPoints < getCapUpgradeCost(capLvl)}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 text-[11px] font-black font-mono transition-all active:scale-95"
              >
                {capLvl >= 20 ? "MAX" : `🪙 ${getCapUpgradeCost(capLvl).toLocaleString()}`}
              </button>
            </div>

            {/* 3. Recharging Speed Boost */}
            <div className="bg-zinc-900/60 border border-white/5 p-3.5 rounded-2xl flex justify-between items-center backdrop-blur-xl">
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">⚡ Recharge Speed <span className="text-[10px] text-emerald-400 font-mono">Lvl {speedLvl}/20</span></div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Increase energy auto-recovery speed. (+1/s)</div>
              </div>
              <button
                onClick={() => upgradeBooster("speed")}
                disabled={speedLvl >= 20 || displayPoints < getSpeedUpgradeCost(speedLvl)}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 text-[11px] font-black font-mono transition-all active:scale-95"
              >
                {speedLvl >= 20 ? "MAX" : `🪙 ${getSpeedUpgradeCost(speedLvl).toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM REALTIME STATUS & LOWER NAV COCKPIT */}
        <div className="w-full max-w-md mx-auto space-y-4">
          {activeTab === "earn" && (
            <div className="px-2 space-y-1.5">
              <div className="flex justify-between items-center font-mono text-[11px] font-black uppercase tracking-wider">
                <div className="text-amber-400 flex items-center gap-1">⚡ {energy} / {maxEnergy}</div>
                <div className="text-zinc-500">+{energyRegenPerSec}/sec</div>
              </div>
              <div className="w-full h-2.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden p-[2px]">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-100"
                  style={{ width: `${(energy / maxEnergy) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 border border-white/5 bg-zinc-950/80 backdrop-blur-2xl p-1.5 rounded-2xl shadow-2xl">
            <button
              onClick={() => setActiveTab("earn")}
              className={`py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 font-black uppercase tracking-widest text-[10px] transition-all ${
                activeTab === "earn" ? "bg-white/10 text-amber-400 border border-white/5" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>⛏️</span>
              <span>Earn</span>
            </button>
            <button
              onClick={() => setActiveTab("boost")}
              className={`py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 font-black uppercase tracking-widest text-[10px] transition-all ${
                activeTab === "boost" ? "bg-white/10 text-cyan-400 border border-white/5" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>🚀</span>
              <span>Boost</span>
            </button>
          </div>
        </div>

        <style jsx global>{`
          @keyframes floatUp {
            0% { opacity: 1; transform: translate(-50%, -50%) translateY(0) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) translateY(-100px) scale(1.3); }
          }
          .animate-float-up {
            animation: floatUp 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
          }
        `}</style>

      </div>
    </AppShell>
  );
        }
        
