"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Eye, Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo, formatNumber, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Post, Poll } from "@/types";

// ─── Poll Component ───
function PollCard({ poll }: { poll: Poll }) {
  const [voted, setVoted] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes_count + (voted === o.id ? 1 : 0), 0);

  const handleVote = async (optionId: string) => {
    if (voted || !user) return;
    setVoted(optionId);

    try {
      await supabase.from("poll_votes").insert({
        poll_id: poll.id,
        option_id: optionId,
        user_id: user.id,
      });
      await supabase.rpc("increment_poll_votes", { option_id: optionId });
    } catch (err) {
      console.error("Vote error:", err);
    }
  };

  return (
    <div className="mb-3.5">
      {poll.options.map((opt) => {
        const votes = opt.votes_count + (voted === opt.id ? 1 : 0);
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

        return (
          <div
            key={opt.id}
            onClick={() => handleVote(opt.id)}
            className={cn(
              "relative px-4 py-3 rounded-button border mb-2 cursor-pointer overflow-hidden transition-all",
              voted === opt.id ? "border-accent" : "border-border hover:border-accent"
            )}
          >
            {voted && (
              <div
                className="absolute top-0 left-0 h-full bg-accent-soft rounded-button transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative z-10 flex justify-between items-center">
              <span className="text-sm font-medium">{opt.text}</span>
              {voted && <span className="text-sm font-semibold text-accent">{pct}%</span>}
            </div>
          </div>
        );
      })}
      <div className="flex gap-3 text-xs text-text-tertiary">
        <span>{totalVotes} голосов</span>
        <span>Осталось {new Date(poll.ends_at) > new Date() ? "2 дня" : "завершён"}</span>
      </div>
    </div>
  );
}

// ─── Post Card ───
interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.user_saved || false);
  const { user } = useAuth();
  const supabase = createClient();

  const toggleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

    if (!user) return;

    try {
      if (newLiked) {
        await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      } else {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      }
      await supabase.from("posts").update({ likes_count: newLiked ? likeCount + 1 : likeCount - 1 }).eq("id", post.id);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const author = post.author;

  return (
    <article className="card card-hover p-5 mb-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3.5">
        <Avatar
          name={author?.name || "User"}
          size={44}
          src={author?.avatar_url}
          isCompany={author?.account_type === "business"}
        />
        <div className="flex-1">
          <p className="text-[15px] font-semibold flex items-center gap-1.5">
            {author?.name || "Пользователь"}
            {author?.is_verified && (
              <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <Check size={10} strokeWidth={3} />
              </span>
            )}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {author?.role || author?.company || ""}
          </p>
        </div>
        <span className="text-xs text-text-tertiary">{timeAgo(post.created_at)}</span>
      </div>

      {/* Content */}
      <div className="text-[14.5px] leading-relaxed whitespace-pre-wrap mb-3.5">
        {post.content}
      </div>

      {/* Poll */}
      {post.poll && <PollCard poll={post.poll} />}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3.5">
          {post.tags.map((t) => (
            <span key={t} className="tag">#{t}</span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-text-tertiary pb-3 border-b border-border mb-2.5">
        <span className="flex items-center gap-1"><Heart size={12} /> {formatNumber(likeCount)}</span>
        <span className="flex items-center gap-1"><MessageCircle size={12} /> {formatNumber(post.comments_count)}</span>
        <span className="flex items-center gap-1"><Eye size={12} /> {formatNumber(post.views_count)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={toggleLike}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-button text-sm font-medium transition-all",
            liked ? "text-red-400 hover:bg-red-500/10" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          )}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          Нравится
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-button text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
          <MessageCircle size={16} />
          Комментарий
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-button text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
          <Share2 size={16} />
          Поделиться
        </button>
        <button
          onClick={() => setSaved(!saved)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-button text-sm font-medium transition-all",
            saved ? "text-accent hover:bg-accent-soft" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          )}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
          {saved ? "Сохранено" : "Сохранить"}
        </button>
      </div>
    </article>
  );
}
