"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { InboxTabs } from "@/components/inbox/InboxTabs";
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

function getDialogLabel(count: number) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) return "диалог";
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return "диалога";
  }

  return "диалогов";
}

function getPartnerSubtitle(partner?: Profile | null) {
  if (!partner) return "ConnectHub";

  return (
    partner.role ||
    partner.company ||
    (partner.account_type === "business" ? "Бизнес-аккаунт" : "Специалист")
  );
}

function getConversationPreview(conversation: Conversation) {
  return (
    conversation.last_message_text ||
    "Диалог открыт. Первое сообщение часто запускает нужный контакт."
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[24px] border border-border bg-bg-secondary/70 p-4 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-bg-tertiary" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-32 bg-bg-tertiary rounded-full" />
              <div className="h-3 w-24 bg-bg-tertiary rounded-full mt-2" />
              <div className="h-3 w-full bg-bg-tertiary rounded-full mt-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const partner = conversation.partner;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all duration-200",
        isActive
          ? "border-accent/20 bg-accent/10 shadow-[0_12px_40px_rgba(99,102,241,0.16)]"
          : "border-transparent bg-bg-secondary/65 hover:border-border hover:bg-bg-hover/80"
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-5 bottom-5 w-1 rounded-r-full transition-all",
          isActive ? "bg-accent" : "bg-transparent group-hover:bg-accent/40"
        )}
      />
      <div className="flex items-start gap-3">
        <Avatar
          name={partner?.name || "?"}
          size={46}
          src={partner?.avatar_url || null}
          isCompany={partner?.account_type === "business"}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {partner?.name || "Новый диалог"}
              </p>
              <p className="text-xs text-text-secondary truncate mt-1">
                {getPartnerSubtitle(partner)}
              </p>
            </div>
            <span className="text-[11px] text-text-tertiary flex-shrink-0">
              {timeAgo(conversation.last_message_at)}
            </span>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed truncate mt-3">
            {getConversationPreview(conversation)}
          </p>
        </div>

        {(conversation.unread_count || 0) > 0 && (
          <span className="min-w-[22px] h-[22px] rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center px-1.5 flex-shrink-0 shadow-[0_8px_18px_rgba(99,102,241,0.35)]">
            {conversation.unread_count}
          </span>
        )}
      </div>
    </button>
  );
}

