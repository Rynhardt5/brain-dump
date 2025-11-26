-- Add checklist items table for subtasks
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES brain_dump_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  created_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_checklist_items_item_id ON checklist_items(item_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_position ON checklist_items(item_id, position);
