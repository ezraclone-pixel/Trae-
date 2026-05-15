"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { useState } from "react";

const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "johnnewmannn";

const WEBSITE_PRODUCTS = [
  {
    key: "relationship",
    title: "For your relationship website",
    price: "15,500 MMK",
    exampleUrl: "",
  },
  {
    key: "portfolio",
    title: "For your portfolio website",
    price: "15,500 MMK",
    exampleUrl: "",
  },
  {
    key: "products",
    title: "For Your products website",
    price: "Negotiation",
    exampleUrl: "",
  },
  {
    key: "customize",
    title: "Customize Website",
    price: "Negotiation",
    exampleUrl: "",
  },
];

export default function OrderPage() {
  const { createOrder } = useApp();
  const [category, setCategory] = useState<"website" | "app">("website");

  return (
    <AppShell title="Order">
      <div className="space-y-4">
        <div className="flex rounded-2xl bg-white p-1 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <button
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
              category === "website"
                ? "bg-indigo-600 text-white"
                : "text-zinc-700 dark:text-zinc-200"
            }`}
            onClick={() => setCategory("website")}
          >
            Website
          </button>
          <button
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
              category === "app"
                ? "bg-indigo-600 text-white"
                : "text-zinc-700 dark:text-zinc-200"
            }`}
            onClick={() => setCategory("app")}
          >
            App
          </button>
        </div>

        {category === "website" ? (
          <div className="space-y-3">
            {WEBSITE_PRODUCTS.map((p) => (
              <div
                key={p.key}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
              >
                <div className="text-sm font-semibold">{p.title}</div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  Price: <span className="font-semibold">{p.price}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                    disabled={!p.exampleUrl}
                    onClick={() => {
                      if (!p.exampleUrl) return;
                      window.open(p.exampleUrl, "_blank");
                    }}
                  >
                    View example
                  </button>
                  <button
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                    onClick={async () => {
                      // Create order record (for points/accounting)
                      await createOrder(p.key);
                      // Open admin chat for details/payment
                      window.open(`https://t.me/${ADMIN_USERNAME}`, "_blank");
                    }}
                  >
                    Order
                  </button>
                </div>
              </div>
            ))}
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Note: “View example” links ကို နောက်မှ ထည့်လို့ရအောင် placeholder လုပ်ထားပါတယ်။
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            <div className="text-sm font-semibold">Coming soon…</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              App category ကို မကြာခင် ထည့်ပေးပါမယ်။
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

