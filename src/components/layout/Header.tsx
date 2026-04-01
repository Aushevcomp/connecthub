"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Home, Briefcase, Bell, LogOut, X, User, FileText, Building2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "user" | "post" | "job";
  id: string;
  title: string;
  subtitle: string;
  avatar?: string;
  isCompany?: boolean;
}

// ─── Notification Bell ───
function NotificationBell() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const supabase = createClient();

    async function fetchCount() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    }

    fetchCount();

    // Real-time
    const channel = supabase
      .channel("notif-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Link href="/notifications"
      className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative",
        pathname === "/notifications" ? "text-accent bg-accent-soft" : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary")}>
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-bg-primary">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isAuthenticated, openAuthModal } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setShowResults(false); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const supabase = createClient();
        const searchTerm = `%${q.trim()}%`;

        // Search users/companies
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, role, company, account_type, avatar_url, is_verified")
          .or(`name.ilike.${searchTerm},role.ilike.${searchTerm},company.ilike.${searchTerm}`)
          .limit(5);

        // Search posts
        const { data: posts } = await supabase
          .from("posts")
          .select("id, content, author:profiles!posts_author_id_fkey(name)")
          .ilike("content", searchTerm)
          .limit(5);

        // Search jobs
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title, location, company:profiles!jobs_company_id_fkey(name)")
          .or(`title.ilike.${searchTerm},location.ilike.${searchTerm}`)
          .limit(5);

        const allResults: SearchResult[] = [
          ...(profiles || []).map((p: any) => ({
            type: "user" as const,
            id: p.id,
            title: p.name,
            subtitle: p.role || p.company || (p.account_type === "business" ? "Бизнес" : "Пользователь"),
            avatar: p.avatar_url,
            isCompany: p.account_type === "business",
          })),
          ...(posts || []).map((p: any) => ({
            type: "post" as const,
            id: p.id,
            title: p.content.slice(0, 80) + (p.content.length > 80 ? "..." : ""),
            subtitle: (p.author as any)?.name || "Пост",
          })),
          ...(jobs || []).map((j: any) => ({
            type: "job" as const,
            id: j.id,
            title: j.title,
            subtitle: `${(j.company as any)?.name || "Компания"} · ${j.location}`,
          })),
        ];

        setResults(allResults);
        setShowResults(true);
      } catch (err) { console.error("Search error:", err); }
      finally { setSearching(false); }
    }, 300);
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery("");
    if (result.type === "job") router.push("/jobs");
    else if (result.type === "user") router.push(`/profile/${result.id}`);
    else router.push("/");
  };

  const getIcon = (type: string) => {
    if (type === "user") return <User size={14} />;
    if (type === "post") return <FileText size={14} />;
    return <Briefcase size={14} />;
  };

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-border px-4 md:px-6 h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-lg text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,0.25)" }}>C</div>
        <span className="text-xl font-extrabold tracking-tight gradient-text hidden sm:block">ConnectHub</span>
      </Link>

      {/* Search */}
      <div className="relative max-w-md flex-1 mx-4 md:mx-8" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
        <input
          type="text"
          placeholder="Поиск людей, компаний, вакансий..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="w-full h-10 rounded-full bg-bg-tertiary border border-border text-text-primary text-sm pl-10 pr-10 outline-none transition-all duration-200 focus:border-border-focus focus:bg-bg-hover placeholder:text-text-tertiary font-sans"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setShowResults(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        )}

        {/* Results Dropdown */}
        {showResults && (
          <div className="absolute top-12 left-0 right-0 bg-bg-secondary border border-border rounded-xl shadow-lg max-h-[400px] overflow-y-auto z-50 animate-scale-in">
            {results.length === 0 ? (
              <div className="p-4 text-sm text-text-tertiary text-center">
                {searching ? "Поиск..." : "Ничего не найдено"}
              </div>
            ) : (
              <>
                {results.map((r, idx) => (
                  <button key={`${r.type}-${r.id}-${idx}`}
                    onClick={() => handleResultClick(r)}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-bg-hover transition-colors text-left border-b border-border last:border-0">
                    {r.avatar ? (
                      <Avatar name={r.title} size={32} src={r.avatar} isCompany={r.isCompany} />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-tertiary">
                        {getIcon(r.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-text-secondary truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full flex-shrink-0">
                      {r.type === "user" ? "Профиль" : r.type === "post" ? "Пост" : "Вакансия"}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Link href="/" className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
          pathname === "/" ? "text-accent bg-accent-soft" : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary")}><Home size={20} /></Link>
        <Link href="/jobs" className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
          pathname === "/jobs" ? "text-accent bg-accent-soft" : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary")}><Briefcase size={20} /></Link>
        <NotificationBell />

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 ml-1">
            <Link href="/profile">
              <Avatar name={user.name} size={36} src={user.avatar_url} isCompany={user.account_type === "business"} className="cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <button onClick={signOut} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all duration-200" title="Выйти">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button className="btn-primary text-sm ml-2" onClick={openAuthModal}>Войти</button>
        )}
      </div>
    </header>
  );
}
