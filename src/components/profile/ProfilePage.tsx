"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { enrichPosts } from "@/lib/posts";
import { useAppStore } from "@/lib/store";
import { timeAgo } from "@/lib/utils";
import {
  MapPin, Users, Link as LinkIcon, Calendar,
  Pencil, X, Camera, Plus, Save, Loader2, Settings
} from "lucide-react";
import type { Post } from "@/types";
import { PostCard } from "@/components/feed/PostCard";

// ─── Edit Profile Modal ───
function EditProfileModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    role: "",
    company: "",
    location: "",
    website: "",
    skills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (user && isOpen) {
      setForm({
        name: user.name || "",
        bio: user.bio || "",
        role: user.role || "",
        company: user.company || "",
        location: user.location || "",
        website: user.website || "",
        skills: user.skills || [],
      });
      setAvatarPreview(user.avatar_url);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        await supabase
          .from("profiles")
          .update({ avatar_url: urlData.publicUrl })
          .eq("id", user.id);
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm({ ...form, skills: [...form.skills, skill] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: form.name,
          bio: form.bio || null,
          role: form.role || null,
          company: form.company || null,
          location: form.location || null,
          website: form.website || null,
          skills: form.skills,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      onSaved();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold">Редактировать профиль</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] bg-bg-tertiary text-text-secondary flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar
              name={form.name || "?"}
              size={72}
              src={avatarPreview}
              isCompany={user.account_type === "business"}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent-hover transition-all shadow-lg"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <p className="font-semibold">{form.name || "Ваше имя"}</p>
            <p className="text-sm text-text-secondary">Нажмите на камеру чтобы сменить фото</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-text-secondary mb-1.5 block">
              {user.account_type === "business" ? "Название компании" : "Имя и фамилия"}
            </label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-text-secondary mb-1.5 block">О себе</label>
            <textarea
              className="input-field !h-auto py-2.5"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Расскажите о себе..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">
                {user.account_type === "business" ? "Индустрия" : "Должность"}
              </label>
              <input
                className="input-field"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder={user.account_type === "business" ? "IT / FinTech" : "Frontend Developer"}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">
                {user.account_type === "business" ? "Размер" : "Компания"}
              </label>
              <input
                className="input-field"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder={user.account_type === "business" ? "11-50 сотрудников" : "Название компании"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Локация</label>
              <input
                className="input-field"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Москва"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Сайт</label>
              <input
                className="input-field"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="text-sm font-semibold text-text-secondary mb-1.5 block">
              {user.account_type === "business" ? "Технологии" : "Навыки"}
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {form.skills.map((skill) => (
                <span
                  key={skill}
                  className="tag-tech flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => removeSkill(skill)}
                >
                  {skill} <X size={12} />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="React, TypeScript, Figma..."
              />
              <button
                onClick={addSkill}
                className="w-11 h-11 rounded-button bg-bg-tertiary flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent-soft transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3 mt-6">
          <button className="btn-ghost flex-1 justify-center" onClick={onClose}>
            Отмена
          </button>
          <button
            className="btn-primary flex-1 justify-center"
            onClick={handleSave}
            disabled={loading || !form.name.trim()}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Сохранение...</>
            ) : (
              <><Save size={16} /> Сохранить</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page ───
export function ProfilePage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { setUser } = useAppStore();
  const supabase = createClient();
  const [editOpen, setEditOpen] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) setUser(data as any);
  };

  const fetchMyPosts = async () => {
    if (!user) return;
    setLoadingPosts(true);
    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*)")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const enriched = await enrichPosts(supabase, (data || []) as Post[], user.id);
    setMyPosts(enriched);
    setLoadingPosts(false);
  };

  useEffect(() => {
    if (user) fetchMyPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3 opacity-30">👤</div>
        <p className="text-text-secondary mb-4">Войдите, чтобы увидеть свой профиль</p>
        <button className="btn-primary" onClick={() => openAuthModal("login")}>Войти</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up overflow-x-hidden">
      {/* Banner */}
      <div
        className="h-36 sm:h-44 rounded-card relative"
        style={{
          background: user.banner_url
            ? `url(${user.banner_url}) center/cover`
            : "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
        }}
      >
        <div className="absolute -bottom-10 left-4 sm:-bottom-12 sm:left-6 border-[3px] sm:border-4 border-bg-primary rounded-full">
          <Avatar name={user.name} size={96} src={user.avatar_url} isCompany={user.account_type === "business"} />
        </div>
      </div>

      {/* Info */}
      <div className="mt-14 sm:mt-16 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold flex flex-wrap items-center gap-2">
              {user.name}
              {user.is_verified && (
                <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
              {user.is_admin && (
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">ADMIN</span>
              )}
            </h1>
            <p className="text-text-secondary mt-1">
              {user.role || (user.account_type === "business" ? "Бизнес-аккаунт" : "Специалист")}
              {user.company ? ` @ ${user.company}` : ""}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-text-tertiary min-w-0">
              {user.location && (
                <span className="flex items-center gap-1 min-w-0"><MapPin size={14} className="flex-shrink-0" /> {user.location}</span>
              )}
              <span className="flex items-center gap-1 min-w-0">
                <Users size={14} className="flex-shrink-0" /> {user.followers_count} связей
              </span>
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 min-w-0 break-all hover:text-accent transition-colors">
                  <LinkIcon size={14} className="flex-shrink-0" /> {user.website.replace(/https?:\/\//, "")}
                </a>
              )}
              <span className="flex items-center gap-1 min-w-0">
                <Calendar size={14} className="flex-shrink-0" /> {timeAgo(user.created_at)}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 md:w-auto">
            <button className="btn-ghost text-sm flex-1 justify-center sm:flex-none" onClick={() => setEditOpen(true)}>
              <Pencil size={14} /> Редактировать
            </button>
            <Link href="/settings" className="btn-ghost text-sm flex-1 justify-center sm:flex-none">
              <Settings size={14} /> Настройки
            </Link>
          </div>
        </div>

        {user.bio ? (
          <p className="mt-4 text-sm text-text-secondary leading-relaxed break-words">{user.bio}</p>
        ) : (
          <button onClick={() => setEditOpen(true)}
            className="mt-4 text-sm text-text-tertiary hover:text-accent transition-colors cursor-pointer">
            + Добавить описание профиля
          </button>
        )}

        {user.skills?.length > 0 ? (
          <div className="flex gap-2 flex-wrap mt-4">
            {user.skills.map((s) => <span key={s} className="tag-tech">{s}</span>)}
          </div>
        ) : (
          <button onClick={() => setEditOpen(true)}
            className="mt-3 text-sm text-text-tertiary hover:text-accent transition-colors cursor-pointer">
            + Добавить навыки
          </button>
        )}
      </div>

      {/* My Posts */}
      <div>
        <h2 className="text-lg font-bold mb-4">
          Мои публикации {myPosts.length > 0 && `(${myPosts.length})`}
        </h2>
        {loadingPosts ? (
          <div className="card p-8 text-center">
            <Loader2 size={24} className="animate-spin text-accent mx-auto" />
          </div>
        ) : myPosts.length > 0 ? (
          myPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3 opacity-30">📝</div>
            <p className="text-text-secondary">Ваши посты появятся здесь</p>
            <p className="text-sm text-text-tertiary mt-1">Напишите первый пост в ленте!</p>
          </div>
        )}
      </div>

      <EditProfileModal isOpen={editOpen} onClose={() => setEditOpen(false)} onSaved={refreshProfile} />
    </div>
  );
}
