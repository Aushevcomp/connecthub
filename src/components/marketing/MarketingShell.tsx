"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function MarketingShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isAuthenticated, openAuthModal } = useAuth();

  return (
    <div className={cn("min-h-screen bg-bg-primary text-text-primary overflow-hidden", className)}>
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[760px] overflow-hidden">
        <div className="absolute left-[6%] top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-[8%] top-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute left-1/2 top-80 h-72 w-72 -translate-x-1/2 rounded-full bg-accent2/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-lg text-white"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 20px rgba(99,102,241,0.25)",
              }}
            >
              C
            </div>
            <div className="hidden sm:block">
              <p className="font-extrabold tracking-tight gradient-text">ConnectHub</p>
              <p className="text-[11px] text-text-tertiary -mt-0.5">Сеть для стартапов и IT</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/#features" className="hover:text-text-primary transition-colors">
              Возможности
            </Link>
            <Link href="/#audience" className="hover:text-text-primary transition-colors">
              Для кого
            </Link>
            <Link href="/jobs" className="hover:text-text-primary transition-colors">
              Вакансии
            </Link>
            <Link href="/about" className="hover:text-text-primary transition-colors">
              О нас
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link href="/" className="btn-primary hidden sm:inline-flex">
                Открыть ленту
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-ghost hidden sm:inline-flex"
                  onClick={() => openAuthModal("login")}
                >
                  Войти
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => openAuthModal("register")}
                >
                  Создать профиль
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border mt-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-semibold">ConnectHub</p>
            <p className="text-sm text-text-secondary mt-1">
              Профессиональная social platform для людей, которые строят, нанимают и растут.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            <Link href="/about" className="hover:text-text-primary transition-colors">
              О нас
            </Link>
            <Link href="/jobs" className="hover:text-text-primary transition-colors">
              Вакансии
            </Link>
            <Link href="/saved" className="hover:text-text-primary transition-colors">
              Сохранённое
            </Link>
          </div>
        </div>
      </footer>

      <AuthModal />
    </div>
  );
}
