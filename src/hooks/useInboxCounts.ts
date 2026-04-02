"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface InboxCounts {
  messages: number;
  notifications: number;
  total: number;
}

export function useInboxCounts(userId?: string): InboxCounts {
  const [counts, setCounts] = useState<InboxCounts>({
    messages: 0,
    notifications: 0,
    total: 0,
  });
  const channelScopeRef = useRef(
    `scope-${Math.random().toString(36).slice(2, 10)}`
  );

  useEffect(() => {
    if (!userId) {
      setCounts({ messages: 0, notifications: 0, total: 0 });
      return;
    }

    const supabase = createClient();

    async function fetchCounts() {
      const [{ count: messageCount }, { count: notificationCount }] =
        await Promise.all([
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("recipient_id", userId)
            .eq("is_read", false),
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_read", false),
        ]);

      const nextMessages = messageCount || 0;
      const nextNotifications = notificationCount || 0;

      setCounts({
        messages: nextMessages,
        notifications: nextNotifications,
        total: nextMessages + nextNotifications,
      });
    }

    fetchCounts();

    const messagesChannel = supabase
      .channel(`inbox-messages-${userId}-${channelScopeRef.current}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        fetchCounts
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel(`inbox-notifications-${userId}-${channelScopeRef.current}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        fetchCounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [userId]);

  return counts;
}
