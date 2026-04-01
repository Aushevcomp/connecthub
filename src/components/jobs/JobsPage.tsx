"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/types";

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select(`*, company:profiles!jobs_company_id_fkey(*)`)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setJobs((data || []) as Job[]);
      } catch (err) {
        console.error("Fetch jobs error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [supabase]);

  const filtered = jobs.filter((j) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.tags.some((t) => t.toLowerCase().includes(q)) ||
      j.company?.name?.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold mb-1">Вакансии</h2>
        <p className="text-sm text-text-secondary">{jobs.length} открытых позиций</p>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
        <input
          className="input-field !rounded-full !pl-11"
          placeholder="Фильтр по навыку, компании или должности..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-lg bg-bg-tertiary" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-bg-tertiary rounded mb-2" />
                  <div className="h-3 w-24 bg-bg-tertiary rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-bg-tertiary rounded mb-2" />
              <div className="h-3 w-2/3 bg-bg-tertiary rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
          <div className="text-5xl mb-3 opacity-30">🔍</div>
          <p>Ничего не найдено</p>
          <p className="text-sm mt-1">Попробуйте другой запрос</p>
        </div>
      ) : (
        filtered.map((job) => <JobCard key={job.id} job={job} />)
      )}
    </div>
  );
}
