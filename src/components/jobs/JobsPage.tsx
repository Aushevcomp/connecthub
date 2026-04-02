"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, Loader2, Send } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/types";

// ─── Create Job Modal ───
function CreateJobModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", location: "", salary_min: "", salary_max: "",
    salary_currency: "₽", employment_type: "full-time", experience_level: "middle",
    tags: "",
  });

  if (!isOpen || !user) return null;

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.location.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const { error } = await supabase.from("jobs").insert({
        company_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        salary_currency: form.salary_currency,
        employment_type: form.employment_type,
        experience_level: form.experience_level,
        tags,
        is_hot: false,
        applicants_count: 0,
      });
      if (error) throw error;
      setForm({ title: "", description: "", location: "", salary_min: "", salary_max: "", salary_currency: "₽", employment_type: "full-time", experience_level: "middle", tags: "" });
      onCreated();
      onClose();
    } catch (err) { console.error("Job error:", err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-secondary border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold">Новая вакансия</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] bg-bg-tertiary text-text-secondary flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Название вакансии *</label>
            <input className="input-field" placeholder="Senior React Developer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Описание</label>
            <textarea className="input-field !h-auto py-2.5" rows={4} placeholder="Требования, обязанности, условия..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Локация *</label>
            <input className="input-field" placeholder="Москва / Удалённо" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Зарплата от</label>
              <input className="input-field" type="number" placeholder="100000" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Зарплата до</label>
              <input className="input-field" type="number" placeholder="200000" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Валюта</label>
              <select className="input-field" value={form.salary_currency} onChange={(e) => setForm({ ...form, salary_currency: e.target.value })}>
                <option value="₽">₽</option><option value="$">$</option><option value="€">€</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Тип занятости</label>
              <select className="input-field" value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}>
                <option value="full-time">Полная занятость</option><option value="part-time">Частичная</option><option value="contract">Контракт</option><option value="internship">Стажировка</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Опыт</label>
              <select className="input-field" value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })}>
                <option value="intern">Без опыта</option><option value="junior">1+ год</option><option value="middle">2+ лет</option><option value="senior">3+ лет</option><option value="lead">5+ лет</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Технологии (через запятую)</label>
            <input className="input-field" placeholder="React, TypeScript, Node.js" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="btn-ghost flex-1 justify-center" onClick={onClose}>Отмена</button>
          <button className="btn-primary flex-1 justify-center" onClick={handleSubmit} disabled={loading || !form.title.trim() || !form.location.trim()}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Публикация...</> : <><Send size={16} /> Опубликовать</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Jobs Page ───
export function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("jobs")
        .select("*, company:profiles!jobs_company_id_fkey(*)")
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      const baseJobs = (data || []) as Job[];
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser && baseJobs.length > 0) {
        const jobIds = baseJobs.map((job) => job.id);
        const { data: applications } = await supabase
          .from("job_applications")
          .select("job_id")
          .eq("user_id", authUser.id)
          .in("job_id", jobIds);

        const appliedSet = new Set((applications || []).map((application: { job_id: string }) => application.job_id));
        setJobs(baseJobs.map((job) => ({ ...job, user_applied: appliedSet.has(job.id) })));
        return;
      }

      setJobs(baseJobs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [user?.id]);

  const filtered = jobs.filter((j) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return j.title.toLowerCase().includes(q) || j.tags.some((t) => t.toLowerCase().includes(q)) ||
      j.company?.name?.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
  });

  const canCreateJob = user?.account_type === "business";

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold mb-1">Вакансии</h2>
          <p className="text-sm text-text-secondary">{jobs.length} открытых позиций</p>
        </div>
        {canCreateJob && (
          <button className="btn-primary text-sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Опубликовать вакансию
          </button>
        )}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
        <input className="input-field !rounded-full !pl-11" placeholder="Фильтр по навыку, компании или должности..."
          value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3.5 mb-3"><div className="w-12 h-12 rounded-lg bg-bg-tertiary" /><div className="flex-1"><div className="h-4 w-48 bg-bg-tertiary rounded mb-2" /><div className="h-3 w-24 bg-bg-tertiary rounded" /></div></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
          <div className="text-5xl mb-3 opacity-30">🔍</div>
          <p>Ничего не найдено</p>
        </div>
      ) : (
        filtered.map((job) => <JobCard key={job.id} job={job} />)
      )}

      <CreateJobModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchJobs} />
    </div>
  );
}
