# 🚀 TalkSyra Quick Deployment Guide

## One-Minute Overview

✅ **What's Done:**
- Smart Instagram-like feed algorithm
- 5 API endpoints built
- Full database schema documented
- Security: anon key only, service role kept safe

⏳ **What's Next:**
- Deploy to Cloudflare Workers
- Test with APK
- Add personalization (Phase 2)

---

## Deploy in 3 Steps

### 1️⃣ Install & Login
```bash
npm install -g wrangler
wrangler login
```

### 2️⃣ Set Secrets
```bash
wrangler secret put SUPABASE_URL
# Paste: https://frmazzmzyychdfajnslt.supabase.co

wrangler secret put SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybWF6em16eXljaGRmYWpuc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzEwMDMsImV4cCI6MjA4NzM0NzAwM30.85x1WBkFX9bdpGw1T5-azJ03WsdzJ1r2EiiScxQnQl0
```

### 3️⃣ Deploy
```bash
wrangler deploy
# You get: https://talksyra-worker.workers.dev (your URL)
```

---

## Test Endpoints (Copy-Paste)

```bash
# 1. Smart Feed (ranked)
curl "https://your-worker.workers.dev/api/feed?type=reel&limit=5"

# 2. Trending (viral)
curl "https://your-worker.workers.dev/api/trending"

# 3. Top Creators
curl "https://your-worker.workers.dev/api/stars"

# 4. Hashtag Search
curl "https://your-worker.workers.dev/api/hashtags/viral"

# 5. User Posts
curl "https://your-worker.workers.dev/api/user/USER_ID/posts"
```

---

## Expected Response (Feed Endpoint)

```json
[
  {
    "id": "post-uuid",
    "caption": "#viral #trending",
    "media_url": "https://...",
    "like_count": 5000,
    "comment_count": 250,
    "author": {
      "username": "creator",
      "is_verified": true,
      "follower_count": 10000
    },
    "_engagement_rate": "142.50"
  },
  ...
]
```

---

## Update APK Code

Replace old API URL:
```java
// OLD ❌
String API = "https://api.talksyra.app";

// NEW ✅
String API = "https://your-worker.workers.dev"; // Your deployed URL
```

Then test:
```java
// Fetch feed
String url = API + "/api/feed?type=reel&limit=20&userId=" + userId;
// Call with OkHttp / Retrofit
```

---

## Ranking Algorithm (30-Second Explainer)

**Instagram-style scoring** surfaces good creators:

```
Score = 
  Engagement (50%)    → likes/comments/shares
  + Freshness (20%)   → recent posts higher
  + Creator (15%)     → followers + verified ✅
  + Velocity (10%)    → fast engagement = viral
  + Public (5%)       → boost public posts
```

**Result**: 
- 1000 likes from verified → 🚀 Viral
- 10 likes from unknown → 📈 Discoverable
- 7 days old → 📉 Deprioritized

---

## Files You Need to Know

| File | Purpose |
|------|---------|
| `src/worker.js` | Main API logic (5 endpoints) |
| `docs/SMART_FEED_API.md` | Full API documentation |
| `docs/DATABASE_SCHEMA.md` | Database design |
| `.env.local` | Your Supabase credentials (never commit) |

---

## What Happens Next?

### Phase 2 (Personalization)
- [ ] Implement follower system
- [ ] User affinity ranking (personalized feed)
- [ ] Hashtag trending dashboard

### Phase 3 (Analytics)
- [ ] Creator dashboard
- [ ] Engagement metrics
- [ ] Trending insights

---

## Troubleshooting

**"Invalid API key" error?**
→ Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in wrangler secrets

**Feed returning empty?**
→ Check posts table has data: `curl https://frmazzmzyychdfajnslt.supabase.co/rest/v1/posts?limit=1 -H "apikey: YOUR_KEY"`

**Slow response?**
→ Normal: worker fetches 5x posts then ranks. ~100ms is expected.

**CORS errors in APK?**
→ Worker returns `Access-Control-Allow-Origin: *` — should work from anywhere

---

## Questions?

See:
- 📖 `docs/SMART_FEED_API.md` — API details
- 📖 `docs/DATABASE_SCHEMA.md` — Database design
- 📖 `docs/PROJECT_SUMMARY.md` — Full breakdown
- 📖 `README.md` — Overview

Good luck! 🚀
