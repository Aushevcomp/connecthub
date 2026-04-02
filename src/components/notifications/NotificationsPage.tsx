"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, UserPlus, Briefcase, AtSign, Bell, Trash2, CheckCheck } from "lucide-react";
import { InboxTabs } from "@/components/inbox/InboxTabs";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { timeAgo, cn } from "@/lib/utils";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  actor_id?: string;
  actor?: { name: string; avatar_url: string | null; account_type: string; is_verified: boolean } | null;
}

const ICON_MAP: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  job_match: Briefcase,
  mention: AtSign,
};

const COLOR_MAP: Record<string, string> = {
  like: "text-red-400 bg-red-500/10",
  comment: "text-accent bg-accent-soft",
  follow: "text-accent2 bg-accent2-soft",
  job_match: "text-orange-400 bg-orange-500/10",
  mention: "text-purple-400 bg-purple-500/10",
};

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      let notifs = (data || []) as Notification[];

      // Fetch actor profiles
      const actorIds = [...new Set(notifs.map((n) => n.actor_id).filter(Boolean))];
      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, account_type, is_verified")
          .in("id", actorIds);

        const actorMap = new Map();
        (actors || []).forEach((a: any) => actorMap.set(a.id, a));
        notifs = notifs.map((n) => ({ ...n, actor: n.actor_id ? actorMap.get(n.actor_id) : null }));
      }

      setNotifications(notifs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3 opacity-30">🔔</div>
        <p className="text-text-secondary">Войдите, чтобы увидеть уведомления</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <InboxTabs />

      <section className="relative overflow-hidden rounded-[30px] border border-border bg-bg-secondary/88 p-5 md:p-7 shadow-[0_22px_90px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_34%)]" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-accent">Системные сигналы</p>
            <h2 className="text-3xl font-black mt-3">Уведомления</h2>
            <p className="text-text-secondary mt-2 leading-relaxed max-w-2xl">
              Лайки, комментарии, подписки и другие события, которые помогают не терять важные движения вокруг профиля и контента.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-[22px] border border-border bg-bg-primary/82 backdrop-blur-sm px-4 py-3 min-w-[170px]">
              <p className="text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
                Непрочитано
              </p>
              <p className="text-2xl font-black mt-2">{unreadCount}</p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn-ghost text-sm">
                <CheckCheck size={14} /> Прочитать все
              </button>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-bg-tertiary" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-bg-tertiary rounded mb-2" />
                  <div className="h-3 w-24 bg-bg-tertiary rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={48} className="text-text-tertiary mx-auto mb-4 opacity-30" />
          <p className="text-text-secondary">Пока нет уведомлений</p>
          <p className="text-sm text-text-tertiary mt-1">Они появятся когда кто-то поставит лайк, напишет комментарий или подпишется</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICON_MAP[n.type] || Bell;
            const colorClass = COLOR_MAP[n.type] || "text-text-secondary bg-bg-tertiary";

            return (
              <div
                key={n.id}
                className={cn(
                  "group card card-hover p-4 flex items-center gap-3 transition-all cursor-pointer",
                  !n.is_read && "border-accent/20 bg-accent/5"
                )}
                onClick={() => { markAsRead(n.id); if (n.link) window.location.href = n.link; }}
              >
                {/* Actor avatar or icon */}
                {n.actor ? (
                  <Avatar name={n.actor.name} size={40} src={n.actor.avatar_url} isCompany={n.actor.account_type === "business"} />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon size={18} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {n.actor && <span className="font-semibold">{n.actor.name} </span>}
                    <span className="text-text-secondary">{n.message}</span>
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">{timeAgo(n.created_at)}</p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.is_read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
