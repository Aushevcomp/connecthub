"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import {
  buildConversationPairKey,
  getConversationPartnerId,
} from "@/lib/messages";
import { cn, timeAgo } from "@/lib/utils";
import type { Conversation, DirectMessage, Profile } from "@/types";

function sortConversations(items: Conversation[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.last_message_at).getTime() -
      new Date(left.last_message_at).getTime()
  );
}

export function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openAuthModal } = useAuth();
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  const selectedConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ||
      null,
    [activeConversationId, conversations]
  );

  const selectedPartner = selectedConversation?.partner || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setLoadingConversations(false);
      return;
    }

    const userId = user.id;
    const conversationParam = searchParams.get("conversation");
    const targetUserParam = searchParams.get("user");

    async function fetchConversations(preferredConversationId?: string | null) {
      const { data: conversationRows, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) {
        console.error("Fetch conversations error:", error);
        return [];
      }

      const rows = (conversationRows || []) as Conversation[];
      if (rows.length === 0) {
        setConversations([]);
        setActiveConversationId(preferredConversationId || null);
        return [];
      }

      const partnerIds = rows.map((conversation) =>
        getConversationPartnerId(conversation, userId)
      );

      const [
        { data: partnerRows, error: partnerError },
        { data: unreadRows, error: unreadError },
      ] = await Promise.all([
        supabase.from("profiles").select("*").in("id", partnerIds),
        supabase
          .from("messages")
          .select("conversation_id")
          .eq("recipient_id", userId)
          .eq("is_read", false)
          .in(
            "conversation_id",
            rows.map((conversation) => conversation.id)
          ),
      ]);

      if (partnerError) {
        console.error("Fetch conversation partners error:", partnerError);
      }
      if (unreadError) {
        console.error("Fetch unread messages error:", unreadError);
      }

      const partnerMap = new Map(
        ((partnerRows || []) as Profile[]).map((profile) => [profile.id, profile])
      );

      const unreadCountMap = new Map<string, number>();
      (unreadRows || []).forEach((row: any) => {
        unreadCountMap.set(
          row.conversation_id,
          (unreadCountMap.get(row.conversation_id) || 0) + 1
        );
      });

      const enriched = sortConversations(
        rows.map((conversation) => ({
          ...conversation,
          partner: partnerMap.get(
            getConversationPartnerId(conversation, userId)
          ),
          unread_count: unreadCountMap.get(conversation.id) || 0,
        }))
      );

      setConversations(enriched);

      const fallbackConversationId = enriched[0]?.id || null;
      const nextConversationId =
        preferredConversationId &&
        enriched.some((conversation) => conversation.id === preferredConversationId)
          ? preferredConversationId
          : activeConversationId &&
              enriched.some((conversation) => conversation.id === activeConversationId)
            ? activeConversationId
            : fallbackConversationId;

      setActiveConversationId(nextConversationId);
      return enriched;
    }

    async function ensureConversation(targetUserId: string) {
      if (!targetUserId || targetUserId === userId) return null;

      const pairKey = buildConversationPairKey(userId, targetUserId);
      const { data: existingConversation, error: existingError } = await supabase
        .from("conversations")
        .select("*")
        .eq("pair_key", pairKey)
        .maybeSingle();

      if (existingError) {
        console.error("Fetch existing conversation error:", existingError);
      }

      if (existingConversation) {
        return (existingConversation as Conversation).id;
      }

      const { data: createdConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          participant_one_id: userId,
          participant_two_id: targetUserId,
        })
        .select("*")
        .single();

      if (createError) {
        console.error("Create conversation error:", createError);

        const { data: fallbackConversation } = await supabase
          .from("conversations")
          .select("*")
          .eq("pair_key", pairKey)
          .maybeSingle();

        return (fallbackConversation as Conversation | null)?.id || null;
      }

      return (createdConversation as Conversation).id;
    }

    async function bootstrap() {
      setLoadingConversations(true);
      setBootstrapping(true);

      let preferredConversationId = conversationParam;
      if (targetUserParam) {
        preferredConversationId = await ensureConversation(targetUserParam);
      }

      await fetchConversations(preferredConversationId);

      setBootstrapping(false);
      setLoadingConversations(false);
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, searchParams.toString()]);

  useEffect(() => {
    if (!user || !activeConversationId) {
      setMessages([]);
      return;
    }

    const userId = user.id;

    async function fetchMessages() {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Fetch messages error:", error);
        setLoadingMessages(false);
        return;
      }

      const nextMessages = (data || []) as DirectMessage[];
      setMessages(nextMessages);

      const unreadIds = nextMessages
        .filter(
          (message) => message.recipient_id === userId && message.is_read === false
        )
        .map((message) => message.id);

      if (unreadIds.length > 0) {
        const { error: markReadError } = await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);

        if (markReadError) {
          console.error("Mark messages as read error:", markReadError);
        } else {
          setMessages((current) =>
            current.map((message) =>
              unreadIds.includes(message.id) ? { ...message, is_read: true } : message
            )
          );
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === activeConversationId
                ? { ...conversation, unread_count: 0 }
                : conversation
            )
          );
        }
      } else {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === activeConversationId
              ? { ...conversation, unread_count: 0 }
              : conversation
          )
        );
      }

      setLoadingMessages(false);
    }

    fetchMessages();
  }, [activeConversationId, supabase, user]);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    const channel = supabase
      .channel(`incoming-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          const incomingMessage = payload.new as DirectMessage;

          setConversations((current) => {
            const conversationExists = current.some(
              (conversation) => conversation.id === incomingMessage.conversation_id
            );

            if (!conversationExists) {
              return current;
            }

            return sortConversations(
              current.map((conversation) => {
                if (conversation.id !== incomingMessage.conversation_id) {
                  return conversation;
                }

                return {
                  ...conversation,
                  last_message_text: incomingMessage.content,
                  last_message_sender_id: incomingMessage.sender_id,
                  last_message_at: incomingMessage.created_at,
                  unread_count:
                    conversation.id === activeConversationId
                      ? 0
                      : (conversation.unread_count || 0) + 1,
                };
              })
            );
          });

          if (incomingMessage.conversation_id === activeConversationId) {
            const { error: markReadError } = await supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", incomingMessage.id);

            if (markReadError) {
              console.error("Realtime mark read error:", markReadError);
              return;
            }

            setMessages((current) => [
              ...current,
              { ...incomingMessage, is_read: true },
            ]);
            return;
          }

          const hasConversation = conversations.some(
            (conversation) => conversation.id === incomingMessage.conversation_id
          );

          if (!hasConversation) {
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, conversations, router, supabase, user]);

  const handleSend = async () => {
    if (!user || !selectedConversation || !draft.trim() || sending) return;

    const content = draft.trim();
    const recipientId = getConversationPartnerId(selectedConversation, user.id);

    setSending(true);
    setDraft("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        recipient_id: recipientId,
        content,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Send message error:", error);
      setDraft(content);
      setSending(false);
      return;
    }

    const createdMessage = data as DirectMessage;

    setMessages((current) => [...current, createdMessage]);
    setConversations((current) =>
      sortConversations(
        current.map((conversation) =>
          conversation.id === selectedConversation.id
            ? {
                ...conversation,
                last_message_text: createdMessage.content,
                last_message_sender_id: user.id,
                last_message_at: createdMessage.created_at,
              }
            : conversation
        )
      )
    );

    setSending(false);
  };

  if (!user) {
    return (
      <div className="card p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
          <MessageSquare size={28} />
        </div>
        <h1 className="text-2xl font-extrabold mt-5">Сообщения доступны после входа</h1>
        <p className="text-text-secondary mt-3 max-w-md mx-auto">
          Войди в аккаунт, чтобы начать диалоги со специалистами, командами и бизнес-аккаунтами.
        </p>
        <button
          type="button"
          className="btn-primary mt-6 mx-auto"
          onClick={() => openAuthModal("login")}
        >
          Войти
        </button>
      </div>
    );
  }

  const showMobileThread = Boolean(selectedConversation);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold">Сообщения</h1>
        <p className="text-sm text-text-secondary mt-1">
          Личные диалоги с людьми, стартапами и бизнес-аккаунтами.
        </p>
      </div>

      <div className="hidden lg:grid lg:grid-cols-[320px_1fr] gap-6 min-h-[720px]">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm text-text-secondary">
              {loadingConversations
                ? "Загружаем диалоги..."
                : `${conversations.length} ${conversations.length === 1 ? "диалог" : "диалогов"}`}
            </p>
          </div>

          <div className="max-h-[calc(720px-73px)] overflow-y-auto">
            {loadingConversations || bootstrapping ? (
              <div className="p-6 text-center text-text-secondary">
                <Loader2 size={22} className="animate-spin mx-auto mb-3 text-accent" />
                Загружаем сообщения...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-text-secondary">
                <MessageSquare size={28} className="mx-auto mb-3 opacity-40" />
                Пока нет диалогов. Открой чей-то профиль и нажми «Написать».
              </div>
            ) : (
              conversations.map((conversation) => {
                const partner = conversation.partner;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={cn(
                      "w-full px-4 py-3 border-b border-border text-left transition-all",
                      conversation.id === activeConversationId
                        ? "bg-accent/8"
                        : "hover:bg-bg-hover"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={partner?.name || "?"}
                        size={44}
                        src={partner?.avatar_url || null}
                        isCompany={partner?.account_type === "business"}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold truncate">
                            {partner?.name || "Диалог"}
                          </p>
                          <span className="text-[11px] text-text-tertiary flex-shrink-0">
                            {timeAgo(conversation.last_message_at)}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary truncate mt-1">
                          {partner?.role || partner?.company || "ConnectHub"}
                        </p>
                        <p className="text-sm text-text-secondary truncate mt-2">
                          {conversation.last_message_text || "Диалог открыт. Можно написать первым."}
                        </p>
                      </div>
                      {(conversation.unread_count || 0) > 0 && (
                        <span className="min-w-[20px] h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="card overflow-hidden flex flex-col">
          {selectedConversation && selectedPartner ? (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={selectedPartner.name}
                    size={44}
                    src={selectedPartner.avatar_url}
                    isCompany={selectedPartner.account_type === "business"}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{selectedPartner.name}</p>
                    <p className="text-sm text-text-secondary truncate">
                      {selectedPartner.role ||
                        selectedPartner.company ||
                        (selectedPartner.account_type === "business"
                          ? "Бизнес-аккаунт"
                          : "Пользователь")}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/profile/${selectedPartner.id}`}
                  className="btn-ghost text-sm"
                >
                  Профиль
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-bg-primary/35">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-text-secondary">
                    <Loader2 size={22} className="animate-spin text-accent" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary">
                    <MessageSquare size={28} className="mb-3 opacity-40" />
                    Начните разговор. Первое сообщение часто запускает полезный контакт.
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender_id === user.id;

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isMine ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[78%] rounded-[22px] px-4 py-3 shadow-sm",
                            isMine
                              ? "bg-accent text-white rounded-br-md"
                              : "bg-bg-secondary border border-border rounded-bl-md"
                          )}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p
                            className={cn(
                              "text-[11px] mt-2",
                              isMine ? "text-white/70" : "text-text-tertiary"
                            )}
                          >
                            {timeAgo(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex items-end gap-3">
                  <textarea
                    rows={1}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Напишите сообщение..."
                    className="input-field !h-auto min-h-[48px] max-h-36 py-3 resize-none"
                  />
                  <button
                    type="button"
                    className="btn-primary h-12 px-4"
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 text-text-secondary">
              <MessageSquare size={34} className="mb-4 opacity-40" />
              Выберите диалог слева или начните его из чужого профиля.
            </div>
          )}
        </div>
      </div>

      <div className="lg:hidden">
        {showMobileThread && selectedConversation && selectedPartner ? (
          <div className="card overflow-hidden min-h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <button
                type="button"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all"
                onClick={() => setActiveConversationId(null)}
              >
                <ArrowLeft size={18} />
              </button>
              <Avatar
                name={selectedPartner.name}
                size={40}
                src={selectedPartner.avatar_url}
                isCompany={selectedPartner.account_type === "business"}
              />
              <div className="min-w-0">
                <p className="font-semibold truncate">{selectedPartner.name}</p>
                <p className="text-xs text-text-secondary truncate">
                  {selectedPartner.role ||
                    selectedPartner.company ||
                    (selectedPartner.account_type === "business"
                      ? "Бизнес-аккаунт"
                      : "Пользователь")}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-bg-primary/35">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-text-secondary">
                  <Loader2 size={22} className="animate-spin text-accent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary">
                  <MessageSquare size={28} className="mb-3 opacity-40" />
                  Начните разговор первым сообщением.
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === user.id;

                  return (
                    <div
                      key={message.id}
                      className={cn("flex", isMine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[82%] rounded-[22px] px-4 py-3 shadow-sm",
                          isMine
                            ? "bg-accent text-white rounded-br-md"
                            : "bg-bg-secondary border border-border rounded-bl-md"
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={cn(
                            "text-[11px] mt-2",
                            isMine ? "text-white/70" : "text-text-tertiary"
                          )}
                        >
                          {timeAgo(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-end gap-3">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Напишите сообщение..."
                  className="input-field !h-auto min-h-[48px] max-h-32 py-3 resize-none"
                />
                <button
                  type="button"
                  className="btn-primary h-12 px-4"
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {loadingConversations || bootstrapping ? (
              <div className="p-10 text-center text-text-secondary">
                <Loader2 size={22} className="animate-spin mx-auto mb-3 text-accent" />
                Загружаем диалоги...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center text-text-secondary">
                <MessageSquare size={28} className="mx-auto mb-3 opacity-40" />
                Пока нет диалогов. Зайди в чей-то профиль и начни переписку.
              </div>
            ) : (
              conversations.map((conversation) => {
                const partner = conversation.partner;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className="w-full px-4 py-3 border-b border-border text-left hover:bg-bg-hover transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={partner?.name || "?"}
                        size={44}
                        src={partner?.avatar_url || null}
                        isCompany={partner?.account_type === "business"}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold truncate">
                            {partner?.name || "Диалог"}
                          </p>
                          <span className="text-[11px] text-text-tertiary">
                            {timeAgo(conversation.last_message_at)}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary truncate mt-1">
                          {partner?.role || partner?.company || "ConnectHub"}
                        </p>
                        <p className="text-sm text-text-secondary truncate mt-2">
                          {conversation.last_message_text || "Диалог открыт. Можно написать первым."}
                        </p>
                      </div>
                      {(conversation.unread_count || 0) > 0 && (
                        <span className="min-w-[20px] h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
