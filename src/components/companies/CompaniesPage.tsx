"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Users, Check, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("account_type", "business")
          .order("followers_count", { ascending: false })
          .limit(50);
        setCompanies((data || []) as Profile[]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  const filtered = companies.filter((c) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return c.name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.bio?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold mb-1">Компании</h2>
        <p className="text-sm text-text-secondary">{companies.length} компаний на платформе</p>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
        <input
          className="input-field !rounded-full !pl-11"
          placeholder="Поиск по названию, индустрии или городу..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl bg-bg-tertiary" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-bg-tertiary rounded mb-2" />
                  <div className="h-3 w-48 bg-bg-tertiary rounded mb-2" />
                  <div className="h-3 w-24 bg-bg-tertiary rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
          <div className="text-5xl mb-3 opacity-30">🏢</div>
          <p>Компании не найдены</p>
          <p className="text-sm mt-1">Попробуйте другой запрос</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="card card-hover p-5 transition-all hover:-translate-y-0.5 hover:border-accent cursor-pointer">
              <div className="flex gap-4">
                <Avatar name={c.name} size={56} src={c.avatar_url} isCompany className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base truncate">{c.name}</h3>
                    {c.is_verified && (
                      <span className="w-4.5 h-4.5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <Check size={10} strokeWidth={3} className="text-white" />
                      </span>
                    )}
                  </div>

                  {c.role && (
                    <p className="text-sm text-accent font-medium mt-0.5">{c.role}</p>
                  )}

                  {c.bio && (
                    <p className="text-sm text-text-secondary mt-1.5 line-clamp-2">{c.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-text-tertiary">
                    {c.location && (
                      <span className="flex items-center gap-1"><MapPin size={12} /> {c.location}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {c.followers_count} подписчиков
                    </span>
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-accent transition-colors"
                        onClick={(e) => e.stopPropagation()}>
                        <ExternalLink size={12} /> Сайт
                      </a>
                    )}
                  </div>

                  {c.skills && c.skills.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2.5">
                      {c.skills.slice(0, 4).map((s) => (
                        <span key={s} className="tag-tech !text-[10px]">{s}</span>
                      ))}
                      {c.skills.length > 4 && (
                        <span className="text-[10px] text-text-tertiary">+{c.skills.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
