"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { useState } from "react";

export default function HomePage() {
  const { me } = useApp();
  
  // 🚀 System logic များ မပျက်စီးစေရန် သေချာ ထိန်းသိမ်းထားပါသည်
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

  return (
    <AppShell title="Home">
      <div className="app-container pb-24 flex flex-col items-center justify-center min-h-[65vh]">
        
        {/* ✨ Home Page တစ်ခုလုံး ပြောင်ရှင်းသွားပြီး ရရှိလာမည့် Ultra Premium Minimalist Look */}
        <div className="relative text-center group px-6">
          {/* Ambient Glow Aura Effect (အလယ်ကနေ မှိတ်တုတ်မှိတ်တုတ် လင်းနေမည့် အလင်းတန်း) */}
          <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full scale-150 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
          
          {/* Main Welcome Heading */}
          <h1 className="text-xl font-black tracking-[0.2em] bg-gradient-to-r from-white via-zinc-400 to-zinc-600 bg-clip-text text-transparent uppercase relative z-10">
            Welcome to Myat
          </h1>
          
          {/* Subtext */}
          <p className="text-[11px] text-zinc-500 mt-2.5 tracking-wide font-medium relative z-10 max-w-[280px] mx-auto leading-relaxed">
            အောက်ခြေရှိ Tasks များနှင့် Options များကို နှိပ်၍ အသုံးပြုနိုင်ပါသည်။
          </p>
        </div>

      </div>
    </AppShell>
  );
}
