"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { useState } from "react";

export default function HomePage() {
  const { me } = useApp();
  //  Vercel Setting ထဲက နာမည်အမှန်အတိုင်း ပြင်လိုက်ပါတယ်
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const [copied, setCopied] = useState(false);

  // 🚀 me?.telegramId ရော me?.user?.telegramId ရော နှစ်ခုလုံးကို any ခံပြီး ဇွတ်ဖတ်ခိုင်းလိုက်တာပါ
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
        
        {/* Card 1: Main Status & Stats (Premium Glassmorphism) */}
        <div className="stats-card">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="text-base font-bold tracking-tight text-white">Myat Web App</div>
              <div className="status-badge">Premium Active</div>
            </div>
            
            <div className="mt-2 text-xs leading-relaxed text-slate-400">
              Website/App order လုပ်ပြီး Points ရယူပါ။ Referral နဲ့လည်း Points များများရနိုင်ပါတယ်။
            </div>
            
            {/* Stats Items */}
            <div className="mt-5 flex justify-around border-t border-white/5 pt-4">
              <div className="stat-item">
                <span className="label">Points</span>
                <span className="value">{me ? String((me as any).user?.points ?? (me as any).points ?? 0) : "—"}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="label">Referrals</span>
                <span className="value">{me ? String((me as any).user?.referralCount ?? (me as any).referralCount ?? 0) : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Referral Link Section */}
        <div className="stats-card">
          <div className="w-full">
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>🔗</span> Referral Link
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Share လုပ်ပြီး referral တစ်ယောက်စီ <span className="text-[#00c6ff] font-medium">+1500 pts</span> ရယူပါ။
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white outline-none focus:border-[#00c6ff]/50 transition-all"
                value={referralLink || "Bot username not set yet"}
                readOnly
              />
              <button
                className={`action-btn primary !p-2.5 !rounded-xl text-xs font-bold min-w-[70px] ${
                  !referralLink ? "opacity-40 cursor-not-allowed" : ""
                }`}
                disabled={!referralLink}
                onClick={handleCopy}
              >
                {copied ? "Copied! ✓" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Community Channels */}
        <div className="stats-card">
          <div className="w-full">
            <div className="text-sm font-semibold text-white flex items-center gap-1.5 mb-3">
              <span>📢</span> Community
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400">Main Channel</span>
                <span className="font-semibold text-[#00c6ff] bg-[#0088cc]/10 px-2.5 py-1 rounded-lg">@Myat_2055</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400">Community Group</span>
                <span className="font-semibold text-[#00c6ff] bg-[#0088cc]/10 px-2.5 py-1 rounded-lg">@myat_2055G</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
        }
      
