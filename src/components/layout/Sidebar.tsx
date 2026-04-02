"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, User, Building2, LogOut, Shield, Settings, Bookmark, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatNumber } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, isAuthenticated, openAuthModal } = useAuth();

  const navItems = [
    { href: "/", label: "Лента", icon: Home, badge: null },
    { href: "/jobs", label: "Вакансии", icon: Briefcase, badge: null },
    { href: "/profile", label: "Профиль", icon: User, badge: null, requiresAuth: true },
    { href: "/saved", label: "Сохранённое", icon: Bookmark, badge: null, requiresAuth: true },
    { href: "/messages", label: "Сообщения", icon: MessageSquare, badge: null, requiresAuth: true },
    { href: "/settings", label: "Настройки", icon: Settings, badge: null, requiresAuth: true },
    { href: "/companies", label: "Компании", icon: Building2, badge: null },
    ...(user?.is_admin ? [{ href: "/admin", label: "Админ-панель", icon: Shield, badge: null }] : []),
  ];

  return (
    <aside className="hidden lg:block sticky top-20 h-fit space-y-4">
      {/* Profile Card */}
      {isAuthenticated && user ? (
        <div className="card overflow-hidden">
          <div className="h-[70px] relative" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 border-[3px] border-bg-card rounded-full">
              <Avatar name={user.name} size={56} src={user.avatar_url} isCompany={user.account_type === "business"} />
            </div>
          </div>
          <div className="pt-9 pb-4 px-4 text-center">
            <p className="font-bold">{user.name}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {user.account_type === "business" ? "Бизнес-аккаунт" : user.role || "Специалист"}
            </p>
          </div>
          <div className="flex justify-around py-3 border-t border-border">
            <div className="text-center">
              <p className="font-bold text-accent">{formatNumber(user.followers_count)}</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">Связи</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-accent">0</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">Просмотры</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-accent">0</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">Посты</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5 text-center">
          <div className="text-3xl mb-3">🚀</div>
          <p className="font-bold mb-1">Присоединяйтесь</p>
          <p className="text-sm text-text-secondary mb-4">Создайте профиль и находите возможности</p>
          <button className="btn-primary w-full justify-center" onClick={() => openAuthModal("register")}>
            Регистрация
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="card p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

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
                "flex items-center gap-3 px-3.5 py-2.5 rounded-button text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              )}
            >
              <Icon size={20} />
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {isAuthenticated && (
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-button text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full mt-2"
          >
            <LogOut size={20} />
            Выйти
          </button>
        )}
      </nav>
    </aside>
  );
}
