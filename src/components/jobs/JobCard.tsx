"use client";

import { useState } from "react";
import { MapPin, DollarSign, Clock, Flame } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Job } from "@/types";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const [applied, setApplied] = useState(job.user_applied || false);
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleApply = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setApplied(!applied);
  };

  const salaryStr = job.salary_min && job.salary_max
    ? `${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} ${job.salary_currency}`
    : "По договорённости";

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
          {job.applicants_count} откликов · {timeAgo(job.created_at)}
        </span>
        <button
          className={applied ? "btn-ghost text-sm" : "btn-primary text-sm"}
          onClick={handleApply}
        >
          {applied ? "✓ Отклик отправлен" : "Откликнуться"}
        </button>
      </div>
    </article>
  );
}
