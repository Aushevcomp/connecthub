"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Eye, Check, Send, Loader2, ChevronDown, ChevronUp, Trash2, MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo, formatNumber, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendNotification } from "@/lib/notifications";
import type { Post, Poll, Comment } from "@/types";

// ─── Poll ───
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
    } catch (err) { console.error("Vote error:", err); }
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
        <span>{new Date(poll.ends_at) > new Date() ? `Осталось ${Math.ceil((new Date(poll.ends_at).getTime() - Date.now()) / 86400000)} дн.` : "Завершён"}</span>
      </div>
    </div>
  );
}

// ─── Comment ───
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
function CommentsSection({
  postId,
  commentsCount,
  postAuthorId,
  onCountChange,
}: {
  postId: string;
  commentsCount: number;
  postAuthorId: string;
  onCountChange?: (count: number) => void;
}) {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [totalCount, setTotalCount] = useState(commentsCount);

  useEffect(() => {
    setTotalCount(commentsCount);
  }, [commentsCount]);

  const fetchComments = async () => {
    if (expanded && comments.length > 0) { setExpanded(false); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.from("comments")
        .select("*, author:profiles!comments_author_id_fkey(*)")
        .eq("post_id", postId).order("created_at", { ascending: true }).limit(50);
      setComments((data || []) as Comment[]);
      setExpanded(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    if (!user) { openAuthModal(); return; }
    setSending(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("comments").insert({
        post_id: postId, author_id: user.id, content: newComment.trim(), likes_count: 0,
      }).select("*, author:profiles!comments_author_id_fkey(*)").single();
      if (error) throw error;
      const nextCount = totalCount + 1;
      if (data) {
        setComments([...comments, data as Comment]);
        setTotalCount(nextCount);
        onCountChange?.(nextCount);
        setExpanded(true);
      }
      await supabase.from("posts").update({ comments_count: nextCount }).eq("id", postId);
      sendNotification({ userId: postAuthorId, actorId: user.id, type: "comment", message: "прокомментировал(а) ваш пост", link: "/" });
      setNewComment("");
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  return (
    <div>
      {totalCount > 0 && (
        <button onClick={fetchComments}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors mt-1 mb-1">
          {loading ? <Loader2 size={14} className="animate-spin" /> : expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Скрыть комментарии" : `Показать комментарии (${totalCount})`}
        </button>
      )}
      {expanded && comments.length > 0 && (
        <div className="border-t border-border mt-2 pt-1">
          {comments.map((c) => <CommentItem key={c.id} comment={c} />)}
        </div>
      )}
      <div className="flex gap-2.5 mt-2 pt-2 border-t border-border">
        <Avatar name={user?.name || "?"} size={32} src={user?.avatar_url} isCompany={user?.account_type === "business"} />
        <div className="flex-1 flex gap-2">
          <input className="flex-1 h-9 rounded-full bg-bg-tertiary border border-border text-sm text-text-primary px-3.5 outline-none transition-all placeholder:text-text-tertiary focus:border-border-focus font-sans"
            placeholder={user ? "Написать комментарий..." : "Войдите, чтобы комментировать"}
            value={newComment} onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => !user && openAuthModal()}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} />
          <button onClick={handleSubmit} disabled={sending || !newComment.trim()}
            className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0",
              newComment.trim() ? "bg-accent text-white hover:bg-accent-hover" : "bg-bg-tertiary text-text-tertiary")}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ───
export function PostCard({
  post,
  onDeleted,
  onSavedChange,
}: {
  post: Post;
  onDeleted?: () => void;
  onSavedChange?: (saved: boolean) => void;
}) {
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.user_saved || false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [viewCount, setViewCount] = useState(post.views_count);
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    setLiked(post.user_liked || false);
    setLikeCount(post.likes_count);
    setSaved(post.user_saved || false);
    setCommentCount(post.comments_count);
    setViewCount(post.views_count);
  }, [post.user_liked, post.likes_count, post.user_saved, post.comments_count, post.views_count]);

  // Increment view count on mount
  useEffect(() => {
    const supabase = createClient();
    const nextViewCount = (post.views_count || 0) + 1;
    setViewCount(nextViewCount);
    supabase.from("posts").update({ views_count: nextViewCount }).eq("id", post.id).then(() => {});
    // We only want to register a view once per mounted card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

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
        if (post.author_id) sendNotification({ userId: post.author_id, actorId: user.id, type: "like", message: "оценил(а) ваш пост", link: "/" });
      }
      else { await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id); }
      const { count } = await supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", post.id);
      const realCount = count || 0;
      setLikeCount(realCount);
      await supabase.from("posts").update({ likes_count: realCount }).eq("id", post.id);
    } catch { setLiked(!newLiked); setLikeCount(newLiked ? likeCount - 1 : likeCount + 1); }
    finally { setLikeLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить этот пост?")) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      await supabase.from("posts").delete().eq("id", post.id);
      onDeleted?.();
    } catch (err) { console.error("Delete error:", err); }
    finally { setDeleting(false); setShowMenu(false); }
  };

  const toggleSave = async () => {
    if (!user) { openAuthModal(); return; }
    if (saveLoading) return;

    setSaveLoading(true);
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      const supabase = createClient();
      if (nextSaved) {
        const { error } = await supabase.from("post_saves").insert({
          post_id: post.id,
          user_id: user.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_saves")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
        if (error) throw error;
      }
      onSavedChange?.(nextSaved);
    } catch (err) {
      console.error("Save error:", err);
      setSaved(!nextSaved);
    } finally {
      setSaveLoading(false);
    }
  };

  const canDelete = user && (user.id === post.author_id || user.is_admin);
  const author = post.author;
  const imageUrl = (post as any).image_url;

  return (
    <article className={cn("card card-hover p-4 sm:p-5 mb-4 animate-fade-in-up overflow-hidden", deleting && "opacity-50 pointer-events-none")}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3.5">
        <Avatar name={author?.name || "User"} size={44} src={author?.avatar_url} isCompany={author?.account_type === "business"} />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold flex items-center gap-1.5 min-w-0">
            {author?.name || "Пользователь"}
            {author?.is_verified && (
              <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <Check size={10} strokeWidth={3} />
              </span>
            )}
          </p>
          <p className="text-xs text-text-secondary mt-0.5 truncate">{author?.role || author?.company || ""}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-text-tertiary whitespace-nowrap">{timeAgo(post.created_at)}</span>
          {canDelete && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-all">
                <MoreHorizontal size={16} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-9 z-20 bg-bg-secondary border border-border rounded-xl shadow-lg py-1 min-w-[160px] animate-scale-in">
                    <button onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} /> Удалить пост
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words mb-3.5">{post.content}</div>

      {/* Image */}
      {imageUrl && (
        <div className="mb-3.5 rounded-xl overflow-hidden border border-border">
          <Image
            src={imageUrl}
            alt=""
            width={1200}
            height={800}
            unoptimized
            className="w-full max-h-[500px] object-cover"
          />
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-tertiary pb-3 border-b border-border mb-2.5">
        <span className="flex items-center gap-1"><Heart size={12} /> {formatNumber(likeCount)}</span>
        <span className="flex items-center gap-1"><MessageCircle size={12} /> {formatNumber(commentCount)}</span>
        <span className="flex items-center gap-1"><Eye size={12} /> {formatNumber(viewCount)}</span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
        <button onClick={toggleLike}
          className={cn("min-w-0 flex items-center justify-center gap-1.5 py-2 rounded-button text-xs sm:text-sm font-medium transition-all",
            liked ? "text-red-400 hover:bg-red-500/10" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary")}>
          <Heart size={16} className="flex-shrink-0" fill={liked ? "currentColor" : "none"} />
          <span className="truncate">Нравится</span>
        </button>
        <button className="min-w-0 flex items-center justify-center gap-1.5 py-2 rounded-button text-xs sm:text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
          <MessageCircle size={16} className="flex-shrink-0" />
          <span className="truncate">Комментарий</span>
        </button>
        <button className="min-w-0 flex items-center justify-center gap-1.5 py-2 rounded-button text-xs sm:text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
          <Share2 size={16} className="flex-shrink-0" />
          <span className="truncate">Поделиться</span>
        </button>
        <button onClick={toggleSave}
          className={cn("min-w-0 flex items-center justify-center gap-1.5 py-2 rounded-button text-xs sm:text-sm font-medium transition-all",
            saved ? "text-accent hover:bg-accent-soft" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary")}
          disabled={saveLoading}>
          <Bookmark size={16} className="flex-shrink-0" fill={saved ? "currentColor" : "none"} />
          <span className="truncate">{saved ? "Сохранено" : "Сохранить"}</span>
        </button>
      </div>

      <CommentsSection
        postId={post.id}
        commentsCount={commentCount}
        postAuthorId={post.author_id}
        onCountChange={setCommentCount}
      />
    </article>
  );
}
