import type { SupabaseClient } from "@supabase/supabase-js";
import type { Post } from "@/types";

type PostFlagRow = {
  post_id: string;
};

export async function enrichPosts(
  supabase: SupabaseClient,
  posts: Post[],
  userId?: string | null
) {
  if (posts.length === 0) return posts;

  const postIds = posts.map((post) => post.id);

  const [pollsResponse, likesResponse, savesResponse] = await Promise.all([
    supabase
      .from("polls")
      .select("*, options:poll_options(*)")
      .in("post_id", postIds),
    userId
      ? supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as PostFlagRow[], error: null }),
    userId
      ? supabase
          .from("post_saves")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as PostFlagRow[], error: null }),
  ]);

  if (pollsResponse.error) throw pollsResponse.error;
  if (likesResponse.error) throw likesResponse.error;
  if (savesResponse.error) throw savesResponse.error;

  const pollMap = new Map(
    (pollsResponse.data || []).map((poll: any) => [poll.post_id, poll])
  );
  const likedSet = new Set((likesResponse.data || []).map((like) => like.post_id));
  const savedSet = new Set((savesResponse.data || []).map((save) => save.post_id));

  return posts.map((post) => ({
    ...post,
    poll: pollMap.get(post.id) || undefined,
    user_liked: likedSet.has(post.id),
    user_saved: savedSet.has(post.id),
  }));
}
