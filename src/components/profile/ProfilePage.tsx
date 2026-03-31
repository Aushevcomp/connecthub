"use client";

import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { MapPin, Users, Link as LinkIcon, Calendar } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export function ProfilePage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3 opacity-30">👤</div>
        <p className="text-text-secondary mb-4">Войдите, чтобы увидеть свой профиль</p>
        <button className="btn-primary" onClick={openAuthModal}>Войти</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Banner */}
      <div className="h-44 rounded-card relative"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}>
        <div className="absolute -bottom-12 left-6 border-4 border-bg-primary rounded-full">
          <Avatar name={user.name} size={96} src={user.avatar_url} isCompany={user.account_type === "business"} />
        </div>
      </div>

      {/* Info */}
      <div className="mt-16 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              {user.name}
              {user.is_verified && (
                <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </h1>
            <p className="text-text-secondary mt-1">
              {user.role || (user.account_type === "business" ? "Бизнес-аккаунт" : "Специалист")}
              {user.company ? ` @ ${user.company}` : ""}
            </p>

            <div className="flex gap-4 mt-3 text-sm text-text-tertiary">
              {user.location && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {user.location}</span>
              )}
              <span className="flex items-center gap-1">
                <Users size={14} /> {user.followers_count} связей
              </span>
              {user.website && (
                <span className="flex items-center gap-1"><LinkIcon size={14} /> {user.website}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {timeAgo(user.created_at)}
              </span>
            </div>
          </div>
          <button className="btn-ghost text-sm">Редактировать</button>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-4 text-sm text-text-secondary leading-relaxed">{user.bio}</p>
        )}

        {/* Skills */}
        {user.skills?.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {user.skills.map((s) => (
              <span key={s} className="tag-tech">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Activity placeholder */}
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3 opacity-30">📝</div>
        <p className="text-text-secondary">Ваши посты появятся здесь</p>
        <p className="text-sm text-text-tertiary mt-1">Напишите первый пост в ленте!</p>
      </div>
    </div>
  );
}
