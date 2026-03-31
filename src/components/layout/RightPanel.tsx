"use client";

import { Flame, Users, Building2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

const TRENDS = [
  { tag: "#AI_automation", count: "2.4K постов" },
  { tag: "#RemoteWork", count: "1.8K постов" },
  { tag: "#CIS_Startups", count: "1.2K постов" },
  { tag: "#DevOps", count: "934 поста" },
  { tag: "#ProductHunt", count: "756 постов" },
];

const SUGGESTED_USERS = [
  { name: "Алексей Кузнецов", role: "Senior Frontend Developer" },
  { name: "Мария Иванова", role: "Product Manager" },
  { name: "Дмитрий Соколов", role: "DevOps Engineer" },
  { name: "Анна Петрова", role: "UX/UI Designer" },
];

const TOP_COMPANIES = [
  { name: "TechFlow", industry: "AI / ML", followers: 2840, verified: true },
  { name: "CloudNest", industry: "DevOps / Cloud", followers: 5612, verified: true },
  { name: "PixelForge", industry: "GameDev", followers: 1203, verified: false },
];

export function RightPanel() {
  return (
    <aside className="hidden xl:block sticky top-20 h-fit space-y-4">
      {/* Trends */}
      <div className="card p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Flame size={16} className="text-orange-400" /> Тренды
        </h3>
        {TRENDS.map((t) => (
          <div key={t.tag} className="py-2.5 border-b border-border last:border-0 cursor-pointer group">
            <p className="text-sm font-semibold group-hover:text-accent transition-colors">{t.tag}</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">{t.count}</p>
          </div>
        ))}
      </div>

      {/* Suggested Users */}
      <div className="card p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Users size={16} className="text-accent" /> Рекомендации
        </h3>
        {SUGGESTED_USERS.map((u) => (
          <div key={u.name} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0">
            <Avatar name={u.name} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{u.name}</p>
              <p className="text-[11px] text-text-secondary truncate">{u.role}</p>
            </div>
            <button className="btn-ghost text-xs !px-2.5 !py-1 flex-shrink-0">+</button>
          </div>
        ))}
      </div>

      {/* Top Companies */}
      <div className="card p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-accent2" /> Топ компании
        </h3>
        {TOP_COMPANIES.map((c) => (
          <div key={c.name} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0">
            <Avatar name={c.name} size={36} isCompany />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate flex items-center gap-1">
                {c.name}
                {c.verified && (
                  <span className="w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
              </p>
              <p className="text-[11px] text-text-secondary truncate">
                {c.industry} · {c.followers.toLocaleString()} подписчиков
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-text-tertiary text-center leading-relaxed py-2">
        ConnectHub © 2026<br />
        О нас · Помощь · Условия · Конфиденциальность
      </p>
    </aside>
  );
}
