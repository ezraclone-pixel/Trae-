"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Withdrawal = {
  id: string;
  userId: string;
  points: number;
  mmk: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  note?: string | null;
  user: {
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    points: number;
    reservedPoints: number;
  };
};

type Order = {
  id: string;
  userId: string;
  category: string;
  productKey: string;
  priceMMK?: number | null;
  status: string;
  pointsEarned: number;
  createdAt: string;
  user: { telegramId: string; username?: string | null; firstName?: string | null; lastName?: string | null };
};

export default function AdminPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"withdrawals" | "orders">("withdrawals");

  async function refresh() {
    setError(null);
    const [wRes, oRes] = await Promise.all([
      fetch("/api/admin/withdrawals", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
    ]);
    if (wRes.status === 401 || oRes.status === 401) {
      setError("Not logged in");
      return;
    }
    const w = await wRes.json().catch(() => ({}));
    const o = await oRes.json().catch(() => ({}));
    setWithdrawals(w.withdrawals || []);
    setOrders(o.orders || []);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">Admin Panel</div>
            <button
              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
              onClick={() => refresh().catch(() => {})}
            >
              Refresh
            </button>
          </div>
          {error ? (
            <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
              {error} — <Link className="underline" href="/admin/login">Go to login</Link>
            </div>
          ) : null}
          <div className="mt-3 flex rounded-xl bg-zinc-50 p-1 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <button
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                tab === "withdrawals" ? "bg-white dark:bg-zinc-950" : "text-zinc-600 dark:text-zinc-300"
              }`}
              onClick={() => setTab("withdrawals")}
            >
              Withdrawals
            </button>
            <button
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                tab === "orders" ? "bg-white dark:bg-zinc-950" : "text-zinc-600 dark:text-zinc-300"
              }`}
              onClick={() => setTab("orders")}
            >
              Orders
            </button>
          </div>
        </div>

        {tab === "withdrawals" ? (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {displayName(w.user)} • {w.userId}
                  </div>
                  <div
                    className={`text-xs font-semibold ${
                      w.status === "PENDING"
                        ? "text-amber-600"
                        : w.status === "ACCEPTED"
                          ? "text-emerald-600"
                          : "text-rose-600"
                    }`}
                  >
                    {w.status}
                  </div>
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  {w.points} pts = {w.mmk} MMK • User points: {w.user.points} (reserved {w.user.reservedPoints})
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    disabled={w.status !== "PENDING"}
                    onClick={async () => {
                      await fetch("/api/admin/withdrawals", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ id: w.id, action: "accept" }),
                      });
                      await refresh();
                    }}
                  >
                    Accept
                  </button>
                  <button
                    className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    disabled={w.status !== "PENDING"}
                    onClick={async () => {
                      const note = window.prompt("Reject note (optional)") || "";
                      await fetch("/api/admin/withdrawals", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ id: w.id, action: "reject", note }),
                      });
                      await refresh();
                    }}
                  >
                    Reject
                  </button>
                  <a
                    className="ml-auto rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-900"
                    href={`https://t.me/${w.user.username || w.userId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open chat
                  </a>
                </div>
              </div>
            ))}
            {withdrawals.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                No withdrawals
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {displayName(o.user)} • {o.userId}
                  </div>
                  <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{o.status}</div>
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  {o.category} • {o.productKey} • {o.priceMMK ?? "nego"} MMK • Points: {o.pointsEarned}
                </div>
              </div>
            ))}
            {orders.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                No orders
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function displayName(u: { username?: string | null; firstName?: string | null; lastName?: string | null; telegramId: string }) {
  return u.username ? `@${u.username}` : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.telegramId;
}

