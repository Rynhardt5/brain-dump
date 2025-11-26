# 🔌 Pusher Testing Guide

## How to Verify Pusher is Working

### Step 1: Check Environment Variables

Make sure your `.env` file has these set:
```env
PUSHER_APP_ID=123456
PUSHER_SECRET=abc...
NEXT_PUBLIC_PUSHER_KEY=def...
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

**Important:** After adding these, restart your dev server!

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 2: Check Browser Console

1. Open your app in the browser
2. Open DevTools (F12 or Cmd+Option+I on Mac)
3. Go to the **Console** tab
4. Look for these messages when you load a brain dump page:

✅ **If Pusher is working:**
```
🔌 Pusher connection state: connecting
🔌 Pusher connection state: connected
✅ Pusher connected successfully!
✅ Subscribed to brain-dump channel: <brain-dump-id>
```

❌ **If Pusher is NOT configured:**
```
⚠️ Pusher not configured - real-time updates disabled
```

❌ **If credentials are wrong:**
```
❌ Pusher connection error: ...
```

### Step 3: Test Real-time Updates

**Multi-Window Test:**

1. Open the same brain dump in **two browser windows** side by side
2. In **Window 1**: Add a new item
3. In **Window 2**: The item should appear **instantly** (within 100ms)

**Console Messages to Look For:**

In Window 1 (where you add the item):
```
🆕 Real-time: New item received {id: "...", title: "..."}
```

In Window 2:
```
🆕 Real-time: New item received {id: "...", title: "..."}
```

**Vote Test:**

1. Keep both windows open
2. In **Window 1**: Vote on an item (click High/Medium/Low)
3. In **Window 2**: Watch the priority badge update **instantly**

Console should show:
```
🗳️ Real-time: Vote update received {id: "...", avgVotePriority: "2.5", voteCount: 2}
```

### Step 4: Check Pusher Dashboard

1. Go to https://dashboard.pusher.com/
2. Click on your "brain-dump" app
3. Click **"Debug Console"** in the left sidebar
4. You should see:
   - Connection events
   - Channel subscriptions
   - Messages being sent

**What to look for:**
- When you vote: See `vote-updated` event
- When you add item: See `item-created` event
- Active connections count should match your open tabs

### Step 5: Server Logs

Check your terminal where `npm run dev` is running:

When you vote or add items, you might see:
```
Real-time update failed (Pusher not configured): ...
```

If you see this, Pusher isn't working. Check:
1. Are environment variables set correctly?
2. Did you restart the dev server after adding credentials?
3. Are the credentials correct in Pusher dashboard?

## Troubleshooting

### Problem: Console shows "Pusher not configured"

**Solution:**
1. Check `.env` file has `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER`
2. Restart dev server: `npm run dev`
3. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R

### Problem: Console shows connection error

**Solution:**
1. Verify credentials in Pusher dashboard
2. Check that `NEXT_PUBLIC_PUSHER_KEY` matches your Pusher app key
3. Verify cluster is correct (e.g., `us2`, `eu`, `ap1`)

### Problem: Connection successful but no real-time updates

**Solution:**
1. Check server logs for errors
2. Verify `PUSHER_APP_ID` and `PUSHER_SECRET` are set (server-side)
3. Make sure you're testing in two separate windows, not tabs in the same window

### Problem: "Module not found: Can't resolve 'pusher-js'"

**Solution:**
```bash
npm install
```

Then restart dev server.

## Expected Performance

### Without Pusher (Disabled)
- ❌ No real-time sync
- ✅ Everything works, but need to refresh to see others' changes
- App functions normally

### With Pusher (Working)
- ✅ Changes appear instantly across all users (<100ms)
- ✅ Votes sync in real-time
- ✅ New items appear immediately
- ✅ Discord-like experience

## Quick Verification Checklist

- [ ] Environment variables set in `.env`
- [ ] Dev server restarted after adding credentials
- [ ] Browser console shows "Pusher connected successfully!"
- [ ] Multi-window test: Item appears in second window instantly
- [ ] Vote test: Priority updates in second window instantly
- [ ] Pusher dashboard shows active connections
- [ ] Pusher dashboard shows messages in Debug Console

## Free Tier Limits

Your Pusher free tier includes:
- ✅ 200,000 messages per day
- ✅ 100 concurrent connections
- ✅ Unlimited channels

**Typical usage:**
- 10 users × 50 actions/day = 500 messages/day
- Well within free tier! 🎉

## Need Help?

If Pusher still isn't working after following this guide:

1. Check Pusher dashboard for error messages
2. Look at Network tab in DevTools for failed requests
3. Check server terminal for error logs
4. Verify credentials are copied exactly (no extra spaces)

---

**Remember:** The app works fine WITHOUT Pusher! It just won't have real-time sync. So if you're having trouble, you can always set it up later and the app will continue to function normally.
