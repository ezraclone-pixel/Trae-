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
        
        {/* Banner: Make your tasks */}
        <InfoCard />

        {/* 📅 Task 1: Daily Login (Open ခလုတ်မပါ၊ စာအပြည့်ပေါ်ပြီး ညာဘက်မှာ Claim ခလုတ်) */}
        <div className="stats-card relative overflow-hidden group transition-all duration-300 hover:border-indigo-500/20 py-4 px-4">
          <div className="w-full flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white tracking-wide">
                📅 Daily login
              </div>
              <div className="text-[11px] font-bold font-mono text-cyan-400 mt-1.5 drop-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                +500 PTS
              </div>
            </div>
            
            {/* Right Side Claim Button */}
            <button
              className={`py-2.5 px-5 rounded-xl text-xs font-black transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${
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

        {/* 📢 Task 2: Follow Main Channel (စာသား အပြည့်ပေါ်မည့် Layout) */}
        <TaskCard
          title={`Follow main channel (${mainChannel})`}
          points="+1000 pts"
          done={!!tasks?.follow_channel}
          onOpen={() => window.open(`https://t.me/${mainChannel.replace("@", "")}`, "_blank")}
          onAction={() => completeTask("follow_channel")}
          actionLabel={tasks?.follow_channel ? "Verified ✓" : "Verify"}
          once
        />

        {/* 💬 Task 3: Join Community (စာသား အပြည့်ပေါ်မည့် Layout) */}
        <TaskCard
          title={`Join community (${communityGroup})`}
          points="+1000 pts"
          done={!!tasks?.join_group}
          onOpen={() => window.open(`https://t.me/${communityGroup.replace("@", "")}`, "_blank")}
          onAction={() => completeTask("join_group")}
          actionLabel={tasks?.join_group ? "Verified ✓" : "Verify"}
          once
        />

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

// 📦 Reusable Task Card Component (စာမကွက်ဘဲ Premium ဖြစ်စေမည့် ဘေးတိုက်ခလုတ်ပုံစံအသစ်)
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
    <div className="stats-card relative overflow-hidden group transition-all duration-300 hover:border-indigo-500/20 py-4 px-4">
      <div className="w-full flex flex-col gap-4">
        
        {/* Top: Title & PTS Badge (ဘယ်/ညာ ခွဲထားလို့ စာလုံးလုံးဝ မကျုံ့တော့ပါ) */}
        <div className="flex justify-between items-start gap-3">
          <div className="text-sm font-bold text-white tracking-wide leading-snug break-words max-w-[70%]">
            {title.startsWith("Daily") ? "📅 " : title.startsWith("Follow") ? "📢 " : "💬 "}
            {title}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-xs font-black font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.1)]">
              {points.toUpperCase()}
            </span>
            {once && (
              <span className="text-[9px] text-zinc-500 font-bold border border-zinc-800/80 px-1.5 py-0.2 rounded uppercase tracking-wider">
                Once
              </span>
            )}
          </div>
        </div>

        {/* Bottom: Action Buttons (စာသားအောက်မှာ ဘေးချင်းယှဉ် Grid Layout နဲ့ သပ်ရပ်သွားစေရန်) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            className="w-full py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs font-bold text-zinc-300 hover:bg-white/10 active:scale-[0.97] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            disabled={!onOpen}
            onClick={onOpen}
          >
            Open
          </button>
          
          <button
            className={`w-full py-2.5 rounded-xl text-xs font-black transition-all text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${
              done
                ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 cursor-not-allowed opacity-80"
                : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.97] shadow-md shadow-indigo-600/10"
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
