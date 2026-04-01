"use client";

import { useState, useEffect } from "react";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Post } from "@/types";

const TABS = [
  { key: "all", label: "Все" },
  { key: "companies", label: "Компании" },
  { key: "people", label: "Люди" },
  { key: "polls", label: "Опросы" },
] as const;

export function FeedPage() {
  const { feedTab, setFeedTab } = useAppStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*),
          poll:polls(*, options:poll_options(*))
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      let filtered = (data || []) as Post[];

      if (feedTab === "companies") {
        filtered = filtered.filter((p) => p.author?.account_type === "business");
      } else if (feedTab === "people") {
        filtered = filtered.filter((p) => p.author?.account_type === "user");
      } else if (feedTab === "polls") {
        filtered = filtered.filter((p) => p.poll && (p.poll as any).length > 0);
      }

      filtered = filtered.map((p) => ({
        ...p,
        poll: Array.isArray(p.poll) && p.poll.length > 0 ? p.poll[0] : undefined,
      }));

      setPosts(filtered);
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [feedTab]);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex gap-1 bg-bg-card border border-border rounded-card p-1 mb-5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFeedTab(key)}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-button text-sm font-medium transition-all",
              feedTab === key
                ? "bg-accent-soft text-accent font-semibold"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <PostComposer onPostCreated={fetchPosts} />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-bg-tertiary" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-bg-tertiary rounded mb-2" />
                  <div className="h-3 w-24 bg-bg-tertiary rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-bg-tertiary rounded mb-2" />
              <div className="h-4 w-3/4 bg-bg-tertiary rounded mb-2" />
              <div className="h-4 w-1/2 bg-bg-tertiary rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
          <div className="text-5xl mb-3 opacity-30">📭</div>
          <p>Пока нет постов в этой категории</p>
          <p className="text-sm mt-1">Будьте первым, кто напишет!</p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}