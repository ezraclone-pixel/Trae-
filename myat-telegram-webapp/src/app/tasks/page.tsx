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
      <div className="app-container pb-24 space-y-4">
        
        {/* Banner: Make your tasks (Glow Effects) */}
        <InfoCard />

        {/* Task 1: Daily Login */}
        <TaskCard
          title="Daily login"
          points="+500 pts"
          done={!!tasks?.daily_login}
          onAction={() => completeTask("daily_login")}
          actionLabel={tasks?.daily_login ? "Claimed ✓" : "Claim"}
        />

        {/* Task 2: Follow Main Channel */}
        <TaskCard
          title={`Follow main channel (${mainChannel})`}
          points="+1000 pts"
          done={!!tasks?.follow_channel}
          onOpen={() => window.open(`https://t.me/${mainChannel.replace("@", "")}`, "_blank")}
          onAction={() => completeTask("follow_channel")}
          actionLabel={tasks?.follow_channel ? "Verified ✓" : "Verify"}
          once
        />

        {/* Task 3: Join Community */}
        <TaskCard
          title={`Join community (${communityGroup})`}
          points="+1000 pts"
          done={!!tasks?.join_group}
          onOpen={() => window.open(`https://t.me/${communityGroup.replace("@", "")}`, "_blank")}
          onAction={() => completeTask("join_group")}
          actionLabel={tasks?.join_group ? "Verified ✓" : "Verify"}
          once
        />

        {/* Card 4: Referral Info Banner */}
        <div className="stats-card relative overflow-hidden group border-l-2 border-l-indigo-500/40">
          <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
          <div className="w-full">
            <div className="flex justify-between items-center">
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                👥 Referral Multiplier
              </div>
              <span className="text-[10px] font-black font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg uppercase">
                Unlimited
              </span>
            </div>
            <div className="mt-2 text-xs leading-relaxed text-zinc-400">
              Referral တစ်ယောက်စီ <span className="text-cyan-400 font-bold font-mono">+1,500 PTS</span> စီ အကန့်အသတ်မရှိ တိုးပွားရယူနိုင်ပါသည်။
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

// 🚀 Info Banner Component (Premium Ambient Light)
function InfoCard() {
  return (
    <div className="stats-card relative overflow-hidden group border-t-indigo-500/20">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/20" />
      <div className="w-full relative z-10">
        <div className="text-base font-black tracking-wide bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent uppercase">
          🚀 Make your tasks
        </div>
        <div className="mt-2 text-xs leading-relaxed text-zinc-400">
          နေ့စဉ် <span className="text-cyan-400 font-bold">Login</span> ဝင်ပြီး points များ စက္ကန့်ပိုင်းအတွင်း အလွယ်တကူ စုဆောင်းလိုက်ပါ။
        </div>
      </div>
    </div>
  );
}

// 📦 Reusable Task Card Component (Cyberpunk Style Layout)
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
    <div className="stats-card relative overflow-hidden group transition-all duration-300 hover:border-indigo-500/20">
      <div className="w-full flex flex-col gap-3.5">
        
        {/* Title & Badge Alignment */}
        <div className="flex justify-between items-start gap-2">
          <div className="text-sm font-bold text-white tracking-wide">
            {title.startsWith("Daily") ? "📅 " : title.startsWith("Follow") ? "📢 " : "💬 "}
            {title}
          </div>
          <span className="text-xs font-black font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.1)] whitespace-nowrap">
            {points.toUpperCase()}
          </span>
        </div>

        {once ? (
          <div className="text-[10px] text-zinc-500 font-medium -mt-2">
            Once per user
          </div>
        ) : null}

        {/* Interactive Buttons Matrix */}
        <div className="grid grid-cols-2 gap-2.5 mt-1">
          {/* Open Button */}
          <button
            className="w-full py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs font-bold text-zinc-300 hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!onOpen}
            onClick={onOpen}
          >
            Open
          </button>
          
          {/* Action Status Button (Claim/Verify) */}
          <button
            className={`w-full py-2.5 rounded-xl text-xs font-black transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${
              done
                ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 cursor-not-allowed opacity-80"
                : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] shadow-lg shadow-indigo-600/10"
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
