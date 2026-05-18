"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const { me, addGamePoints } = useApp(); // Backend နှင့် ချိတ်ဆက်ရန် (Points နှုတ်/ပေါင်း အတွက်)
  
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const [copied, setCopied] = useState(false);

  // 🕹️ TAPSWAP CORE STATES (Local Storage တွင် သိမ်းဆည်းမည်)
  const [points, setPoints] = useState(0);
  const [energy, setEnergy] = useState(500);
  const [activeTab, setActiveTab] = useState<"earn" | "boost">("earn");

  // BOOSTER LEVELS
  const [tapLvl, setTapLvl] = useState(1);
  const [capLvl, setCapLvl] = useState(1);
  const [speedLvl, setSpeedLvl] = useState(1);

  // UI Effects State
  const [tapEffects, setTapEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const pointsRef = useRef(points);

  // Dynamic Stats Calculations (ဉာဏ်ဆန်း တွက်ချက်မှုများ)
  const maxEnergy = 500 + (capLvl - 1) * 500;
  const pointsPerTap = 1 + (tapLvl - 1);
  const energyRegenPerSec = 1 + (speedLvl - 1);

  // Boosters Upgrade Costs Formulas (ဆတိုးတွက်ချက်မှုစနစ်)
  const getTapUpgradeCost = (lvl: number) => lvl === 1 ? 200 : Math.floor(200 * Math.pow(1.5, lvl - 1));
  const getCapUpgradeCost = (lvl: number) => lvl === 1 ? 200 : Math.floor(200 * Math.pow(1.5, lvl - 1));
  const getSpeedUpgradeCost = (lvl: number) => lvl === 1 ? 2000 : Math.floor(2000 * Math.pow(1.6, lvl - 1));

  // 💾 Load Initial Game Engine Data
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedPoints = localStorage.getItem("tw_points") || "0";
    const savedEnergy = localStorage.getItem("tw_energy") || "500";
    const savedTapLvl = localStorage.getItem("tw_lvl_tap") || "1";
    const savedCapLvl = localStorage.getItem("tw_lvl_cap") || "1";
    const savedSpeedLvl = localStorage.getItem("tw_lvl_speed") || "1";

    setPoints(Number(savedPoints));
    setEnergy(Number(savedEnergy));
    setTapLvl(Number(savedTapLvl));
    setCapLvl(Number(savedCapLvl));
    setSpeedLvl(Number(savedSpeedLvl));
  }, []);

  // Sync Points to Ref for auto-save operations
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // ⚡ AUTOMATIC ENERGY REGENERATION ENGINE (1 Second Interval)
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => {
        if (prev >= maxEnergy) return maxEnergy;
        const nextEnergy = prev + energyRegenPerSec;
        const finalEnergy = nextEnergy > maxEnergy ? maxEnergy : nextEnergy;
        localStorage.setItem("tw_energy", String(finalEnergy));
        return finalEnergy;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [maxEnergy, energyRegenPerSec]);

  // 💾 AUTO BACKEND SYNC (၅ စက္ကန့်တစ်ခါ Database ပေါ်သို့ လှမ်းသိမ်းပေးခြင်း)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (addGamePoints && pointsRef.current > 0) {
        try {
          // နှိပ်ထားသမျှ points များကို Server database ထဲသို့ သွားပေါင်းထည့်ပေးမည်
          await addGamePoints(pointsRef.current);
        } catch (e) {
          console.error("Sync failed", e);
        }
      }
    }, 5000);
    return () => clearInterval(syncInterval);
  }, [addGamePoints]);

  // 👆 CORE TAP ENGINE
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (energy < pointsPerTap) return; // Energy မလုံလောက်လျှင် နှိပ်မရပါ

    const nextEnergy = energy - pointsPerTap;
    const nextPoints = points + pointsPerTap;

    setEnergy(nextEnergy);
    setPoints(nextPoints);

    localStorage.setItem("tw_energy", String(nextEnergy));
    localStorage.setItem("tw_points", String(nextPoints));

    // Floating Text Coordinates +1, +2 Click Animation Effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newEffect = { id: Date.now() + Math.random(), x, y };

    setTapEffects((prev) => [...prev, newEffect]);
    setTimeout(() => {
      setTapEffects((prev) => prev.filter((effect) => effect.id !== newEffect.id));
    }, 600);
  };

  // 🚀 BOOST UPGRADE HANDLERS
  const upgradeBooster = (type: "tap" | "cap" | "speed") => {
    if (type === "tap" && tapLvl < 20) {
      const cost = getTapUpgradeCost(tapLvl);
      if (points < cost) return alert("❌ Points မလုံလောက်ပါ!");
      const next = points - cost;
      setPoints(next); setTapLvl(tapLvl + 1);
      localStorage.setItem("tw_points", String(next));
      localStorage.setItem("tw_lvl_tap", String(tapLvl + 1));
    }
    if (type === "cap" && capLvl < 20) {
      const cost = getCapUpgradeCost(capLvl);
      if (points < cost) return alert("❌ Points မလုံလောက်ပါ!");
      const next = points - cost;
      setPoints(next); setCapLvl(capLvl + 1);
      localStorage.setItem("tw_points", String(next));
      localStorage.setItem("tw_lvl_cap", String(capLvl + 1));
    }
    if (type === "speed" && speedLvl < 20) {
      const cost = getSpeedUpgradeCost(speedLvl);
      if (points < cost) return alert("❌ Points မလုံလောက်ပါ!");
      const next = points - cost;
      setPoints(next); setSpeedLvl(speedLvl + 1);
      localStorage.setItem("tw_points", String(next));
      localStorage.setItem("tw_lvl_speed", String(speedLvl + 1));
    }
  };

  return (
    <AppShell title="Home">
      <div className="app-container pb-28 flex flex-col justify-between min-h-[78vh] text-white">
        
        {/* TOP COIN & MAIN BALANCE DISPLAY */}
        <div className="text-center mt-6 space-y-1 relative z-10">
          <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] font-black">MYAT BALANCE</div>
          <div className="text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 flex items-center justify-center gap-2">
            🪙 {points.toLocaleString()}
          </div>
        </div>

        {/* 🔄 CONDITIONAL NAVIGATION TABS */}
        {activeTab === "earn" ? (
          /* =================== 🪙 EARN MAIN COIN SCREEN =================== */
          <div className="flex flex-col items-center justify-center my-auto relative select-none">
            {/* Ambient Core Aura Background Glow */}
            <div className="absolute w-72 h-72 bg-amber-500/10 blur-[90px] rounded-full pointer-events-none" />

            {/* 🔥 BIG INTERACTIVE COIN PAD */}
            <div 
              onClick={handleTap}
              className="relative w-64 h-64 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 p-[3px] shadow-[0_0_50px_rgba(245,158,11,0.2)] active:scale-[0.94] transition-all cursor-pointer group"
            >
              <div className="w-full h-full rounded-full bg-[#0d0e12] flex items-center justify-center relative overflow-hidden">
                {/* Inner Coin Texture Design */}
                <div className="w-[88%] h-[88%] rounded-full border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent flex flex-col items-center justify-center">
                  <span className="text-7xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] select-none">🪙</span>
                  <span className="text-[10px] font-black text-amber-500/40 tracking-[0.2em] mt-3 uppercase">Powered By Myat</span>
                </div>
              </div>

              {/* ⚡ Burst Floating Numbers Multi-text render (+1, +2, etc.) */}
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
          /* =================== 🔥 BOOST UPGRADES CARD LIST =================== */
          <div className="flex-1 my-6 space-y-3 relative z-10 max-w-md w-full mx-auto px-2 overflow-y-auto">
            <h2 className="text-xs font-black tracking-widest text-zinc-500 uppercase mb-4">🚀 Upgrades & Boosters</h2>

            {/* 1. Multitap Boost */}
            <div className="bg-zinc-900/60 border border-white/5 p-3.5 rounded-2xl flex justify-between items-center backdrop-blur-xl">
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">👆 Multitap <span className="text-[10px] text-amber-400 font-mono">Lvl {tapLvl}/20</span></div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Increase amount of points per tap. (+1 per tap)</div>
              </div>
              <button
                onClick={() => upgradeBooster("tap")}
                disabled={tapLvl >= 20 || points < getTapUpgradeCost(tapLvl)}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 text-[11px] font-black font-mono transition-all active:scale-95"
              >
                {tapLvl >= 20 ? "MAX" : `🪙 ${getTapUpgradeCost(tapLvl).toLocaleString()}`}
              </button>
            </div>

            {/* 2. Energy Capacity Boost */}
            <div className="bg-zinc-900/60 border border-white/5 p-3.5 rounded-2xl flex justify-between items-center backdrop-blur-xl">
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">🔋 Energy Limit <span className="text-[10px] text-cyan-400 font-mono">Lvl {capLvl}/20</span></div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Increase ⚡ capacity. (+500 limit max)</div>
              </div>
              <button
                onClick={() => upgradeBooster("cap")}
                disabled={capLvl >= 20 || points < getCapUpgradeCost(capLvl)}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 text-[11px] font-black font-mono transition-all active:scale-95"
              >
                {capLvl >= 20 ? "MAX" : `🪙 ${getCapUpgradeCost(capLvl).toLocaleString()}`}
              </button>
            </div>

            {/* 3. Recharging Speed Boost */}
            <div className="bg-zinc-900/60 border border-white/5 p-3.5 rounded-2xl flex justify-between items-center backdrop-blur-xl">
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">⚡ Recharge Speed <span className="text-[10px] text-emerald-400 font-mono">Lvl {speedLvl}/20</span></div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Increase speed of energy auto-recovery. (+1/s)</div>
              </div>
              <button
                onClick={() => upgradeBooster("speed")}
                disabled={speedLvl >= 20 || points < getSpeedUpgradeCost(speedLvl)}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 text-[11px] font-black font-mono transition-all active:scale-95"
              >
                {speedLvl >= 20 ? "MAX" : `🪙 ${getSpeedUpgradeCost(speedLvl).toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM REALTIME STATUS & CONTROL HUD CONTAINER */}
        <div className="w-full max-w-md mx-auto space-y-4">
          
          {/* ⚡ ENERGY FILL STATE STATUS BAR (TapSwap UI ကြီးအတိုင်း) */}
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

          {/* 📱 LOWER CONTROL DOCK NAVIGATION FOOTER (TapSwap Menu Layout) */}
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

        {/* GLOBAL DYNAMIC CSS ANIMATION FOR COIN IMPULSE POPPING */}
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
                
