"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Users, FileText, Briefcase, TrendingUp,
  CheckCircle, XCircle, Ban, Trash2, Search,
  Eye, AlertTriangle, BadgeCheck, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn, timeAgo, formatNumber } from "@/lib/utils";
import type { Profile, Post, Job } from "@/types";

// ─── Stats Card ───
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-sm text-text-secondary mt-1">{label}</p>
    </div>
  );
}

// ─── Tabs ───
type AdminTab = "stats" | "users" | "posts" | "jobs" | "verify";

const TABS: { key: AdminTab; label: string; icon: any }[] = [
  { key: "stats", label: "Статистика", icon: TrendingUp },
  { key: "users", label: "Пользователи", icon: Users },
  { key: "posts", label: "Посты", icon: FileText },
  { key: "jobs", label: "Вакансии", icon: Briefcase },
  { key: "verify", label: "Верификация", icon: BadgeCheck },
];

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const supabase = createClient();
  const [tab, setTab] = useState<AdminTab>("stats");
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ users: 0, posts: 0, jobs: 0, companies: 0 });

  // Users
  const [users, setUsers] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Posts
  const [posts, setPosts] = useState<Post[]>([]);

  // Jobs
  const [jobs, setJobs] = useState<Job[]>([]);

  // Verify requests
  const [unverified, setUnverified] = useState<Profile[]>([]);

  const isAdmin = user?.is_admin === true;

  const fetchStats = useCallback(async () => {
    const [usersRes, postsRes, jobsRes, companiesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "business"),
    ]);
    setStats({
      users: usersRes.count || 0,
      posts: postsRes.count || 0,
      jobs: jobsRes.count || 0,
      companies: companiesRes.count || 0,
    });
  }, [supabase]);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setUsers((data || []) as Profile[]);
  }, [supabase]);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data || []) as Post[]);
  }, [supabase]);

  const fetchJobs = useCallback(async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*, company:profiles!jobs_company_id_fkey(*)")
      .order("created_at", { ascending: false })
      .limit(50);
    setJobs((data || []) as Job[]);
  }, [supabase]);

  const fetchUnverified = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("account_type", "business")
      .eq("is_verified", false)
      .order("created_at", { ascending: false });
    setUnverified((data || []) as Profile[]);
  }, [supabase]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([fetchStats(), fetchUsers(), fetchPosts(), fetchJobs(), fetchUnverified()])
      .finally(() => setLoading(false));
  }, [isAdmin, fetchStats, fetchUsers, fetchPosts, fetchJobs, fetchUnverified]);

  // ─── Actions ───
  const handleBanUser = async (userId: string, ban: boolean) => {
    if (!confirm(ban ? "Забанить пользователя?" : "Разбанить пользователя?")) return;
    await supabase.from("profiles").update({
      is_banned: ban,
      banned_at: ban ? new Date().toISOString() : null,
      banned_reason: ban ? "Нарушение правил платформы" : null,
    }).eq("id", userId);
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Удалить пользователя и все его данные? Это необратимо!")) return;
    // Delete related data first
    await supabase.from("posts").delete().eq("author_id", userId);
    await supabase.from("jobs").delete().eq("company_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    fetchUsers();
    fetchStats();
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Удалить пост?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    fetchPosts();
    fetchStats();
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Удалить вакансию?")) return;
    await supabase.from("jobs").delete().eq("id", jobId);
    fetchJobs();
    fetchStats();
  };

  const handleVerify = async (userId: string, verify: boolean) => {
    await supabase.from("profiles").update({ is_verified: verify }).eq("id", userId);
    fetchUnverified();
    fetchUsers();
  };

  // ─── Access Guard ───
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="card p-10 text-center max-w-md">
          <AlertTriangle size={48} className="text-orange-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Доступ запрещён</h1>
          <p className="text-text-secondary mb-6">Эта страница доступна только администраторам</p>
          <Link href="/" className="btn-primary inline-flex">
            <ArrowLeft size={16} /> На главную
          </Link>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header border-b border-border px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-lg text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>C</div>
            <span className="text-xl font-extrabold tracking-tight gradient-text">ConnectHub</span>
          </Link>
          <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <Shield size={14} className="text-red-400" />
            <span className="text-sm font-semibold text-red-400">Admin Panel</span>
          </div>
        </div>
        <Link href="/" className="btn-ghost text-sm">
          <ArrowLeft size={16} /> Вернуться на сайт
        </Link>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-bg-card border border-border rounded-card p-1 mb-6 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-medium transition-all whitespace-nowrap",
                tab === key
                  ? "bg-accent-soft text-accent font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-tertiary">Загрузка...</div>
        ) : (
          <>
            {/* ── Stats Tab ── */}
            {tab === "stats" && (
              <div>
                <h2 className="text-lg font-bold mb-4">Обзор платформы</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Пользователи" value={stats.users} icon={Users} color="bg-accent-soft text-accent" />
                  <StatCard label="Посты" value={stats.posts} icon={FileText} color="bg-emerald-500/10 text-emerald-400" />
                  <StatCard label="Вакансии" value={stats.jobs} icon={Briefcase} color="bg-orange-500/10 text-orange-400" />
                  <StatCard label="Компании" value={stats.companies} icon={BadgeCheck} color="bg-purple-500/10 text-purple-400" />
                </div>

                <h3 className="text-base font-bold mb-3">Последние регистрации</h3>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-secondary text-left">
                        <th className="px-4 py-3 font-medium">Пользователь</th>
                        <th className="px-4 py-3 font-medium">Тип</th>
                        <th className="px-4 py-3 font-medium">Дата</th>
                        <th className="px-4 py-3 font-medium">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 10).map((u) => (
                        <tr key={u.id} className="border-b border-border hover:bg-bg-hover transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u.name} size={32} isCompany={u.account_type === "business"} />
                              <div>
                                <p className="font-medium">{u.name}</p>
                                <p className="text-xs text-text-tertiary">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              u.account_type === "business" ? "bg-purple-500/10 text-purple-400" : "bg-accent-soft text-accent"
                            }`}>
                              {u.account_type === "business" ? "Бизнес" : "Юзер"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{timeAgo(u.created_at)}</td>
                          <td className="px-4 py-3">
                            {(u as any).is_banned ? (
                              <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Забанен</span>
                            ) : u.is_verified ? (
                              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Верифицирован</span>
                            ) : (
                              <span className="text-xs font-medium text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">Активен</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Users Tab ── */}
            {tab === "users" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Пользователи ({users.length})</h2>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                  <input
                    className="input-field !rounded-full !pl-10"
                    placeholder="Поиск по имени или email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="card card-hover p-4 flex items-center gap-4">
                      <Avatar name={u.name} size={44} isCompany={u.account_type === "business"} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold flex items-center gap-1.5">
                          {u.name}
                          {u.is_verified && (
                            <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>
                          )}
                          {u.is_admin && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">ADMIN</span>
                          )}
                        </p>
                        <p className="text-sm text-text-secondary truncate">{u.email}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {u.account_type === "business" ? "Бизнес" : "Юзер"} · {u.role || "—"} · {timeAgo(u.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!u.is_admin && (
                          <>
                            {!(u as any).is_banned ? (
                              <button
                                onClick={() => handleBanUser(u.id, true)}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-orange-500/10 hover:text-orange-400 transition-all"
                                title="Забанить"
                              >
                                <Ban size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(u.id, false)}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-all"
                                title="Разбанить"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleVerify(u.id, !u.is_verified)}
                              className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                u.is_verified
                                  ? "text-accent bg-accent-soft hover:bg-accent/20"
                                  : "text-text-secondary hover:bg-accent-soft hover:text-accent"
                              )}
                              title={u.is_verified ? "Снять верификацию" : "Верифицировать"}
                            >
                              <BadgeCheck size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all"
                              title="Удалить"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Posts Tab ── */}
            {tab === "posts" && (
              <div>
                <h2 className="text-lg font-bold mb-4">Посты ({posts.length})</h2>
                <div className="space-y-2">
                  {posts.map((p) => (
                    <div key={p.id} className="card card-hover p-4">
                      <div className="flex items-start gap-3">
                        <Avatar name={p.author?.name || "?"} size={36} isCompany={p.author?.account_type === "business"} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{p.author?.name || "Удалён"}</p>
                            <span className="text-xs text-text-tertiary">{timeAgo(p.created_at)}</span>
                          </div>
                          <p className="text-sm text-text-secondary line-clamp-2">{p.content}</p>
                          <div className="flex gap-4 mt-2 text-xs text-text-tertiary">
                            <span>❤ {p.likes_count}</span>
                            <span>💬 {p.comments_count}</span>
                            <span>👁 {formatNumber(p.views_count)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePost(p.id)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all flex-shrink-0"
                          title="Удалить пост"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {posts.length === 0 && (
                    <div className="text-center py-12 text-text-tertiary">Нет постов</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Jobs Tab ── */}
            {tab === "jobs" && (
              <div>
                <h2 className="text-lg font-bold mb-4">Вакансии ({jobs.length})</h2>
                <div className="space-y-2">
                  {jobs.map((j) => (
                    <div key={j.id} className="card card-hover p-4 flex items-center gap-4">
                      <Avatar name={j.company?.name || "?"} size={40} isCompany />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{j.title}</p>
                        <p className="text-sm text-accent">{j.company?.name || "Компания"}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {j.location} · {j.applicants_count} откликов · {timeAgo(j.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteJob(j.id)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all flex-shrink-0"
                        title="Удалить вакансию"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div className="text-center py-12 text-text-tertiary">Нет вакансий</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Verify Tab ── */}
            {tab === "verify" && (
              <div>
                <h2 className="text-lg font-bold mb-4">Запросы на верификацию</h2>
                <p className="text-sm text-text-secondary mb-4">
                  Бизнес-аккаунты без синей галочки. Нажмите ✓ чтобы верифицировать.
                </p>
                <div className="space-y-2">
                  {unverified.map((u) => (
                    <div key={u.id} className="card card-hover p-4 flex items-center gap-4">
                      <Avatar name={u.name} size={44} isCompany />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-sm text-text-secondary">{u.email}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {u.company || "—"} · {u.location || "—"} · {timeAgo(u.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(u.id, true)}
                          className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          title="Верифицировать"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                          title="Удалить"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {unverified.length === 0 && (
                    <div className="card p-8 text-center">
                      <BadgeCheck size={40} className="text-emerald-400 mx-auto mb-3 opacity-50" />
                      <p className="text-text-secondary">Все компании верифицированы!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
