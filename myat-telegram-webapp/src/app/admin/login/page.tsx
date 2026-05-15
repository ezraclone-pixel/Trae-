"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 p-4 dark:bg-black">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <div className="text-base font-semibold">Admin Login</div>
        {error ? (
          <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        ) : null}
        <input
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          placeholder="Admin password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="mt-3 w-full rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
          onClick={async () => {
            setError(null);
            const res = await fetch("/api/admin/login", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ password }),
            });
            if (!res.ok) {
              const j = await res.json().catch(() => ({}));
              setError(j?.error || "Login failed");
              return;
            }
            router.push("/admin");
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

