"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import { cn } from "@/lib/utils";

export function InboxTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const counts = useInboxCounts(user?.id);

  const items = [
    {
      href: "/messages",
      label: "Сообщения",
      icon: MessageSquare,
      count: counts.messages,
      active: pathname === "/messages",
    },
    {
      href: "/notifications",
      label: "Уведомления",
      icon: Bell,
      count: counts.notifications,
      active: pathname === "/notifications",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-[24px] border border-border bg-bg-secondary/82 p-2 backdrop-blur-sm shadow-[0_12px_48px_rgba(15,23,42,0.06)]",
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">Входящие</p>
          <p className="text-xs text-text-secondary mt-1">
            Чаты и системные сигналы в одном навигационном контуре.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-primary/80 px-3 py-1.5 text-xs text-text-secondary w-fit">
          Всего непрочитанных: <span className="font-bold text-text-primary">{counts.total}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map(({ href, label, icon: Icon, count, active }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-[20px] px-4 py-3.5 border transition-all duration-200 flex items-center justify-between gap-3",
              active
                ? "border-accent/20 bg-accent/10 text-accent shadow-[0_10px_30px_rgba(99,102,241,0.12)]"
                : "border-transparent bg-bg-primary/60 text-text-secondary hover:border-border hover:bg-bg-hover hover:text-text-primary"
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Icon size={18} />
              <span className="font-medium truncate">{label}</span>
            </span>
            <span
              className={cn(
                "min-w-[22px] h-[22px] rounded-full text-[11px] font-bold flex items-center justify-center px-1.5",
                count > 0
                  ? active
                    ? "bg-accent text-white"
                    : "bg-bg-secondary text-text-primary"
                  : "bg-bg-secondary/80 text-text-tertiary"
              )}
            >
              {count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
