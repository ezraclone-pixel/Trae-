"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import Image from "next/image";
import { useMemo, useState } from "react";

const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "johnnewmannn";

export default function ProfilePage() {
  const { me, createWithdrawal } = useApp();
  const [open, setOpen] = useState(false);
  const [pts, setPts] = useState("");

  const name = useMemo(() => {
    if (!me) return "—";
    return (
      (me.user.username ? `@${me.user.username}` : "") ||
      [me.user.firstName, me.user.lastName].filter(Boolean).join(" ") ||
      me.user.telegramId
    );
  }, [me]);

  return (
    <AppShell title="Profile">
      <div className="space-y-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              {me?.user.photoUrl ? (
                <Image
                  src={me.user.photoUrl}
                  alt="avatar"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-cover"
                />
              ) : null}
            </div>
            <div>
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                ID: {me?.user.telegramId || "—"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <Stat label="Points" value={me ? String(me.user.points) : "—"} />
            <Stat label="Available" value={me ? String(me.user.availablePoints) : "—"} />
            <Stat label="Reserved" value={me ? String(me.user.reservedPoints) : "—"} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="text-sm font-semibold">Withdrawal</div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            Minimum: <span className="font-semibold">50,000 pts</span> • Rate:{" "}
            <span className="font-semibold">10 pts = 1 MMK</span>
          </div>
          <button
            className="mt-3 w-full rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => setOpen(true)}
          >
            Withdraw
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            <div className="text-sm font-semibold">Withdraw points</div>
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
              Amount (pts) ထည့်ပါ။ Admin approve လုပ်ပြီးမှ points ကို remove လုပ်ပါမယ်။
            </div>
            <input
              className="mt-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
              placeholder="e.g. 50000"
              value={pts}
              onChange={(e) => setPts(e.target.value)}
              inputMode="numeric"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-900"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
                onClick={async () => {
                  const v = Number(pts);
                  await createWithdrawal(v);
                  setOpen(false);
                  setPts("");
                  window.open(`https://t.me/${ADMIN_USERNAME}`, "_blank");
                }}
              >
                Send to Admin
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

