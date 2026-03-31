"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Home, Briefcase, Bell, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { user, signOut, isAuthenticated, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-border px-4 md:px-6 h-16 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-lg text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,0.25)" }}>
          C
        </div>
        <span className="text-xl font-extrabold tracking-tight gradient-text hidden sm:block">
          ConnectHub
        </span>
      </Link>

      {/* Search */}
      <div className="relative max-w-md flex-1 mx-4 md:mx-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
        <input
          type="text"
          placeholder="Поиск людей, компаний, вакансий..."
          className="w-full h-10 rounded-full bg-bg-tertiary border border-border text-text-primary text-sm pl-10 pr-4 outline-none transition-all duration-200 focus:border-border-focus focus:bg-bg-hover placeholder:text-text-tertiary font-sans"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Link
          href="/"
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
            pathname === "/" ? "text-accent bg-accent-soft" : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          )}
        >
          <Home size={20} />
        </Link>
        <Link
          href="/jobs"
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
            pathname === "/jobs" ? "text-accent bg-accent-soft" : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          )}
        >
          <Briefcase size={20} />
        </Link>
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all duration-200 relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-bg-primary" />
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 ml-1">
            <Link href="/profile">
              <Avatar name={user.name} size={36} src={user.avatar_url} isCompany={user.account_type === "business"} className="cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <button
              onClick={signOut}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
              title="Выйти"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button className="btn-primary text-sm ml-2" onClick={openAuthModal}>
            Войти
          </button>
        )}
      </div>
    </header>
  );
}
