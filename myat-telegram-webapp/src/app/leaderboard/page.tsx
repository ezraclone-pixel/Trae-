"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { useEffect, useState } from "react";

type Row = {
  telegramId: string;
  displayName: string;
  points: number;
  rank: number;
  premium: boolean;
};

export default function LeaderboardPage() {
  const { me } = useApp();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      setRows(j.top || []);
    })();
  }, []);

  return (
    <AppShell title="Leaderboard">
      <div className="space-y-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="text-sm font-semibold">Top Users</div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            Premium icon ကို Top 3 မှာ ပြထားပါတယ်။
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          {rows.map((r) => {
            const isMe = me?.user.telegramId === r.telegramId;
            return (
              <div
                key={r.telegramId}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  isMe ? "bg-indigo-50 dark:bg-indigo-950/30" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    #{r.rank}
                  </div>
                  <div className="font-semibold">{r.displayName}</div>
                  {r.premium ? <PremiumIcon /> : null}
                </div>
                <div className="text-xs font-semibold">{r.points} pts</div>
              </div>
            );
          })}
          {rows.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No data yet
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function PremiumIcon() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l2.6 6.5L22 9l-5 4.4L18.2 21 12 17.6 5.8 21 7 13.4 2 9l7.4-.5L12 2Z"
          fill="currentColor"
        />
      </svg>
      Premium
    </span>
  );
}

