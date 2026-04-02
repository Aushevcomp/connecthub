"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Image as ImageIcon, BarChart3, Send, X, Loader2, Plus, Minus } from "lucide-react";
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

  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDays, setPollDays] = useState(3);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setShowPoll(false); // Can't have both
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) setPollOptions([...pollOptions, ""]);
  };

  const removePollOption = (idx: number) => {
    if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const updatePollOption = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const togglePoll = () => {
    if (showPoll) {
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
    } else {
      setShowPoll(true);
      removeImage(); // Can't have both
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!isAuthenticated || !user) { openAuthModal(); return; }

    // Validate poll
    if (showPoll) {
      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length < 2) return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("posts-images").upload(fileName, imageFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("posts-images").getPublicUrl(fileName);
          imageUrl = urlData?.publicUrl || null;
        }
      }

      const tags = content.match(/#[\wа-яА-ЯёЁ]+/g)?.map((t) => t.slice(1)) || [];

      // Create post
      const { data: post, error } = await supabase.from("posts").insert({
        author_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        tags,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 0,
      }).select("id").single();

      if (error) throw error;

      // Create poll if enabled
      if (showPoll && post) {
        const validOptions = pollOptions.filter((o) => o.trim());
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + pollDays);

        const { data: poll, error: pollError } = await supabase.from("polls").insert({
          post_id: post.id,
          question: pollQuestion.trim() || content.trim(),
          ends_at: endsAt.toISOString(),
        }).select("id").single();

        if (!pollError && poll) {
          const optionInserts = validOptions.map((text) => ({
            poll_id: poll.id,
            text: text.trim(),
            votes_count: 0,
          }));
          await supabase.from("poll_options").insert(optionInserts);
        }
      }

      // Reset
      setContent("");
      removeImage();
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
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
          <Image
            src={imagePreview}
            alt="Preview"
            width={1200}
            height={800}
            unoptimized
            className="w-full max-h-[300px] object-cover"
          />
          <button onClick={removeImage}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Poll Builder */}
      {showPoll && (
        <div className="mt-3 p-4 rounded-xl border border-accent/30 bg-accent-soft/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-accent">Создать опрос</p>
            <button onClick={togglePoll} className="text-text-tertiary hover:text-red-400 transition-colors">
              <X size={16} />
            </button>
          </div>
          <input
            className="input-field mb-3 !text-sm"
            placeholder="Вопрос опроса (необязательно — возьмётся из поста)"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          <div className="space-y-2 mb-3">
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className="input-field flex-1 !text-sm"
                  placeholder={`Вариант ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updatePollOption(idx, e.target.value)}
                />
                {pollOptions.length > 2 && (
                  <button onClick={() => removePollOption(idx)}
                    className="w-10 h-10 rounded-button flex items-center justify-center text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            {pollOptions.length < 6 && (
              <button onClick={addPollOption}
                className="text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
                <Plus size={14} /> Добавить вариант
              </button>
            )}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>Длительность:</span>
              <select value={pollDays} onChange={(e) => setPollDays(Number(e.target.value))}
                className="bg-bg-tertiary border border-border rounded-button px-2 py-1 text-sm text-text-primary outline-none">
                <option value={1}>1 день</option>
                <option value={3}>3 дня</option>
                <option value={7}>7 дней</option>
                <option value={14}>14 дней</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex gap-1">
          <button onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-text-secondary hover:bg-bg-tertiary hover:text-accent transition-all" title="Фото">
            <ImageIcon size={18} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button onClick={togglePoll}
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${showPoll ? "bg-accent-soft text-accent" : "text-text-secondary hover:bg-bg-tertiary hover:text-accent"}`} title="Опрос">
            <BarChart3 size={18} />
          </button>
        </div>
        <button className="btn-primary text-sm" onClick={handleSubmit}
          disabled={loading || !content.trim()}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {loading ? "..." : "Опубликовать"}
        </button>
      </div>
    </div>
  );
}
