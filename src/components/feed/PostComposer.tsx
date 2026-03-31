"use client";

import { useState } from "react";
import { Image, BarChart3, Briefcase, Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface PostComposerProps {
  onPostCreated?: () => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setLoading(true);
    try {
      // Extract hashtags as tags
      const tags = content.match(/#[\wа-яА-ЯёЁ]+/g)?.map((t) => t.slice(1)) || [];

      const { error } = await supabase.from("posts").insert({
        author_id: user!.id,
        content: content.trim(),
        tags,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 0,
      });

      if (error) throw error;

      setContent("");
      onPostCreated?.();
    } catch (err) {
      console.error("Post error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 mb-5">
      <div className="flex gap-3">
        <Avatar name={user?.name || "?"} size={40} src={user?.avatar_url} isCompany={user?.account_type === "business"} />
        <textarea
          rows={2}
          placeholder={isAuthenticated ? "Чем поделитесь?" : "Войдите, чтобы написать пост..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => !isAuthenticated && openAuthModal()}
          className="flex-1 bg-transparent border-none text-text-primary text-[15px] resize-none outline-none min-h-[48px] leading-relaxed font-sans placeholder:text-text-tertiary"
        />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex gap-1">
          <button className="w-9 h-9 rounded-[10px] flex items-center justify-center text-text-secondary hover:bg-bg-tertiary hover:text-accent transition-all" title="Изображение">
            <Image size={18} />
          </button>
          <button className="w-9 h-9 rounded-[10px] flex items-center justify-center text-text-secondary hover:bg-bg-tertiary hover:text-accent transition-all" title="Опрос">
            <BarChart3 size={18} />
          </button>
          <button className="w-9 h-9 rounded-[10px] flex items-center justify-center text-text-secondary hover:bg-bg-tertiary hover:text-accent transition-all" title="Вакансия">
            <Briefcase size={18} />
          </button>
        </div>
        <button
          className="btn-primary text-sm"
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
        >
          <Send size={14} />
          {loading ? "..." : "Опубликовать"}
        </button>
      </div>
    </div>
  );
}
