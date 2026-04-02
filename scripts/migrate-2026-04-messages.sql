-- ConnectHub messaging migration for existing Supabase projects.
-- Run this after migrate-2026-04.sql if your database already exists.

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_two_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pair_key TEXT NOT NULL UNIQUE,
  last_message_text TEXT,
  last_message_sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (participant_one_id <> participant_two_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_one
  ON conversations(participant_one_id);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_two
  ON conversations(participant_two_id);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread
  ON messages(recipient_id, is_read);

CREATE OR REPLACE FUNCTION public.prepare_conversation_pair()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_participant UUID;
  second_participant UUID;
BEGIN
  IF NEW.participant_one_id::text <= NEW.participant_two_id::text THEN
    first_participant := NEW.participant_one_id;
    second_participant := NEW.participant_two_id;
  ELSE
    first_participant := NEW.participant_two_id;
    second_participant := NEW.participant_one_id;
  END IF;

  NEW.participant_one_id := first_participant;
  NEW.participant_two_id := second_participant;
  NEW.pair_key := first_participant::text || ':' || second_participant::text;
  NEW.updated_at := NOW();
  NEW.last_message_at := COALESCE(NEW.last_message_at, NOW());

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET last_message_text = NEW.content,
      last_message_sender_id = NEW.sender_id,
      last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_message_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM OLD.recipient_id THEN
    RAISE EXCEPTION 'Only recipients can update messages';
  END IF;

  IF NEW.content IS DISTINCT FROM OLD.content
    OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
    OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
    OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
  THEN
    RAISE EXCEPTION 'Only read status can be updated';
  END IF;

  IF NEW.is_read = FALSE THEN
    RAISE EXCEPTION 'Messages cannot be marked unread again';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_conversation_pair_before_write ON conversations;
CREATE TRIGGER prepare_conversation_pair_before_write
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION public.prepare_conversation_pair();

DROP TRIGGER IF EXISTS touch_conversation_on_message_insert ON messages;
CREATE TRIGGER touch_conversation_on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_on_message();

DROP TRIGGER IF EXISTS guard_message_update_before_write ON messages;
CREATE TRIGGER guard_message_update_before_write
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_message_update();

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants see own conversations" ON conversations;
CREATE POLICY "Participants see own conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = participant_one_id
    OR auth.uid() = participant_two_id
  );

DROP POLICY IF EXISTS "Participants can create conversations" ON conversations;
CREATE POLICY "Participants can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = participant_one_id
    OR auth.uid() = participant_two_id
  );

DROP POLICY IF EXISTS "Participants see own messages" ON messages;
CREATE POLICY "Participants see own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
  );

DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (
          (conversations.participant_one_id = messages.sender_id AND conversations.participant_two_id = messages.recipient_id)
          OR (conversations.participant_two_id = messages.sender_id AND conversations.participant_one_id = messages.recipient_id)
        )
    )
  );

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON messages;
CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);
