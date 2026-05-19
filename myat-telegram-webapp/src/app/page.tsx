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
  const currentDbPoints = me?.user?.points ?? 0;
  const [displayPoints, setDisplayPoints] = useState<number>(currentDbPoints);
  const [energy, setEnergy] = useState<number>(500);
  const [activeTab, setActiveTab] = useState<"earn" | "boost">("earn");

  // 🚀 BOOSTER LEVELS
  const [tapLvl, setTapLvl] = useState<number>(1);
  const [capLvl, setCapLvl] = useState<number>(1);
  const [speedLvl, setSpeedLvl] = useState<number>(1);

  const [tapEffects, setTapEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const accumulatedTapsRef = useRef<number>(0);
  const isUpgradingRef = useRef<boolean>(false); 
  const isSyncingRef = useRef<boolean>(false);

  // 🪐 3D TILT EFFECT STATE
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  // Dynamic Game Stats Calculations
  const maxEnergy = 500 + (capLvl - 1) * 500; 
  const pointsPerTap = 1 + (tapLvl - 1);       
  const energyRegenPerSec = 1 + (speedLvl - 1); 

  // Boosters Upgrade Costs Formulas
  const getTapUpgradeCost = (lvl: number) => lvl === 1 ? 200 : Math.floor(200 * Math.pow(1.5, lvl - 1));
  const getCapUpgradeCost = (lvl: number) => lvl === 1 ? 200 : Math.floor(200 * Math.pow(1.5, lvl - 1));
  const getSpeedUpgradeCost = (lvl: number) => lvl === 1 ? 2000 : Math.floor(2000 * Math.pow(1.6, lvl - 1));

  // 🔄 Component စတင်တက်လာချိန် သို့မဟုတ် အမှတ်အသစ်တကယ်ဝင်လာချိန်မှသာ ပြသပေးမည်
  useEffect(() => {
    if (!isSyncingRef.current && accumulatedTapsRef.current === 0 && !isUpgradingRef.current) {
      setDisplayPoints(currentDbPoints);
    }
  }, [currentDbPoints]);

  // 🔄 Booster Level Sync Tracker
  useEffect(() => {
    if (me?.user) {
      setTapLvl(Number((me.user as any).tapLevel || localStorage.getItem("tw_lvl_tap") || "1"));
      setCapLvl(Number((me.user as any).capLevel || localStorage.getItem("tw_lvl_cap") || "1"));
      setSpeedLvl(Number((me.user as any).speedLevel || localStorage.getItem("tw_lvl_speed") || "1"));
    }
  }, [me]);

  // ⚡ REALTIME ENERGY SYNC LOOP
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const syncEnergyFromStorage = () => {
      const savedEnergy = localStorage.getItem("tw_energy") || "500";
      setEnergy(Number(savedEnergy));
    };

    syncEnergyFromStorage();
    const interval = setInterval(syncEnergyFromStorage, 200);

    return () => clearInterval(interval);
  }, []);

  // 💾 3-SEC AUTO BACKEND SYNC ENGINE (ဒီတစ်ခါတော့ တကယ်ငြိမ်သွားပါပြီ)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (addGamePoints && accumulatedTapsRef.current > 0 && !isUpgradingRef.current) {
        const pointsToSend = accumulatedTapsRef.current;
        accumulatedTapsRef.current = 0; 
        
        try {
          isSyncingRef.current = true; 
          await addGamePoints(pointsToSend);
        } catch (e) {
          console.error("Database sync failed", e);
          accumulatedTapsRef.current += pointsToSend; 
        } finally {
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 600);
        }
      }
    }, 3000);
    return () => clearInterval(syncInterval);
  }, [addGamePoints]);

  // 👆 MULTI-TOUCH CORE TAP ENGINE + NATURAL 3D TILT
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    
    const rect = e.currentTarget.getBoundingClientRect();
    const touches = Array.from(e.changedTouches);
    
    let currentEnergy = Number(localStorage.getItem("tw_energy") || energy);
    let totalAddedPoints = 0;
    const newEffects: { id: number; x: number; y: number }[] = [];

    if (touches.length > 0) {
      const lastTouch = touches[touches.length - 1];
      const offsetX = lastTouch.clientX - rect.left - rect.width / 2;
      const offsetY = lastTouch.clientY - rect.top - rect.height / 2;
      
      const rotateX = -(offsetY / (rect.height / 2)) * 15;
      const rotateY = (offsetX / (rect.width / 2)) * 15;

      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(0.95)`,
        transition: "transform 0.05s ease-out",
      });

      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(12); 
      }
    }

    touches.forEach((touch) => {
      if (currentEnergy < pointsPerTap) return; 

      currentEnergy -= pointsPerTap;
      totalAddedPoints += pointsPerTap;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      newEffects.push({ id: Date.now() + Math.random(), x, y });
    });

    if (totalAddedPoints === 0) return;

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

  const handleTouchEnd = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    });
  };

  // 🚀 BOOST UPGRADE HANDLERS
  const upgradeBooster = async (type: "tap" | "cap" | "speed") => {
    if (!addGamePoints || isUpgradingRef.current) return;

    if (accumulatedTapsRef.current > 0) {
      const tempTaps = accumulatedTapsRef.current;
      accumulatedTapsRef.current = 0;
      await addGamePoints(tempTaps).catch(() => { accumulatedTapsRef.current = tempTaps; });
    }

    if (type === "tap" && tapLvl < 20) {
      const cost = getTapUpgradeCost(tapLvl);
      if (displayPoints < cost) return alert("❌ Points မလုံလောက်ပါ!");
      
      try {
        isUpgradingRef.current = true;
        setDisplayPoints((prev: number) => prev - cost);
        await addGamePoints(-cost); 
        const nextLvl = tapLvl + 1;
        setTapLvl(nextLvl);
        localStorage.setItem("tw_lvl_tap", String(nextLvl));
      } catch (err) { 
        alert("Upgrade မအောင်မြင်ပါ"); 
        setDisplayPoints((prev: number) => prev + cost);
      } finally {
        isUpgradingRef.current = false;
      }
    }
    
    if (type === "cap" && capLvl < 20) {
      const cost = getCapUpgradeCost(capLvl);
      if (displayPoints < cost) return alert("❌ Points မလုံလောက်ပါ!");
      
      try {
        isUpgradingRef.current = true;
        setDisplayPoints((prev: number) => prev - cost);
        await addGamePoints(-cost);
        const nextLvl = capLvl + 1;
        setCapLvl(nextLvl);
        localStorage.setItem("tw_lvl_cap", String(nextLvl));
      } catch (err) { 
        alert("Upgrade မအောင်မြင်ပါ"); 
        setDisplayPoints((prev: number) => prev + cost);
      } finally {
        isUpgradingRef.current = false;
      }
    }
    
    if (type === "speed" && speedLvl < 20) {
      const cost = getSpeedUpgradeCost(speedLvl);
      if (displayPoints < cost) return alert("❌ Points မလုံလောက်ပါ!");
      
      try {
        isUpgradingRef.current = true;
        setDisplayPoints((prev: number) => prev - cost);
        await addGamePoints(-cost);
        const nextLvl = speedLvl + 1;
        setSpeedLvl(nextLvl);
        localStorage.setItem("tw_lvl_speed", String(nextLvl));
      } catch (err) { 
        alert("Upgrade မအောင်မြင်ပါ"); 
        setDisplayPoints((prev: number) => prev + cost);
      } finally {
        isUpgradingRef.current = false;
      }
    }
  };

  return (
    <AppShell title="Home">
      <div className="app-container w-full max-w-md mx-auto px-4 flex flex-col justify-between h-[calc(100vh-60px)] text-white select-none overflow-hidden relative pb-4">
        
        {/* TOP MAIN GLOBAL COIN BALANCE DISPLAY */}
        <div className="text-center mt-4 space-y-1 relative z-10 flex-shrink-0">
          <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] font-black">MYAT BALANCE</div>
          <div className="text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 flex items-center justify-center gap-2">
            🪙 {displayPoints.toLocaleString()}
          </div>
        </div>

        {/* TABS CONTAINER */}
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          {activeTab === "earn" ? (
            <div className="flex flex-col items-center justify-center relative w-full select-none" style={{ perspective: "1000px" }}>
              <div className="absolute w-64 h-64 bg-amber-500/10 blur-[90px] rounded-full pointer-events-none" />

              <div 
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 p-[3px] shadow-[0_0_40px_rgba(245,158,11,0.2)] cursor-pointer group select-none touch-none will-change-transform"
                style={{ ...tiltStyle, touchAction: "none" }}
              >
                <div className="w-full h-full rounded-full bg-[#0d0e12] flex items-center justify-center relative overflow-hidden pointer-events-none">
                  <div className="w-[88%] h-[88%] rounded-full border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent flex flex-col items-center justify-center">
                    <span className="text-6xl sm:text-7xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] select-none">🪙</span>
                    <span className="text-[9px] font-black text-amber-500/40 tracking-[0.2em] mt-3 uppercase">Powered By Myat</span>
                  </div>
                </div>

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
            <div className="w-full space-y-2.5 py-2 overflow-y-auto max-h-[50vh] px-1">
              <div className="flex justify-between items-center mb-1">
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
              <div className="bg-zinc-900/60 border border-white/5 p-3 rounded-2xl flex justify-between items-center backdrop-blur-xl">
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">👆 Multitap <span className="text-[10px] text-amber-400 font-mono">Lvl {tapLvl}/20</span></div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Increase points per tap. (+1)</div>
                </div>
                <button
                  onClick={() => upgradeBooster("tap")}
                  disabled={tapLvl >= 20 || displayPoints < getTapUpgradeCost(tapLvl)}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 text-[11px] font-black font-mono transition-all active:scale-95"
                >
                  {tapLvl >= 20 ? "MAX" : `${getTapUpgradeCost(tapLvl).toLocaleString()}`}
                </button>
              </div>

              {/* 2. Energy Capacity Boost */}
              <div className="bg-zinc-900/60 border border-white/5 p-3 rounded-2xl flex justify-between items-center backdrop-blur-xl">
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">🔋 Energy Limit <span className="text-[10px] text-cyan-400 font-mono">Lvl {capLvl}/20</span></div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Increase energy limit. (+500)</div>
                </div>
                <button
                  onClick={() => upgradeBooster("cap")}
                  disabled={capLvl >= 20 || displayPoints < getCapUpgradeCost(capLvl)}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 text-[11px] font-black font-mono transition-all active:scale-95"
                >
                  {capLvl >= 20 ? "MAX" : `${getCapUpgradeCost(capLvl).toLocaleString()}`}
                </button>
              </div>

              {/* 3. Recharging Speed Boost */}
              <div className="bg-zinc-900/60 border border-white/5 p-3 rounded-2xl flex justify-between items-center backdrop-blur-xl">
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">⚡ Recharge Speed <span className="text-[10px] text-emerald-400 font-mono">Lvl {speedLvl}/20</span></div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Increase auto-recovery speed. (+1/s)</div>
                </div>
                <button
                  onClick={() => upgradeBooster("speed")}
                  disabled={speedLvl >= 20 || displayPoints < getSpeedUpgradeCost(speedLvl)}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 disabled:from-zinc-800 disabled:to-zinc-800 text-black disabled:text-zinc-600 text-[11px] font-black font-mono transition-all active:scale-95"
                >
                  {speedLvl >= 20 ? "MAX" : `${getSpeedUpgradeCost(speedLvl).toLocaleString()}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM REALTIME STATUS & LOWER NAV COCKPIT */}
        <div className="w-full flex-shrink-0 space-y-2 mt-auto">
          {activeTab === "earn" && (
            <div className="space-y-1">
              <div className="flex justify-between items-center font-mono text-[11px] font-black uppercase tracking-wider">
                <div className="text-amber-400 flex items-center gap-1">⚡ {energy} / {maxEnergy}</div>
                <div className="text-zinc-500">+{energyRegenPerSec}/sec</div>
              </div>
              <div className="w-full h-2 bg-zinc-950 rounded-full border border-white/5 overflow-hidden p-[1px]">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-100"
                  style={{ width: `${(energy / maxEnergy) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* EARN / BOOST TABS */}
          <div className="grid grid-cols-2 gap-2 border border-white/5 bg-zinc-950/90 backdrop-blur-2xl p-1 rounded-xl shadow-2xl relative z-20">
            <button
              onClick={() => setActiveTab("earn")}
              className={`py-2.5 rounded-lg flex flex-col items-center justify-center gap-0.5 font-black uppercase tracking-widest text-[10px] transition-all ${
                activeTab === "earn" ? "bg-white/10 text-amber-400 border border-white/5" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>⛏️</span>
              <span>Earn</span>
            </button>
            <button
              onClick={() => setActiveTab("boost")}
              className={`py-2.5 rounded-lg flex flex-col items-center justify-center gap-0.5 font-black uppercase tracking-widest text-[10px] transition-all ${
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
      
