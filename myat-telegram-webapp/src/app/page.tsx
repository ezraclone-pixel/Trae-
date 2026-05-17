"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { useState, useEffect } from "react";

export default function HomePage() {
  const { me, addGamePoints } = useApp(); // 🔗 AppProvider စနစ်နှင့် ချိတ်ဆက်ခြင်း
  
  // 🚀 မူရင်း System logic များကို မပျက်စီးစေရန် ရာနှုန်းပြည့် ထိန်းသိမ်းထားပါသည်
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const [copied, setCopied] = useState(false);

  const referralLink =
    me && botUsername
      ? `https://t.me/${botUsername}?start=ref_${(me as any)?.user?.telegramId || (me as any)?.telegramId || ""}`
      : null;

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🕹️ GAME CORE STATES
  const [tickets, setTickets] = useState(3); 
  const [dailyPointsEarned, setDailyPointsEarned] = useState(0); // Users များ မမြင်ရသော လျှို့ဝှက် Daily Max Cap
  const [isPlaying, setIsPlaying] = useState(false);
  const [gamePoints, setGamePoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35); // ၃၅ စက္ကန့် ပွဲချိန်
  const [tapEffect, setTapEffect] = useState<{ id: number; x: number; y: number } | null>(null);

  // ⏳ ၁၂ နာရီပြည့်တိုင်း လက်မှတ် ၃ စောင်နှင့် Daily Cap ပြန် Reset ချမည့်စနစ်
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const savedTickets = localStorage.getItem("game_tickets_left");
    const savedDailyPts = localStorage.getItem("game_daily_pts_earned");
    const lastReset = localStorage.getItem("game_ticket_last_reset");
    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    if (savedTickets !== null) setTickets(Number(savedTickets));
    if (savedDailyPts !== null) setDailyPointsEarned(Number(savedDailyPts));

    if (!lastReset) {
      localStorage.setItem("game_ticket_last_reset", String(now));
    } else if (now - Number(lastReset) >= TWELVE_HOURS) {
      setTickets(3);
      setDailyPointsEarned(0); 
      localStorage.setItem("game_tickets_left", "3");
      localStorage.setItem("game_daily_pts_earned", "0");
      localStorage.setItem("game_ticket_last_reset", String(now));
    }
  }, []);

  // 👥 Referral Logic: User B ဝင်လာလျှင် User A အတွက် +2 Tickets သာ တိုးပေးတော့မည့် စနစ်သစ်
  useEffect(() => {
    const currentRefs = me?.user?.referralCount || me?.referralCount || 0;
    if (currentRefs > 0) {
      const savedRefs = Number(localStorage.getItem("game_tracked_refs") || 0);
      if (currentRefs > savedRefs) {
        const diff = currentRefs - savedRefs;
        setTickets((prev) => {
          // 📉 [UPDATE]: ကိုယ့်လူတောင်းဆိုချက်အရ လူတစ်ယောက်တိုးတိုင်း +2 Tickets သာ ပေးပါတော့သည်
          const updated = prev + (diff * 2);
          localStorage.setItem("game_tickets_left", String(updated));
          return updated;
        });
        localStorage.setItem("game_tracked_refs", String(currentRefs));
      }
    }
  }, [me]);

  // ⏱️ 35 Seconds Countdown Engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  // 🚀 Start Game
  const startGame = () => {
    if (tickets <= 0) {
      alert("🎟️ ကစားခွင့် လက်မှတ် ကုန်သွားပါပြီ! 12 နာရီ စောင့်ပါ သို့မဟုတ် လူခေါ်ပါ!");
      return;
    }
    const nextTickets = tickets - 1;
    setTickets(nextTickets);
    localStorage.setItem("game_tickets_left", String(nextTickets));
    setGamePoints(0);
    setTimeLeft(35); 
    setIsPlaying(true);
  };

  // 👆 Core Tap Engine (Max 1000 PTS Cap စစ်ဆေးခြင်း)
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlaying) return;

    // 🤫 User မသိစေဘဲ System ကပဲ တစ်နေ့တာ 1000 PTS ပြည့်ရင် ပိတ်ချမည့် လျှို့ဝှက်ချက်
    if (dailyPointsEarned >= 1000) {
      if (tickets === 0 && dailyPointsEarned >= 1000) return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // တစ်ချက်နှိပ်လျှင် +2 PTS
    const nextGamePts = gamePoints + 2; 
    const nextDailyPts = dailyPointsEarned + 2;

    setGamePoints(nextGamePts);
    setDailyPointsEarned(nextDailyPts);
    localStorage.setItem("game_daily_pts_earned", String(nextDailyPts));
    
    setTapEffect({ id: Date.now(), x, y });
    setTimeout(() => setTapEffect(null), 200);
  };

  // 🏁 Game Over (Database ထဲ သို့ Points လှမ်းပေါင်းထည့်ခြင်း)
  const endGame = async () => {
    setIsPlaying(false);
    try {
      if (addGamePoints) {
        await addGamePoints(gamePoints);
      }
      alert(`🎉 ပွဲပြီးဆုံးပါပြီ! ရရှိလာသော +${gamePoints} PTS ကို Profile တွင် ပေါင်းထည့်လိုက်ပါပြီ။`);
    } catch (err) {
      alert("Points update မအောင်မြင်ပါ၊ ခေတ္တစောင့်ပြီး ပြန်ဆော့ပါ");
    }
  };

  return (
    <AppShell title="Home">
      <div className="app-container pb-24 space-y-5">
        
        {/* 📊 Game Top Status Display */}
        <div className="stats-card relative overflow-hidden border-t-cyan-500/20 py-4 px-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Game Status</div>
              <div className="text-lg font-black text-white font-mono mt-0.5 flex items-center gap-1.5">
                🎟️ {tickets} <span className="text-[11px] text-zinc-500 font-bold uppercase">Tickets</span>
              </div>
            </div>
            
            {/* Invite Link Button */}
            {referralLink && (
              <button
                onClick={handleCopy}
                className={`py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  copied 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 active:scale-95"
                }`}
              >
                {copied ? "Copied ✓" : "🔗 Invite Link"}
              </button>
            )}
          </div>
        </div>

        {/* 🎮 INTERACTIVE GAMEPLAY SCREEN */}
        {!isPlaying ? (
          // 🏠 Game Start Lobby Screen
          <div className="stats-card flex flex-col items-center justify-center py-14 px-6 text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full scale-150 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
            
            <div className="relative z-10 space-y-1.5">
              <h1 className="text-xl font-black tracking-[0.2em] bg-gradient-to-r from-white via-zinc-400 to-zinc-600 bg-clip-text text-transparent uppercase">
                Welcome to Myat
              </h1>
              <p className="text-[11px] text-zinc-500 max-w-[260px] mx-auto leading-relaxed font-medium">
                ၃၅ စက္ကန့်အတွင်း Core ကို အမြန်ဆုံးနှိပ်ပြီး Points များ ရယူလိုက်ပါ။ တစ်ချက်နှိပ်လျှင် <span className="text-cyan-400 font-bold font-mono">+2 PTS</span> ရရှိမည်။
              </p>
            </div>

            <button
              onClick={startGame}
              disabled={tickets <= 0}
              className={`w-full max-w-[200px] py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative z-10 ${
                tickets <= 0
                  ? "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 active:scale-[0.95]"
              }`}
            >
              {tickets <= 0 ? "No Tickets Left" : "🎮 START GAME"}
            </button>
          </div>
        ) : (
          // 🕹️ Active Gameplay Screen (35 Seconds Tapping Arena)
          <div className="stats-card flex flex-col items-center justify-center py-10 px-4 text-center space-y-6">
            
            {/* Live Data Row */}
            <div className="w-full flex justify-between items-center border-b border-white/5 pb-3 font-mono text-[11px] font-black uppercase tracking-wider">
              <div className="text-zinc-400">⏱️ Time: <span className="text-amber-400 font-bold text-xs">{timeLeft}s</span></div>
              <div className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg">PTS: +{gamePoints}</div>
            </div>

            {/* 🔥 GLOWING TAP CORE */}
            <div 
              onClick={handleTap}
              className="relative w-48 h-48 rounded-full bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border-2 border-cyan-400/20 flex items-center justify-center cursor-pointer select-none active:scale-[0.92] transition-transform shadow-[0_0_40px_rgba(6,182,212,0.1)] group"
            >
              <div className="w-40 h-40 rounded-full bg-[#07080e] border border-white/5 flex flex-col items-center justify-center">
                <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(6,182,212,0.4)] transform group-active:scale-110 transition-transform">💎</span>
                <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest mt-2.5 group-hover:text-cyan-400 transition-colors">TAP NOW</span>
              </div>

              {/* Floating Text Animation */}
              {tapEffect && (
                <div 
                  className="absolute pointer-events-none text-cyan-400 font-black font-mono text-sm"
                  style={{ 
                    left: tapEffect.x, 
                    top: tapEffect.y,
                    transform: 'translate(-50%, -50%)',
                    animation: 'fadeUpOut 0.2s ease-out forwards'
                  }}
                >
                  +2
                </div>
              )}
            </div>

            <style jsx global>{`
              @keyframes fadeUpOut {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -80%) scale(1.2); }
              }
            `}</style>

            <p className="text-[10px] text-zinc-500 tracking-widest font-black uppercase animate-pulse">
              Tap as fast as you can!
            </p>
          </div>
        )}

      </div>
    </AppShell>
  );
  }
      
