"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, BarChart3, Briefcase, Send, X, Loader2 } from "lucide-react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    if (!isAuthenticated || !user) { openAuthModal(); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      let imageUrl: string | null = null;

      // Upload image if exists
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("posts-images")
          .upload(fileName, imageFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("posts-images")
            .getPublicUrl(fileName);
          imageUrl = urlData?.publicUrl || null;
        } else {
          console.error("Image upload error:", uploadError);
        }
      }

      // Extract hashtags
      const tags = content.match(/#[\wа-яА-ЯёЁ]+/g)?.map((t) => t.slice(1)) || [];

      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        tags,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 0,
      });

      if (error) throw error;

      setContent("");
      removeImage();
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

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative mt-3 rounded-xl overflow-hidden border border-border">
          <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-text-secondary hover:bg-bg-tertiary hover:text-accent transition-all"
            title="Добавить фото"
          >
            <ImageIcon size={18} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
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
          disabled={loading || (!content.trim() && !imageFile)}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {loading ? "Публикация..." : "Опубликовать"}
        </button>
      </div>
    </div>
  );
}
