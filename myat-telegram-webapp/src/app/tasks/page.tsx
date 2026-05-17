"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";

export default function TasksPage() {
  const { me, completeTask } = useApp();
  const tasks = me?.tasks;

  const mainChannel = me?.config.mainChannel || "@Myat_2055";
  const communityGroup = me?.config.communityGroup || "@myat_2055G";

  return (
    <AppShell title="Tasks">
      <div className="space-y-3">
        <InfoCard />

        <TaskCard
          title="Daily login"
          points="+500 pts"
          done={!!tasks?.daily_login}
          onAction={() => completeTask("daily_login")}
          actionLabel={tasks?.daily_login ? "Claimed" : "Claim"}
        />

        <TaskCard
          title={`Follow main channel (${mainChannel})`}
          points="+1000 pts"
          done={!!tasks?.follow_channel}
          onOpen={() => window.open(`https://t.me/${mainChannel.replace("@", "")}`, "_blank")}
          onAction={() => completeTask("follow_channel")}
          actionLabel={tasks?.follow_channel ? "Verified" : "Verify"}
          once
        />

        <TaskCard
          title={`Join community (${communityGroup})`}
          points="+1000 pts"
          done={!!tasks?.join_group}
          onOpen={() => window.open(`https://t.me/${communityGroup.replace("@", "")}`, "_blank")}
          onAction={() => completeTask("join_group")}
          actionLabel={tasks?.join_group ? "Verified" : "Verify"}
          once
        />

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="text-sm font-semibold">Referral</div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            Referral တစ်ယောက်စီ +1500 pts (Unlimited)
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function InfoCard() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="text-sm font-semibold">Make your tasks</div>
      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
        နေ့စဉ် login ၀င်ပြီး points များစုဆောင်းလိုက်ပါ။
      </div>
    </div>
  );
}

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
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs font-semibold text-indigo-600">{points}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          disabled={!onOpen}
          onClick={onOpen}
        >
          Open
        </button>
        <button
          className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
          disabled={done}
          onClick={() => onAction().catch(() => {})}
        >
          {actionLabel}
        </button>
      </div>
      {once ? (
        <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Once per user
        </div>
      ) : null}
    </div>
  );
        }
          
