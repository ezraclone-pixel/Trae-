"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";

export default function TasksPage() {
  const { me, completeTask } = useApp();
  const tasks = me?.tasks;

  const mainChannel = me?.config?.mainChannel || "@Myat_2055";
  const communityGroup = me?.config?.communityGroup || "@myat_2055G";

  return (
    <AppShell title="Tasks">
      <div className="app-container pb-24 space-y-3.5">
        
        {/* Banner: Make your tasks */}
        <InfoCard />

        {/* 📅 Task 1: Daily Login (Open ခလုတ်မပါဘဲ Claim သီးသန့် + Inline Right Button) */}
        <div className="stats-card relative overflow-hidden group transition-all duration-300 hover:border-indigo-500/20 py-3.5 px-4">
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                📅 Daily login
              </div>
              <div className="text-[11px] font-bold font-mono text-cyan-400 mt-1 drop-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                +500 PTS
              </div>
            </div>
            
            {/* Right Side Action */}
            <button
              className={`py-2 px-5 rounded-xl text-xs font-black transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${
                !!tasks?.daily_login
                  ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 cursor-not-allowed opacity-80"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.96] shadow-md shadow-indigo-600/20"
              }`}
              disabled={!!tasks?.daily_login}
              onClick={() => completeTask("daily_login")}
            >
              {(tasks?.daily_login ? "Claimed ✓" : "Claim").toUpperCase()}
            </button>
          </div>
        </div>

        {/* 📢 Task 2: Follow Main Channel (Inline Split Open/Verify Buttons on Right) */}
        <TaskCard
          title={`Follow main channel (${mainChannel})`}
          points="+1000 pts"
          done={!!tasks?.follow_channel}
          onOpen={() => window.open(`https://t.me/${mainChannel.replace("@", "")}`, "_blank")}
          onAction={() => completeTask("follow_channel")}
          actionLabel={tasks?.follow_channel ? "Verified ✓" : "Verify"}
          once
        />

        {/* 💬 Task 3: Join Community (Inline Split Open/Verify Buttons on Right) */}
        <TaskCard
          title={`Join community (${communityGroup})`}
          points="+1000 pts"
          done={!!tasks?.join_group}
          onOpen={() => window.open(`https://t.me/${communityGroup.replace("@", "")}`, "_blank")}
          onAction={() => completeTask("join_group")}
          actionLabel={tasks?.join_group ? "Verified ✓" : "Verify"}
          once
        />

        {/* 👥 Card 4: Referral Info Banner */}
        <div className="stats-card relative overflow-hidden group border-l-2 border-l-indigo-500/40 py-3.5 px-4">
          <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
          <div className="w-full flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                👥 Referral Multiplier
              </div>
              <div className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Referral တစ်ယောက်စီ <span className="text-cyan-400 font-bold font-mono">+1,500 PTS</span> (Unlimited)
              </div>
            </div>
            <span className="text-[9px] font-black font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase whitespace-nowrap">
              Unlimited
            </span>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

// 🚀 Top Info Banner Component
function InfoCard() {
  return (
    <div className="stats-card relative overflow-hidden group border-t-indigo-500/20 py-4 px-4">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      <div className="w-full relative z-10">
        <div className="text-sm font-black tracking-wide bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent uppercase">
          🚀 Make your tasks
        </div>
        <div className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          နေ့စဉ် login ၀င်ပြီး points များ စက္ကန့်ပိုင်းအတွင်း အလွယ်တကူ စုဆောင်းလိုက်ပါ။
        </div>
      </div>
    </div>
  );
}

// 📦 Premium Inline Reusable Task Card Component
function TaskCard({
  title,
  points,
  done,
  onAction,
  actionLabel,
  onOpen,
  once,
}: {
  title: string;
  points: string;
  done: boolean;
  onAction: () => Promise<void>;
  actionLabel: string;
  onOpen?: () => void;
  once?: boolean;
}) {
  return (
    <div className="stats-card relative overflow-hidden group transition-all duration-300 hover:border-indigo-500/20 py-3.5 px-4">
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* Left Side: Info Elements */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white tracking-wide truncate">
            {title.startsWith("Daily") ? "📅 " : title.startsWith("Follow") ? "📢 " : "💬 "}
            {title}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] font-bold font-mono text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
              {points.toUpperCase()}
            </span>
            {once && (
              <span className="text-[9px] text-zinc-500 font-semibold border border-zinc-800/60 px-1.5 py-0.2 rounded uppercase tracking-wide">
                Once
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Inline Action Buttons Group */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="py-2 px-3.5 rounded-xl border border-white/5 bg-white/5 text-xs font-bold text-zinc-300 hover:bg-white/10 active:scale-[0.96] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            disabled={!onOpen}
            onClick={onOpen}
          >
            Open
          </button>
          
          <button
            className={`py-2 px-4 rounded-xl text-xs font-black transition-all min-w-[80px] text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${
              done
                ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 cursor-not-allowed opacity-80"
                : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.96] shadow-md shadow-indigo-600/10"
            }`}
            disabled={done}
            onClick={() => onAction().catch(() => {})}
          >
            {actionLabel.toUpperCase()}
          </button>
        </div>

      </div>
    </div>
  );
}
