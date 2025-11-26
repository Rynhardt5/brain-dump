# Comment Count Fix

## Issue
Comment counts weren't displaying correctly on items in the list because the denormalized `commentCount` field wasn't being updated when comments were added or deleted.

## What Was Fixed

### 1. Add Comment Route (`/api/items/[id]/comments`)
- Now manually updates `commentCount` after adding a comment
- Counts all comments for the item and updates the field

### 2. Delete Comment Route (`/api/comments/[id]`)
- Now manually updates `commentCount` after deleting a comment
- Recalculates the count and updates the item

## How to Fix Existing Data

If you have items with incorrect comment counts from before this fix, run this SQL:

```sql
UPDATE brain_dump_items
SET comment_count = (
  SELECT COUNT(*)
  FROM comments
  WHERE comments.item_id = brain_dump_items.id
);
```

Or use the provided script:
```bash
psql $DATABASE_URL -f scripts/fix-comment-counts.sql
```

## Testing

1. **Add a comment** to an item
   - The comment count badge should increment immediately
   
2. **Delete a comment** from an item
   - The comment count badge should decrement immediately

3. **Check the list view**
   - Comment counts should match the actual number of comments

## How It Works Now

### When Adding a Comment:
```
1. Insert comment into database
2. Count all comments for that item
3. Update brain_dump_items.comment_count
4. Return the new comment
```

### When Deleting a Comment:
```
1. Delete comment from database
2. Count remaining comments for that item
3. Update brain_dump_items.comment_count
4. Return success
```

This ensures comment counts are always accurate, even if database triggers aren't set up yet!

## Status
✅ **Fixed** - Comment counts now update correctly when adding or deleting comments
