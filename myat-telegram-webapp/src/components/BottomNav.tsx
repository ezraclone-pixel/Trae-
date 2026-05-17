"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/order", label: "Order", icon: CartIcon },
  { href: "/tasks", label: "Tasks", icon: TaskIcon },
  { href: "/leaderboard", label: "Top", icon: TrophyIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function BottomNav() {
  const path = usePathname();
  return (
    // 🌌 [UI ပြင်ဆင်ချက်] Floating Glassmorphism Look သို့ ပြောင်းလဲခြင်း
    <nav className="fixed bottom-6 left-5 right-5 z-99 mx-auto max-w-[440px] rounded-3xl border border-white/5 border-t-white/10 bg-[#0a0b12]/70 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(99,102,241,0.05)] backdrop-blur-2xl">
      <div className="flex justify-around items-center w-full">
        {items.map((it) => {
          const active = path === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`nav-item relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-black tracking-wide uppercase transition-all duration-300 outline-none ${
                active 
                  ? "text-cyan-400 scale-105" 
                  : "text-zinc-500 hover:text-zinc-300 active:scale-95"
              }`}
            >
              {/* ✨ [Premium Glow Backdrop] Active ဖြစ်တဲ့ ခလုတ်နောက်က Ambient Glow လင်းစေရန် */}
              {active && (
                <div 
                  className="absolute inset-0 -z-10 rounded-2xl bg-cyan-500/10 blur-md animate-pulse" 
                  style={{ animationDuration: '3s' }} 
                />
              )}

              {/* 🚀 Icon ကို အပေါ်သို့ Smooth ကြွတက်စေမည့် အပိုင်း */}
              <span className={`transition-all duration-300 ${active ? "-translate-y-1" : ""}`}>
                <Icon active={active} />
              </span>
              
              {it.label}

              {/* 🔹 Active Indicator Dot (အောက်ခြေ လေဆာစက်ကလေး) */}
              {active && (
                <span className="absolute bottom-0 h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// 🎨 [Glow Color Theme] Icon Line တွေကို Neon Cyan အရောင်ပြောင်းလဲခြင်း
function iconBase(active: boolean) {
  return active 
    ? "stroke-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-300" 
    : "stroke-zinc-500 transition-colors duration-300";
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={iconBase(active)}>
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" strokeWidth="1.8" />
    </svg>
  );
}
function CartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={iconBase(active)}>
      <path d="M6 6h15l-2 8H7L6 6Z" strokeWidth="1.8" />
      <path d="M6 6 5 3H2" strokeWidth="1.8" />
      <path d="M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" strokeWidth="1.8" />
    </svg>
  );
}
function TaskIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={iconBase(active)}>
      <path d="M9 11l2 2 4-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" strokeWidth="1.8" />
    </svg>
  );
}
function TrophyIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={iconBase(active)}>
      <path d="M8 21h8" strokeWidth="1.8" />
      <path d="M12 17v4" strokeWidth="1.8" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" strokeWidth="1.8" />
      <path d="M17 6h3v1a4 4 0 0 1-3 4" strokeWidth="1.8" />
      <path d="M7 6H4v1a4 4 0 0 0 3 4" strokeWidth="1.8" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={iconBase(active)}>
      <path d="M20 21a8 8 0 1 0-16 0" strokeWidth="1.8" />
      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeWidth="1.8" />
    </svg>
  );
}
