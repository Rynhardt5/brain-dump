-- Fix comment counts for existing items
-- Run this to sync comment counts for items that were created before the optimization

UPDATE brain_dump_items
SET comment_count = (
  SELECT COUNT(*)
  FROM comments
  WHERE comments.item_id = brain_dump_items.id
)
WHERE comment_count IS NULL OR comment_count != (
  SELECT COUNT(*)
  FROM comments
  WHERE comments.item_id = brain_dump_items.id
);

-- Show the results
SELECT 
  id, 
  title, 
  comment_count,
  (SELECT COUNT(*) FROM comments WHERE comments.item_id = brain_dump_items.id) as actual_count
FROM brain_dump_items
WHERE comment_count != (SELECT COUNT(*) FROM comments WHERE comments.item_id = brain_dump_items.id);
