"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { useState } from "react";

export default function HomePage() {
  const { me } = useApp();
  //  Vercel Setting ထဲက နာမည်အမှန်အတိုင်း ပြင်လိုက်ပါတယ်
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const [copied, setCopied] = useState(false);

  // 🚀 me?.telegramId ရော me?.user?.telegramId ရော နှစ်ခုလုံးကို any ခံပြီး ဇွတ်ဖတ်ခိုင်းလိုက်တာပါ (Logic မပြောင်းလဲပါ)
  const referralLink =
    me && botUsername
      ? `https://t.me/${botUsername}?start=ref_${(me as any)?.user?.telegramId || (me as any)?.telegramId || ""}`
      : null;

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // 2 စက္ကန့်ကြာရင် စာသားပြန်ပြောင်းမယ်
  };

  return (
    <AppShell title="Home">
      <div className="app-container">
        
        {/* Card 1: Main Status & Stats (Premium Glassmorphism + Dynamic Glow) */}
        <div className="stats-card relative overflow-hidden group border-t-indigo-500/20">
          {/* အမှောင်ထဲက လေဆာရောင်ပြေး Ambient Light Layer */}
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/20" />
          
          <div className="w-full relative z-10">
            <div className="flex items-center justify-between">
              <div className="text-base font-black tracking-wide bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent uppercase">
                Myat Web App
              </div>
              <div className="status-badge">Premium Active</div>
            </div>
            
            <div className="mt-2.5 text-xs leading-relaxed text-zinc-400">
              Website/App order လုပ်ပြီး Points ရယူပါ။ Referral နဲ့လည်း Points များများရနိုင်ပါတယ်။
            </div>
            
            {/* Stats Items */}
            <div className="mt-6 flex justify-around border-t border-white/5 pt-4">
              <div className="stat-item">
                <span className="label">Points</span>
                <span className="value font-mono tracking-tight text-white">
                  {me ? String((me as any).user?.points ?? (me as any).points ?? 0) : "—"}
                </span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="label">Referrals</span>
                <span className="value font-mono tracking-tight text-white">
                  {me ? String((me as any).user?.referralCount ?? (me as any).referralCount ?? 0) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Referral Link Section (Input & Button Upgrade) */}
        <div className="stats-card relative overflow-hidden group">
          <div className="w-full relative z-10">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">🔗</span> Referral Link
            </div>
            <div className="mt-1.5 text-xs text-zinc-400">
              Share လုပ်ပြီး referral တစ်ယောက်စီ <span className="text-cyan-400 font-bold font-mono">+1,500 PTS</span> ရယူပါ။
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <input
                className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-3 text-xs text-zinc-200 outline-none focus:border-indigo-500/40 focus:bg-white/[0.08] transition-all font-mono"
                value={referralLink || "Bot username not set yet"}
                readOnly
              />
              <button
                className={`action-btn primary !p-3 !rounded-xl text-xs font-black min-w-[80px] shadow-lg transition-all ${
                  !referralLink ? "opacity-30 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.96]"
                }`}
                disabled={!referralLink}
                onClick={handleCopy}
              >
                {copied ? "COPIED! ✓" : "COPY"}
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Community Channels (Modern Glass Row Items) */}
        <div className="stats-card">
          <div className="w-full">
            <div className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <span className="text-indigo-400">📢</span> Community
            </div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center bg-white/[0.02] hover:bg-white/[0.05] p-3.5 rounded-xl border border-white/5 transition-all group/row">
                <span className="text-zinc-400 font-medium group-hover/row:text-zinc-200 transition-colors">Main Channel</span>
                <span className="font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-lg tracking-wide font-mono shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  @Myat_2055
                </span>
              </div>
              <div className="flex justify-between items-center bg-white/[0.02] hover:bg-white/[0.05] p-3.5 rounded-xl border border-white/5 transition-all group/row">
                <span className="text-zinc-400 font-medium group-hover/row:text-zinc-200 transition-colors">Community Group</span>
                <span className="font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-lg tracking-wide font-mono shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  @myat_2055G
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
            }
                  
