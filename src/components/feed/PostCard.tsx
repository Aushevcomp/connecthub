"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Eye, Check, Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo, formatNumber, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Post, Poll, Comment } from "@/types";

// ─── Poll Component ───
function PollCard({ poll }: { poll: Poll }) {
  const [voted, setVoted] = useState<string | null>(null);
  const { user } = useAuth();

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes_count + (voted === o.id ? 1 : 0), 0);

  const handleVote = async (optionId: string) => {
    if (voted || !user) return;
    setVoted(optionId);
    try {
      const supabase = createClient();
      await supabase.from("poll_votes").insert({ poll_id: poll.id, option_id: optionId, user_id: user.id });
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
          <div key={opt.id} onClick={() => handleVote(opt.id)}
            className={cn("relative px-4 py-3 rounded-button border mb-2 cursor-pointer overflow-hidden transition-all",
              voted === opt.id ? "border-accent" : "border-border hover:border-accent")}>
            {voted && <div className="absolute top-0 left-0 h-full bg-accent-soft rounded-button transition-all duration-700" style={{ width: `${pct}%` }} />}
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

// ─── Comment Item ───
function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-2.5 py-3">
      <Avatar name={comment.author?.name || "?"} size={32} src={comment.author?.avatar_url} isCompany={comment.author?.account_type === "business"} />
      <div className="flex-1 min-w-0">
        <div className="bg-bg-tertiary rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold">{comment.author?.name || "Пользователь"}</span>
            {comment.author?.is_verified && (
              <span className="w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            )}
            <span className="text-[11px] text-text-tertiary">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Comments Section ───
function CommentsSection({ postId, commentsCount }: { postId: string; commentsCount: number }) {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [totalCount, setTotalCount] = useState(commentsCount);

  const fetchComments = async () => {
    if (expanded && comments.length > 0) {
      setExpanded(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("comments")
        .select("*, author:profiles!comments_author_id_fkey(*)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .limit(50);
      setComments((data || []) as Comment[]);
      setExpanded(true);
    } catch (err) {
      console.error("Fetch comments error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    if (!user) { openAuthModal(); return; }

    setSending(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment.trim(),
          likes_count: 0,
        })
        .select("*, author:profiles!comments_author_id_fkey(*)")
        .single();

      if (error) throw error;

      if (data) {
        setComments([...comments, data as Comment]);
        setTotalCount(totalCount + 1);
        setExpanded(true);
      }

      // Update post comments count
      await supabase
        .from("posts")
        .update({ comments_count: totalCount + 1 })
        .eq("id", postId);

      setNewComment("");
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* Toggle comments */}
      {totalCount > 0 && (
        <button
          onClick={fetchComments}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors mt-1 mb-1"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : expanded ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
          {expanded ? "Скрыть комментарии" : `Показать комментарии (${totalCount})`}
        </button>
      )}

      {/* Comments list */}
      {expanded && comments.length > 0 && (
        <div className="border-t border-border mt-2 pt-1">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
      )}

      {/* Comment input */}
      <div className="flex gap-2.5 mt-2 pt-2 border-t border-border">
        <Avatar name={user?.name || "?"} size={32} src={user?.avatar_url} isCompany={user?.account_type === "business"} />
        <div className="flex-1 flex gap-2">
          <input
            className="flex-1 h-9 rounded-full bg-bg-tertiary border border-border text-sm text-text-primary px-3.5 outline-none transition-all placeholder:text-text-tertiary focus:border-border-focus font-sans"
            placeholder={user ? "Написать комментарий..." : "Войдите, чтобы комментировать"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => !user && openAuthModal()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={sending || !newComment.trim()}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0",
              newComment.trim()
                ? "bg-accent text-white hover:bg-accent-hover"
                : "bg-bg-tertiary text-text-tertiary"
            )}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
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
  const [likeLoading, setLikeLoading] = useState(false);
  const { user, openAuthModal } = useAuth();

  const toggleLike = async () => {
    if (!user) { openAuthModal(); return; }
    if (likeLoading) return;

    setLikeLoading(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

    try {
      const supabase = createClient();
      if (newLiked) {
        await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      } else {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      }
      const { count } = await supabase
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id);
      const realCount = count || 0;
      setLikeCount(realCount);
      await supabase.from("posts").update({ likes_count: realCount }).eq("id", post.id);
    } catch (err) {
      setLiked(!newLiked);
      setLikeCount(newLiked ? likeCount - 1 : likeCount + 1);
      console.error("Like error:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const author = post.author;
  const imageUrl = (post as any).image_url;

  return (
    <article className="card card-hover p-5 mb-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3.5">
        <Avatar name={author?.name || "User"} size={44} src={author?.avatar_url} isCompany={author?.account_type === "business"} />
        <div className="flex-1">
          <p className="text-[15px] font-semibold flex items-center gap-1.5">
            {author?.name || "Пользователь"}
            {author?.is_verified && (
              <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <Check size={10} strokeWidth={3} />
              </span>
            )}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">{author?.role || author?.company || ""}</p>
        </div>
        <span className="text-xs text-text-tertiary">{timeAgo(post.created_at)}</span>
      </div>

      {/* Content */}
      <div className="text-[14.5px] leading-relaxed whitespace-pre-wrap mb-3.5">{post.content}</div>

      {/* Image */}
      {imageUrl && (
        <div className="mb-3.5 rounded-xl overflow-hidden border border-border">
          <img src={imageUrl} alt="" className="w-full max-h-[500px] object-cover" />
        </div>
      )}

      {/* Poll */}
      {post.poll && <PollCard poll={post.poll} />}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3.5">
          {post.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
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
        <button onClick={toggleLike}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-button text-sm font-medium transition-all",
            liked ? "text-red-400 hover:bg-red-500/10" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary")}>
          <Heart size={16} fill={liked ? "currentColor" : "none"} /> Нравится
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-button text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
          <MessageCircle size={16} /> Комментарий
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-button text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
          <Share2 size={16} /> Поделиться
        </button>
        <button onClick={() => setSaved(!saved)}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-button text-sm font-medium transition-all",
            saved ? "text-accent hover:bg-accent-soft" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary")}>
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Сохранено" : "Сохранить"}
        </button>
      </div>

      {/* Comments */}
      <CommentsSection postId={post.id} commentsCount={post.comments_count} />
    </article>
  );
}
