"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Settings, Inbox } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated, openAuthModal } = useAuth();

  const items = [
    { href: "/", label: "Лента", icon: Home },
    { href: "/jobs", label: "Работа", icon: Briefcase },
    { href: "/messages", label: "Входящие", icon: Inbox, requiresAuth: true, matches: ["/messages", "/notifications"] },
    { href: "/settings", label: "Настройки", icon: Settings, requiresAuth: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-t border-border px-2 py-2 flex justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.matches ? item.matches.includes(pathname) : pathname === item.href;

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
