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
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-md">
        {items.map((it) => {
          const active = path === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
                active ? "text-indigo-600" : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              <Icon active={active} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function iconBase(active: boolean) {
  return active ? "stroke-indigo-600" : "stroke-zinc-500 dark:stroke-zinc-300";
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

