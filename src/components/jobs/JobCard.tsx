"use client";

import { useEffect, useState } from "react";
import { MapPin, DollarSign, Clock, Flame, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { syncJobApplicantsCount } from "@/lib/social";
import type { Job } from "@/types";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const [applied, setApplied] = useState(job.user_applied || false);
  const [applicantsCount, setApplicantsCount] = useState(job.applicants_count);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    setApplied(job.user_applied || false);
    setApplicantsCount(job.applicants_count);
  }, [job.user_applied, job.applicants_count]);

  const handleApply = async () => {
    if (!isAuthenticated || !user) {
      openAuthModal();
      return;
    }

    if (loading || user.id === job.company_id) return;

    setLoading(true);
    const nextApplied = !applied;
    setApplied(nextApplied);

    try {
      const supabase = createClient();

      if (nextApplied) {
        const { error } = await supabase.from("job_applications").insert({
          job_id: job.id,
          user_id: user.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("job_applications")
          .delete()
          .eq("job_id", job.id)
          .eq("user_id", user.id);
        if (error) throw error;
      }

      const nextApplicantsCount = await syncJobApplicantsCount(supabase, job.id);
      setApplicantsCount(nextApplicantsCount);
    } catch (err) {
      console.error("Job application error:", err);
      setApplied(!nextApplied);
    } finally {
      setLoading(false);
    }
  };

  const salaryStr = job.salary_min && job.salary_max
    ? `${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} ${job.salary_currency}`
    : job.salary_min
      ? `от ${job.salary_min.toLocaleString()} ${job.salary_currency}`
      : job.salary_max
        ? `до ${job.salary_max.toLocaleString()} ${job.salary_currency}`
        : "По договорённости";

  const isOwnJob = user?.id === job.company_id;

  return (
    <article className="card card-hover p-5 mb-3 cursor-pointer animate-fade-in-up hover:-translate-y-0.5 hover:border-accent hover:shadow-lg transition-all duration-200">
      <div className="flex gap-3.5 mb-3">
        <Avatar name={job.company?.name || job.company_id} size={48} isCompany src={job.company?.avatar_url} />
        <div className="flex-1">
          <h3 className="font-bold">{job.title}</h3>
          <p className="text-sm text-accent font-medium mt-0.5">{job.company?.name || "Компания"}</p>
        </div>
        {job.is_hot && (
          <div className="flex items-center gap-1 bg-orange-500/10 text-orange-400 text-[11px] font-bold px-2 py-1 rounded-lg h-fit">
            <Flame size={12} /> Hot
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-text-secondary mb-3">
        <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
        <span className="flex items-center gap-1"><DollarSign size={14} /> {salaryStr}</span>
        <span className="flex items-center gap-1"><Clock size={14} /> {job.experience_level}</span>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {job.tags.map((t) => (
          <span key={t} className="tag-tech">{t}</span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          {applicantsCount} откликов · {timeAgo(job.created_at)}
        </span>
        <button
          className={applied || isOwnJob ? "btn-ghost text-sm" : "btn-primary text-sm"}
          onClick={handleApply}
          disabled={loading || isOwnJob}
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Обработка...</>
          ) : isOwnJob ? (
            "Ваша вакансия"
          ) : applied ? (
            "✓ Отклик отправлен"
          ) : (
            "Откликнуться"
          )}
        </button>
      </div>
    </article>
  );
}
