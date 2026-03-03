-- Support tickets for escalation from the AI Support Assistant
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT NOT NULL CHECK (category IN ('refund', 'cancellation', 'billing', 'technical', 'other')),
  conversation_transcript JSONB NOT NULL DEFAULT '[]',
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Parents can view their own tickets
CREATE POLICY "Parents see own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = parent_id);

-- Service role has full access (for agent tool handlers)
CREATE POLICY "Service role full access"
  ON support_tickets FOR ALL
  USING (true)
  WITH CHECK (true);
