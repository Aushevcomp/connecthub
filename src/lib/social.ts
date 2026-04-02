import type { SupabaseClient } from "@supabase/supabase-js";

export async function syncProfileFollowCounts(
  supabase: SupabaseClient,
  profileId: string
) {
  const [followersResponse, followingResponse] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", profileId),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);

  if (followersResponse.error) throw followersResponse.error;
  if (followingResponse.error) throw followingResponse.error;

  const followersCount = followersResponse.count || 0;
  const followingCount = followingResponse.count || 0;

  const { error } = await supabase
    .from("profiles")
    .update({
      followers_count: followersCount,
      following_count: followingCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) throw error;

  return { followersCount, followingCount };
}

export async function syncJobApplicantsCount(
  supabase: SupabaseClient,
  jobId: string
) {
  const { count, error: countError } = await supabase
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId);

  if (countError) throw countError;

  const applicantsCount = count || 0;

  const { error } = await supabase
    .from("jobs")
    .update({ applicants_count: applicantsCount })
    .eq("id", jobId);

  if (error) throw error;

  return applicantsCount;
}
