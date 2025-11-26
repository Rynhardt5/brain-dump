# 📝 Expandable Items Implementation Guide

## ✅ What's Already Done

1. ✅ Checklist backend API routes created
2. ✅ Database migration for checklist_items table
3. ✅ ChecklistSection component created
4. ✅ State variables added to brain dump page:
   - `expandedItems` - Track which items are expanded
   - `checklistItems` - Store checklist data
   - `loadingChecklists` - Track loading state
5. ✅ Helper functions added:
   - `toggleExpandItem()` - Expand/collapse items
   - `fetchChecklist()` - Load checklist data
   - `getChecklistProgress()` - Calculate completion percentage

## 🎯 What Needs to Be Added to the UI

### Step 1: Add Expand/Collapse Button

In the item card, after the title/badges section, add a button to expand/collapse:

```tsx
{/* Expand/Collapse Button - Add after title row */}
<button
  onClick={() => toggleExpandItem(item.id)}
  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 py-2 transition-colors"
>
  {expandedItems.has(item.id) ? (
    <ChevronUp className="w-4 h-4" />
  ) : (
    <ChevronDown className="w-4 h-4" />
  )}
  <span>
    {expandedItems.has(item.id) ? 'Hide' : 'Show'} details
  </span>
  
  {/* Show checklist progress indicator if exists */}
  {getChecklistProgress(item.id) && (
    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
      {getChecklistProgress(item.id)?.completed} of {getChecklistProgress(item.id)?.total}
    </span>
  )}
</button>
```

### Step 2: Add Expandable Section

Right after the expand/collapse button, add the expandable content:

```tsx
{/* Expandable Content */}
<AnimatePresence>
  {expandedItems.has(item.id) && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="pt-4 space-y-4 border-t mt-4">
        {/* Description (if exists and not already showing) */}
        {item.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        )}
        
        {/* Checklist Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <ListChecks className="w-4 h-4 mr-2" />
              Checklist
            </h4>
          </div>
          
          <ChecklistSection
            itemId={item.id}
            checklistItems={checklistItems[item.id] || []}
            onUpdate={() => fetchChecklist(item.id)}
            canEdit={userPermissions.canEdit}
          />
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

### Step 3: Add Progress Bar to Collapsed View (Optional)

Show a mini progress bar when collapsed if checklist exists:

```tsx
{/* Show progress bar when collapsed */}
{!expandedItems.has(item.id) && getChecklistProgress(item.id) && (
  <div className="mt-2">
    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
      <span className="flex items-center">
        <ListChecks className="w-3 h-3 mr-1" />
        {getChecklistProgress(item.id)?.completed} of {getChecklistProgress(item.id)?.total} subtasks
      </span>
      <span>{getChecklistProgress(item.id)?.percentage}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className="bg-blue-500 h-1.5 rounded-full transition-all"
        style={{ width: `${getChecklistProgress(item.id)?.percentage}%` }}
      />
    </div>
  </div>
)}
```

## 📍 Exact Location to Add

In `/src/app/brain-dump/[id]/page.tsx`, find this section (around line 1900-2000):

```tsx
<CardTitle className="text-base sm:text-lg...">
  {item.title}
</CardTitle>
{item.description && (
  <CardDescription className="mt-1 text-sm">
    {item.description}
  </CardDescription>
)}
```

**Add the expand button RIGHT AFTER the description** (or after the title if no description).

Then **add the expandable section** before the `<CardContent>` actions section (Mark Complete, Edit, Comments buttons).

## 🎨 Alternative: Simpler Implementation

If the above seems complex, here's a minimal version:

```tsx
{/* After title/description */}
<div className="mt-3 space-y-3">
  {/* Always show checklist if exists */}
  {checklistItems[item.id] && checklistItems[item.id].length > 0 && (
    <div className="bg-gray-50 rounded-lg p-3">
      <ChecklistSection
        itemId={item.id}
        checklistItems={checklistItems[item.id]}
        onUpdate={() => fetchChecklist(item.id)}
        canEdit={userPermissions.canEdit}
      />
    </div>
  )}
  
  {/* Add checklist button if none exists */}
  {userPermissions.canEdit && (!checklistItems[item.id] || checklistItems[item.id].length === 0) && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        setExpandedItems((prev) => new Set(prev).add(item.id))
        fetchChecklist(item.id)
      }}
      className="w-full text-gray-600"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add checklist
    </Button>
  )}
</div>
```

This version:
- Shows checklist always (no expand/collapse)
- Only loads when first needed
- Simpler to implement
- Still shows progress

## 🚀 Quick Start

### Option 1: Full Expandable (Recommended)
1. Add expand/collapse button after title
2. Add AnimatePresence expandable section
3. Add mini progress bar for collapsed view

### Option 2: Always Visible (Simpler)
1. Just add the checklist section after title
2. Auto-load on page load
3. No expand/collapse needed

### Option 3: I Can Do It!
Let me know and I'll make the exact edits to integrate everything.

## 🧪 Testing

After implementation:

1. **Run migration**:
   ```bash
   npm run db:push
   ```

2. **Test checklist**:
   - Open an item
   - Click "Show details" (or it auto-shows)
   - Click "Add subtask"
   - Add a few tasks
   - Check them off
   - See progress bar update

3. **Test expand/collapse**:
   - Click expand button
   - Section smoothly expands
   - Click collapse
   - Section smoothly collapses
   - Progress shows in collapsed view

## 📊 Expected Result

**Collapsed View:**
```
Finding a home [High] 1 vote
Created by Rynhardt Smith on Mon, Nov 24, 2025
[████░░] 67% (2 of 3 subtasks)
[Show details ▼]
```

**Expanded View:**
```
Finding a home [High] 1 vote
[Hide details ▲]
━━━━━━━━━━━━━━━━━━━━━━━
Description:
Need to find a new place to live...

Checklist:
2 of 3 completed (67%)
[████████░░░░░░░░]

✓ Research neighborhoods
✓ Set budget
○ Contact real estate agent

[+ Add subtask]
━━━━━━━━━━━━━━━━━━━━━━━
[✓ Mark Complete] [✎ Edit] [💬 Comments (8)]
```

Would you like me to make these edits for you?
