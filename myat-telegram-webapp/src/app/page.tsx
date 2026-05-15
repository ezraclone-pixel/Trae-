"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";

export default function HomePage() {
  const { me } = useApp();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  const referralLink =
    me && botUsername
      ? `https://t.me/${botUsername}?start=ref_${me.user.telegramId}`
      : null;

  return (
    <AppShell title="Home">
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="text-base font-semibold">Myat Web App</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Website/App order လုပ်ပြီး Points ရယူပါ။ Referral နဲ့လည်း Points များများရနိုင်ပါတယ်။
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Points" value={me ? String(me.user.points) : "—"} />
            <Stat label="Referrals" value={me ? String(me.user.referralCount) : "—"} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="text-sm font-semibold">Referral Link</div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            Share လုပ်ပြီး referral တစ်ယောက်စီ +1500 pts ရယူပါ။
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              value={referralLink || "Bot username not set yet"}
              readOnly
            />
            <button
              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              disabled={!referralLink}
              onClick={async () => {
                if (!referralLink) return;
                await navigator.clipboard.writeText(referralLink);
              }}
            >
              Copy
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="text-sm font-semibold">Community</div>
          <div className="mt-2 text-sm">
            Main Channel: <span className="font-semibold">@Myat_2055</span>
          </div>
          <div className="mt-1 text-sm">
            Community Group: <span className="font-semibold">@myat_2055G</span>
          </div>
        </div>
      </div>
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
