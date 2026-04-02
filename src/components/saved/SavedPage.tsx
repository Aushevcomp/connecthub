"use client";

import { useEffect, useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { enrichPosts } from "@/lib/posts";
import type { Post } from "@/types";

type SavedPostRow = {
  post: Post | null;
};

export function SavedPage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedPosts = async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("post_saves")
        .select("post:posts(*, author:profiles!posts_author_id_fkey(*))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const basePosts = ((data || []) as SavedPostRow[])
        .map((row) => row.post)
        .filter((post): post is Post => Boolean(post));

      const enrichedPosts = await enrichPosts(supabase, basePosts, user.id);
      setPosts(enrichedPosts);
    } catch (err) {
      console.error("Fetch saved posts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || !user) {
    return (
      <div className="card p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto mb-4">
          <Bookmark size={28} />
        </div>
        <h2 className="text-xl font-extrabold mb-2">Сохранённое</h2>
        <p className="text-sm text-text-secondary mb-5">
          Войдите, чтобы собирать посты в личную подборку и возвращаться к ним позже.
        </p>
        <button className="btn-primary mx-auto" onClick={() => openAuthModal("login")}>
          Войти
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold mb-1">Сохранённое</h2>
        <p className="text-sm text-text-secondary">
          {posts.length > 0
            ? `${posts.length} постов в вашей подборке`
            : "Ваши закладки будут собираться здесь"}
        </p>
      </div>

      {loading ? (
        <div className="card p-8 text-center">
          <Loader2 size={24} className="animate-spin text-accent mx-auto" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-tertiary text-text-tertiary flex items-center justify-center mx-auto mb-4">
            <Bookmark size={28} />
          </div>
          <p className="font-semibold mb-1">Пока ничего не сохранено</p>
          <p className="text-sm text-text-secondary">
            Нажимайте «Сохранить» под постами, чтобы собрать полезный контент в одном месте.
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onSavedChange={(saved) => {
              if (!saved) {
                setPosts((prev) => prev.filter((item) => item.id !== post.id));
              }
            }}
          />
        ))
      )}
    </div>
  );
}
