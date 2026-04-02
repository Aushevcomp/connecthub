"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Users, Building2, Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { syncProfileFollowCounts } from "@/lib/social";
import { useAuth } from "@/hooks/useAuth";
import { formatNumber } from "@/lib/utils";
import type { Profile } from "@/types";

export function RightPanel() {
  const { user } = useAuth();
  const [trends, setTrends] = useState<{ tag: string; count: number }[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [topCompanies, setTopCompanies] = useState<Profile[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Fetch trending tags from recent posts
    async function fetchTrends() {
      const { data } = await supabase
        .from("posts")
        .select("tags")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        const tagCount: Record<string, number> = {};
        data.forEach((p: any) => {
          (p.tags || []).forEach((t: string) => {
            tagCount[t] = (tagCount[t] || 0) + 1;
          });
        });
        const sorted = Object.entries(tagCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({ tag, count }));
        setTrends(sorted);
      }
    }

    // Fetch suggested users (exclude current user)
    async function fetchUsers() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("account_type", "user")
        .eq("profile_public", true)
        .order("followers_count", { ascending: false })
        .limit(10);

      if (data) {
        const filtered = user
          ? (data as Profile[]).filter((u) => u.id !== user.id)
          : (data as Profile[]);
        setSuggestedUsers(filtered.slice(0, 4));
      }
    }

    // Fetch top companies
    async function fetchCompanies() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("account_type", "business")
        .eq("profile_public", true)
        .order("followers_count", { ascending: false })
        .limit(5);

      if (data) {
        const filtered = user
          ? (data as Profile[]).filter((c) => c.id !== user.id)
          : (data as Profile[]);
        setTopCompanies(filtered.slice(0, 3));
      }
    }

    // Fetch who current user follows
    async function fetchFollowing() {
      if (!user) return;
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      if (data) {
        setFollowingSet(new Set(data.map((f: any) => f.following_id)));
      }
    }

    fetchTrends();
    fetchUsers();
    fetchCompanies();
    fetchFollowing();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    setLoadingFollow(targetId);
    try {
      const supabase = createClient();
      const isFollowing = followingSet.has(targetId);

      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
        const { followersCount } = await syncProfileFollowCounts(supabase, targetId);
        await syncProfileFollowCounts(supabase, user.id);
        setSuggestedUsers((prev) => prev.map((item) => item.id === targetId ? { ...item, followers_count: followersCount } : item));
        setTopCompanies((prev) => prev.map((item) => item.id === targetId ? { ...item, followers_count: followersCount } : item));
        setFollowingSet((prev) => { const next = new Set(prev); next.delete(targetId); return next; });
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
        const { followersCount } = await syncProfileFollowCounts(supabase, targetId);
        await syncProfileFollowCounts(supabase, user.id);
        setSuggestedUsers((prev) => prev.map((item) => item.id === targetId ? { ...item, followers_count: followersCount } : item));
        setTopCompanies((prev) => prev.map((item) => item.id === targetId ? { ...item, followers_count: followersCount } : item));
        setFollowingSet((prev) => new Set(prev).add(targetId));
      }
    } catch (err) { console.error("Follow error:", err); }
    finally { setLoadingFollow(null); }
  };

  return (
    <aside className="hidden xl:block sticky top-20 h-fit space-y-4">
      {/* Trends */}
      {trends.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Flame size={16} className="text-orange-400" /> Тренды
          </h3>
          {trends.map((t) => (
            <div key={t.tag} className="py-2.5 border-b border-border last:border-0 cursor-pointer group">
              <p className="text-sm font-semibold group-hover:text-accent transition-colors">#{t.tag}</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">{t.count} {t.count === 1 ? "пост" : "постов"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Users */}
      {suggestedUsers.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Users size={16} className="text-accent" /> Рекомендации
          </h3>
          {suggestedUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0">
              <Link href={`/profile/${u.id}`}>
                <Avatar name={u.name} size={36} src={u.avatar_url} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${u.id}`} className="hover:text-accent transition-colors">
                  <p className="text-[13px] font-semibold truncate">{u.name}</p>
                </Link>
                <p className="text-[11px] text-text-secondary truncate">{u.role || "Специалист"}</p>
              </div>
              {user && (
                <button
                  onClick={() => handleFollow(u.id)}
                  disabled={loadingFollow === u.id}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all flex-shrink-0 ${
                    followingSet.has(u.id)
                      ? "bg-accent-soft text-accent hover:bg-red-500/10 hover:text-red-400"
                      : "bg-bg-tertiary text-text-secondary hover:bg-accent-soft hover:text-accent"
                  }`}
                >
                  {followingSet.has(u.id) ? "✓" : "+"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top Companies */}
      {topCompanies.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Building2 size={16} className="text-accent2" /> Топ компании
          </h3>
          {topCompanies.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0">
              <Link href={`/profile/${c.id}`}>
                <Avatar name={c.name} size={36} src={c.avatar_url} isCompany />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${c.id}`} className="hover:text-accent transition-colors">
                  <p className="text-[13px] font-semibold truncate flex items-center gap-1">
                    {c.name}
                    {c.is_verified && (
                      <span className="w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <Check size={8} strokeWidth={3} className="text-white" />
                      </span>
                    )}
                  </p>
                </Link>
                <p className="text-[11px] text-text-secondary truncate">
                  {c.company || c.role || "Компания"} · {formatNumber(c.followers_count)} подписчиков
                </p>
              </div>
              {user && (
                <button
                  onClick={() => handleFollow(c.id)}
                  disabled={loadingFollow === c.id}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all flex-shrink-0 ${
                    followingSet.has(c.id)
                      ? "bg-accent-soft text-accent hover:bg-red-500/10 hover:text-red-400"
                      : "bg-bg-tertiary text-text-secondary hover:bg-accent-soft hover:text-accent"
                  }`}
                >
                  {followingSet.has(c.id) ? "✓" : "+"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-text-tertiary text-center leading-relaxed py-2">
        ConnectHub © 2026<br />
        О нас · Помощь · Условия · Конфиденциальность
      </p>
    </aside>
  );
}
