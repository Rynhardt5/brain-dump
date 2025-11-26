-- Performance Optimization Migration
-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_brain_dump_items_brain_dump_id ON brain_dump_items(brain_dump_id);
CREATE INDEX IF NOT EXISTS idx_brain_dump_items_created_at ON brain_dump_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_votes_item_id ON item_votes(item_id);
CREATE INDEX IF NOT EXISTS idx_item_votes_user_id ON item_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_item_id ON comments(item_id);
CREATE INDEX IF NOT EXISTS idx_brain_dump_collaborators_brain_dump_id ON brain_dump_collaborators(brain_dump_id);
CREATE INDEX IF NOT EXISTS idx_brain_dump_collaborators_user_id ON brain_dump_collaborators(user_id);

-- Add denormalized fields to brain_dump_items for faster queries
ALTER TABLE brain_dump_items ADD COLUMN IF NOT EXISTS avg_vote_priority NUMERIC DEFAULT 2;
ALTER TABLE brain_dump_items ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;
ALTER TABLE brain_dump_items ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Populate denormalized fields with existing data
UPDATE brain_dump_items
SET 
  avg_vote_priority = COALESCE(
    (SELECT AVG(priority) FROM item_votes WHERE item_votes.item_id = brain_dump_items.id),
    2
  ),
  vote_count = COALESCE(
    (SELECT COUNT(DISTINCT user_id) FROM item_votes WHERE item_votes.item_id = brain_dump_items.id),
    0
  ),
  comment_count = COALESCE(
    (SELECT COUNT(*) FROM comments WHERE comments.item_id = brain_dump_items.id),
    0
  );

-- Create function to update vote counts automatically
CREATE OR REPLACE FUNCTION update_item_vote_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE brain_dump_items
  SET 
    avg_vote_priority = (
      SELECT COALESCE(AVG(priority), 2)
      FROM item_votes
      WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
    ),
    vote_count = (
      SELECT COUNT(DISTINCT user_id)
      FROM item_votes
      WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
    )
  WHERE id = COALESCE(NEW.item_id, OLD.item_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote updates
DROP TRIGGER IF EXISTS trigger_update_item_vote_stats ON item_votes;
CREATE TRIGGER trigger_update_item_vote_stats
AFTER INSERT OR UPDATE OR DELETE ON item_votes
FOR EACH ROW
EXECUTE FUNCTION update_item_vote_stats();

-- Create function to update comment counts automatically
CREATE OR REPLACE FUNCTION update_item_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE brain_dump_items
  SET comment_count = (
    SELECT COUNT(*)
    FROM comments
    WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
  )
  WHERE id = COALESCE(NEW.item_id, OLD.item_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment updates
DROP TRIGGER IF EXISTS trigger_update_item_comment_count ON comments;
CREATE TRIGGER trigger_update_item_comment_count
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_item_comment_count();
