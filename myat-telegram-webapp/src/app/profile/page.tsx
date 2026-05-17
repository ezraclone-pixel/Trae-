"use client";

import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";

// 🌟 Premium Cute Avatars List (DiceBear API သုံးပြီး Premium ဆန်တဲ့ ရုပ်လေးတွေ ပြပေးထားပါတယ်)
const premiumAvatars = [
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=Gizmo&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Bubba&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Luna&backgroundColor=d1d4f9"
];

export default function ProfilePage() {
  const { me } = useApp();

  // 🚀 User ရဲ့ Telegram ID နောက်ဆုံးဂဏန်းပေါ်မူတည်ပြီး တစ်ယောက်ကို တစ်ခုနှုန်း ခွဲပေးမည့် Logic
  const userIdNum = Number(me?.telegramId || "0");
  const randomAvatar = premiumAvatars[userIdNum % premiumAvatars.length];

  // 📸 Telegram PhotoUrl မရှိရင် အပေါ်က Cute Avatar ကို ပြောင်းသုံးပေးမည့်အဆင့်
  const finalProfilePic = me?.photoUrl || randomAvatar;

  return (
    <AppShell title="Profile">
      <div className="space-y-4 p-4">
        
        {/* Profile Card Header */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800 flex items-center gap-4">
          
          {/* 🖼️ Profile Avatar ပြသမည့် နေရာဝိုင်းလေး */}
          <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-indigo-500 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <img 
              src={finalProfilePic} 
              alt="Profile Avatar" 
              className="h-full w-full object-cover"
            />
          </div>

          {/* User Info အပိုင်း */}
          <div>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {me?.username || me?.firstName || me?.telegramId || "User"}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              ID: {me?.telegramId || "N/A"}
            </div>
          </div>
        </div>

        {/* Points & Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            <div className="text-[10px] text-zinc-500">Points</div>
            <div className="text-sm font-bold mt-1">{me?.points || 0}</div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            <div className="text-[10px] text-zinc-500">Available</div>
            <div className="text-sm font-bold mt-1">{(me?.points || 0) - (me?.reservedPoints || 0)}</div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            <div className="text-[10px] text-zinc-500">Reserved</div>
            <div className="text-sm font-bold mt-1">{me?.reservedPoints || 0}</div>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="text-sm font-semibold">Withdrawal</div>
          <div className="mt-1 text-xs text-zinc-500">
            Minimum: <span className="font-medium text-zinc-900 dark:text-zinc-50">50,000 pts</span> · Rate: 10 pts = 1 MMK
          </div>
          <button 
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors"
          >
            Withdraw
          </button>
        </div>

      </div>
    </AppShell>
  );
            }
