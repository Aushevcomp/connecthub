import type { Conversation } from "@/types";

export function buildConversationPairKey(userA: string, userB: string) {
  return [userA, userB].sort().join(":");
}

export function getConversationPartnerId(
  conversation: Pick<Conversation, "participant_one_id" | "participant_two_id">,
  userId: string
) {
  return conversation.participant_one_id === userId
    ? conversation.participant_two_id
    : conversation.participant_one_id;
}
