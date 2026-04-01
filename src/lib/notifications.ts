import { createClient } from "@/lib/supabase/client";

export async function sendNotification({
  userId,
  actorId,
  type,
  message,
  link,
}: {
  userId: string;
  actorId: string;
  type: string;
  message: string;
  link?: string;
}) {
  // Don't notify yourself
  if (userId === actorId) return;

  const supabase = createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    actor_id: actorId,
    type,
    message,
    link: link || null,
    is_read: false,
  });
}