function ThreadTimeline({
  messages,
  loading,
  currentUserId,
  bottomRef,
  emptyCopy,
}: {
  messages: DirectMessage[];
  loading: boolean;
  currentUserId: string;
  bottomRef: RefObject<HTMLDivElement | null>;
  emptyCopy: string;
}) {
  return (
    <div className="relative flex-1 overflow-y-auto px-4 md:px-6 py-5 md:py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(6,214,160,0.09),transparent_28%)]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.28) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative space-y-3">
        {loading ? (
          <div className="h-full min-h-[420px] flex items-center justify-center text-text-secondary">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="min-h-[420px] flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-[22px] bg-bg-secondary/90 border border-border text-accent flex items-center justify-center shadow-[0_18px_60px_rgba(99,102,241,0.12)]">
              <MessageSquare size={28} />
            </div>
            <p className="text-xl font-bold mt-5">Начните разговор</p>
            <p className="text-text-secondary mt-2 max-w-md leading-relaxed">
              {emptyCopy}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === currentUserId;

            return (
              <div
                key={message.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[min(78%,42rem)] rounded-[26px] px-4 py-3.5 shadow-[0_10px_32px_rgba(15,23,42,0.08)]",
                    isMine
                      ? "text-white rounded-br-lg bg-[linear-gradient(135deg,#6366f1,#7c3aed)]"
                      : "rounded-bl-lg border border-border bg-bg-secondary/92 backdrop-blur-sm"
                  )}
                >
                  <p className="text-[15px] leading-6 whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div
                    className={cn(
                      "mt-2 flex items-center gap-2 text-[11px]",
                      isMine ? "text-white/70" : "text-text-tertiary"
                    )}
                  >
                    <span>{timeAgo(message.created_at)}</span>
                    {isMine && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/45" />
                        <span>{message.is_read ? "Прочитано" : "Отправлено"}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MessageComposer({
  draft,
  setDraft,
  handleSend,
  sending,
}: {
  draft: string;
  setDraft: (value: string) => void;
  handleSend: () => void;
  sending: boolean;
}) {
  return (
    <div className="border-t border-border bg-bg-secondary/80 p-3 md:p-4">
      <div className="rounded-[26px] border border-border bg-bg-primary/75 backdrop-blur-sm p-2.5 pl-4 flex items-end gap-3 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
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
          className="flex-1 bg-transparent text-sm md:text-[15px] leading-6 text-text-primary placeholder:text-text-tertiary outline-none resize-none min-h-[48px] max-h-36 py-2"
        />
        <button
          type="button"
          className="w-12 h-12 rounded-[18px] flex items-center justify-center text-white disabled:opacity-60 shadow-[0_18px_40px_rgba(99,102,241,0.35)] bg-[linear-gradient(135deg,#6366f1,#7c3aed)]"
          onClick={handleSend}
          disabled={!draft.trim() || sending}
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}

function ThreadPane({
  selectedConversation,
  selectedPartner,
  messages,
  loadingMessages,
  currentUserId,
  draft,
  setDraft,
  handleSend,
  sending,
  bottomRef,
  mobile = false,
  onBack,
}: {
  selectedConversation: Conversation | null;
  selectedPartner: Profile | null;
  messages: DirectMessage[];
  loadingMessages: boolean;
  currentUserId: string;
  draft: string;
  setDraft: (value: string) => void;
  handleSend: () => void;
  sending: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
  mobile?: boolean;
  onBack?: () => void;
}) {
  if (!selectedConversation) {
    return (
      <div className="relative overflow-hidden rounded-[30px] border border-border bg-bg-secondary/90 min-h-[720px] flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(6,214,160,0.08),transparent_30%)]" />
        <div className="relative text-center px-8 max-w-lg">
          <div className="w-20 h-20 rounded-[26px] bg-bg-primary/90 border border-border text-accent flex items-center justify-center mx-auto shadow-[0_24px_60px_rgba(99,102,241,0.12)]">
            <MessageSquare size={34} />
          </div>
          <p className="text-2xl font-black mt-6">Выберите диалог</p>
          <p className="text-text-secondary leading-relaxed mt-3">
            Здесь будет полноценный inbox: обсуждения запусков, вакансий, партнёрств и любых полезных контактов из ConnectHub.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-primary/85 px-4 py-2 text-sm text-text-secondary">
            <Sparkles size={16} className="text-accent" />
            Начать можно прямо из любого профиля кнопкой «Написать»
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[30px] border border-border bg-bg-secondary/88 shadow-[0_20px_80px_rgba(15,23,42,0.08)] flex flex-col",
        mobile ? "min-h-[74vh]" : "min-h-[760px]"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_34%)] pointer-events-none" />

      <div className="relative border-b border-border px-4 md:px-6 py-4 bg-bg-secondary/94 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {mobile && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-10 h-10 rounded-[14px] flex items-center justify-center text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all flex-shrink-0"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <Avatar
              name={selectedPartner?.name || "?"}
              size={48}
              src={selectedPartner?.avatar_url || null}
              isCompany={selectedPartner?.account_type === "business"}
            />
            <div className="min-w-0">
              <p className="font-bold text-lg truncate">
                {selectedPartner?.name || "Диалог"}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-text-secondary truncate">
                  {getPartnerSubtitle(selectedPartner)}
                </span>
                <span className="hidden md:inline-flex items-center rounded-full border border-border bg-bg-primary/90 px-2.5 py-1 text-[11px] font-medium text-text-tertiary">
                  Личный диалог
                </span>
              </div>
            </div>
          </div>

          {selectedPartner && (
            <Link href={`/profile/${selectedPartner.id}`} className="btn-ghost text-sm">
              Профиль
            </Link>
          )}
        </div>
      </div>

      <ThreadTimeline
        messages={messages}
        loading={loadingMessages}
        currentUserId={currentUserId}
        bottomRef={bottomRef}
        emptyCopy="Первое сообщение лучше делать коротким и по делу: кто вы, чем полезны и зачем пишете."
      />

      <MessageComposer
        draft={draft}
        setDraft={setDraft}
        handleSend={handleSend}
        sending={sending}
      />
    </div>
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
  const [query, setQuery] = useState("");
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
  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + (conversation.unread_count || 0),
        0
      ),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const partner = conversation.partner;
      const haystack = [
        partner?.name,
        partner?.role,
        partner?.company,
        conversation.last_message_text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [conversations, query]);

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
      <div className="relative overflow-hidden rounded-[30px] border border-border bg-bg-secondary/90 p-8 md:p-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_32%)]" />
        <div className="relative">
          <div className="w-20 h-20 rounded-[26px] bg-bg-primary/90 border border-border text-accent flex items-center justify-center mx-auto shadow-[0_24px_60px_rgba(99,102,241,0.14)]">
            <MessageSquare size={34} />
          </div>
          <h1 className="text-3xl font-black mt-6">Сообщения доступны после входа</h1>
          <p className="text-text-secondary mt-3 max-w-xl mx-auto leading-relaxed">
            Личные диалоги нужны, чтобы быстро переводить интерес из профиля, вакансии или контента в живой контакт.
          </p>
          <button
            type="button"
            className="btn-primary mt-7 mx-auto"
            onClick={() => openAuthModal("login")}
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  const showMobileThread = Boolean(selectedConversation);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <InboxTabs />

      <section className="relative overflow-hidden rounded-[30px] border border-border bg-bg-secondary/88 p-5 md:p-7 shadow-[0_22px_90px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(6,214,160,0.10),transparent_28%)]" />
        <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-primary/85 px-4 py-2 text-sm text-text-secondary">
              <Sparkles size={16} className="text-accent" />
              Inbox для людей, стартапов и бизнес-аккаунтов
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-5">
              Сообщения, которые ощущаются как рабочий центр контактов.
            </h1>
            <p className="text-text-secondary text-base md:text-lg leading-relaxed mt-3 max-w-2xl">
              Здесь начинается всё, что нельзя закончить лайком: найм, партнёрство, интро, фидбэк по продукту и нормальный деловой диалог.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 xl:min-w-[460px]">
            <div className="rounded-[22px] border border-border bg-bg-primary/82 backdrop-blur-sm p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                Диалоги
              </p>
              <p className="text-2xl font-black mt-2">{conversations.length}</p>
              <p className="text-sm text-text-secondary mt-1">
                Активных {getDialogLabel(conversations.length)}
              </p>
            </div>
            <div className="rounded-[22px] border border-border bg-bg-primary/82 backdrop-blur-sm p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                Непрочитано
              </p>
              <p className="text-2xl font-black mt-2">{totalUnread}</p>
              <p className="text-sm text-text-secondary mt-1">
                Сообщений ждут ответа
              </p>
            </div>
            <div className="rounded-[22px] border border-border bg-bg-primary/82 backdrop-blur-sm p-4 col-span-2 md:col-span-3 xl:col-span-1">
              <p className="text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
                Сейчас открыт
              </p>
              {selectedPartner ? (
                <div className="flex items-start gap-3 mt-3">
                  <Avatar
                    name={selectedPartner.name}
                    size={42}
                    src={selectedPartner.avatar_url}
                    isCompany={selectedPartner.account_type === "business"}
                  />
                  <div className="min-w-0">
                    <p className="text-base font-bold leading-tight break-words">
                      {selectedPartner.name}
                    </p>
                    <p className="text-sm text-text-secondary mt-1 break-words">
                      {getPartnerSubtitle(selectedPartner)}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base font-bold mt-2">Никто не выбран</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Выберите диалог слева
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="hidden lg:grid lg:grid-cols-[360px_minmax(0,1fr)] gap-5">
        <aside className="relative overflow-hidden rounded-[30px] border border-border bg-bg-secondary/88 shadow-[0_20px_80px_rgba(15,23,42,0.06)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_34%)] pointer-events-none" />
          <div className="relative px-5 py-5 border-b border-border">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xl font-black">Диалоги</p>
                <p className="text-sm text-text-secondary mt-1">
                  {loadingConversations
                    ? "Собираем переписки..."
                    : `${conversations.length} ${getDialogLabel(conversations.length)}`}
                </p>
              </div>
              {totalUnread > 0 && (
                <span className="rounded-full bg-accent/12 text-accent text-xs font-bold px-3 py-1.5">
                  {totalUnread} новых
                </span>
              )}
            </div>

            <label className="relative block">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
              />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по людям и сообщениям"
                className="w-full h-12 rounded-[18px] border border-border bg-bg-primary/75 pl-11 pr-4 text-sm outline-none transition-all focus:border-accent/30 focus:bg-bg-primary"
              />
            </label>
          </div>

          <div className="relative p-2 max-h-[760px] overflow-y-auto">
            {loadingConversations || bootstrapping ? (
              <ConversationSkeleton />
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <MessageSquare size={28} className="mx-auto mb-3 opacity-40" />
                Пока нет диалогов. Открой чей-то профиль и нажми «Написать».
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <Search size={28} className="mx-auto mb-3 opacity-40" />
                По этому запросу ничего не найдено.
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredConversations.map((conversation) => (
                  <ConversationListItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onClick={() => setActiveConversationId(conversation.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <ThreadPane
          selectedConversation={selectedConversation}
          selectedPartner={selectedPartner}
          messages={messages}
          loadingMessages={loadingMessages}
          currentUserId={user.id}
          draft={draft}
          setDraft={setDraft}
          handleSend={handleSend}
          sending={sending}
          bottomRef={bottomRef}
        />
      </div>

      <div className="lg:hidden space-y-4">
        {showMobileThread ? (
          <ThreadPane
            selectedConversation={selectedConversation}
            selectedPartner={selectedPartner}
            messages={messages}
            loadingMessages={loadingMessages}
            currentUserId={user.id}
            draft={draft}
            setDraft={setDraft}
            handleSend={handleSend}
            sending={sending}
            bottomRef={bottomRef}
            mobile
            onBack={() => setActiveConversationId(null)}
          />
        ) : (
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-bg-secondary/88 shadow-[0_18px_70px_rgba(15,23,42,0.06)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_34%)] pointer-events-none" />
            <div className="relative px-4 py-4 border-b border-border">
              <p className="text-xl font-black">Диалоги</p>
              <p className="text-sm text-text-secondary mt-1">
                {loadingConversations
                  ? "Собираем переписки..."
                  : `${conversations.length} ${getDialogLabel(conversations.length)}`}
              </p>
              <label className="relative block mt-4">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Поиск по диалогам"
                  className="w-full h-12 rounded-[18px] border border-border bg-bg-primary/75 pl-11 pr-4 text-sm outline-none transition-all focus:border-accent/30 focus:bg-bg-primary"
                />
              </label>
            </div>

            <div className="relative p-2">
              {loadingConversations || bootstrapping ? (
                <ConversationSkeleton />
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <MessageSquare size={28} className="mx-auto mb-3 opacity-40" />
                  Пока нет диалогов. Зайди в чей-то профиль и начни переписку.
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <Search size={28} className="mx-auto mb-3 opacity-40" />
                  По этому запросу ничего не найдено.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredConversations.map((conversation) => (
                    <ConversationListItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onClick={() => setActiveConversationId(conversation.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
