"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Plus, Bell, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated, openAuthModal } = useAuth();

  const items = [
    { href: "/", label: "Лента", icon: Home },
    { href: "/jobs", label: "Работа", icon: Briefcase },
    { href: "#", label: "Создать", icon: Plus, special: true },
    { href: "/notifications", label: "Алерты", icon: Bell },
    { href: "/profile", label: "Профиль", icon: User, requiresAuth: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-t border-border px-2 py-2 flex justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.special) {
          return (
            <button
              key={item.label}
              onClick={() => !isAuthenticated && openAuthModal()}
              className="flex flex-col items-center"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <Icon size={20} />
              </div>
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.requiresAuth && !isAuthenticated ? "#" : item.href}
            onClick={(e) => {
              if (item.requiresAuth && !isAuthenticated) {
                e.preventDefault();
                openAuthModal();
              }
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] transition-colors",
              isActive ? "text-accent" : "text-text-tertiary"
            )}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
