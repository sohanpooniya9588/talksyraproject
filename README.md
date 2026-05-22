99# talksyraproject

A high-performance TalkSyra backend with Cloudflare Workers + Supabase + smart Instagram-like feed algorithm.

## ⚡ Features

### Smart Feed Algorithm
- **Instagram-style ranking**: Surfaces good creators, hides bad content
- **Multi-factor scoring**: Engagement (50%) + Freshness (20%) + Creator Quality (15%) + Velocity (10%) + Public Boost (5%)
- **Fast & scalable**: Fetches 5x posts, ranks & returns top N in <100ms

### API Endpoints
- **`GET /api/feed`** — Personalized smart home feed (ranked posts)
- **`GET /api/stars`** — Top 10 trending creators
- **`GET /api/trending`** — Viral content (ranked by engagement)
- **`GET /api/hashtags/:tag`** — Search posts by hashtag
- **`GET /api/user/:userId/posts`** — User profile feed

### Security
- Supabase anon key (read-limited) used for feed reads
- Service role key (sensitive) kept out of repo, used only on trusted server
- JWT forwarding support for RLS enforcement

### Database
- **Full schema** in `docs/DATABASE_SCHEMA.md`
- **8 tables**: users, posts, likes, comments, followers, saves, hashtags, story_views
- **Ready for**: follow system, bookmarks, stories, hashtag tracking

---

## 🚀 Quick Start

### 1. Set Local Environment
```bash
# Copy placeholder to local (never commit .env)
cp .env.example .env.local

# Add your Supabase credentials (already in .env.local)
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your_anon_key
```

### 2. Deploy to Cloudflare Workers
```bash
# Install wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Set secrets (will prompt for values)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY

# Deploy
wrangler deploy
```

### 3. Test Endpoints
```bash
# Fetch smart feed
curl "https://your-worker.workers.dev/api/feed?type=reel&limit=5"

# Fetch trending
curl "https://your-worker.workers.dev/api/trending"

# Fetch top creators
curl "https://your-worker.workers.dev/api/stars"
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `docs/DATABASE_SCHEMA.md` | Full database schema + design decisions |
| `docs/SMART_FEED_API.md` | API docs + ranking algorithm explanation |
| `docs/USAGE.md` | How to use the system |

---

## 🔧 Architecture

```
┌─────────────────┐
│  APK / Client   │
└────────┬────────┘
         │ HTTP GET
         ▼
┌─────────────────────────────────────┐
│  Cloudflare Worker (src/worker.js)  │
│  ├─ /api/feed          (smart rank) │
│  ├─ /api/trending      (viral)      │
│  ├─ /api/stars         (creators)   │
│  └─ /api/hashtags/:tag (search)     │
└────────┬────────────────────────────┘
         │ REST API + anon key
         ▼
┌──────────────────────────────────┐
│  Supabase (PostgreSQL + REST)    │
│  ├─ posts table (media, captions)│
│  ├─ users table (creators)       │
│  ├─ likes table (engagement)     │
│  ├─ comments table (replies)     │
│  └─ ... (followers, saves, etc)  │
└──────────────────────────────────┘
```

---

## 🎯 Ranking Algorithm Explained

**Goal**: Only good creators go viral; bad content stays hidden.

**Score Calculation**:
```
final_score = 
  log10(engagement + 1) × 0.50           // Likes, comments, shares, views
  + freshness × 0.20                     // Recent posts ranked higher
  + log10(creator_quality + 1) × 0.15    // Followers + verification + posts
  + log10(velocity + 1) × 0.10           // How fast getting engagement
  + (is_public ? 0.05 : 0)               // Public visibility boost
```

**Examples**:
- Post with 1000 likes from verified creator = viral 🚀
- Post with 10 likes from unknown creator = discoverable 📈
- Old post (7 days+) = deprioritized 📉

---

## 🛠️ What's Done (✅) & What's Remaining (⏳)

### ✅ Completed
- [x] Supabase Edge Function for likes/comments
- [x] Worker with smart feed algorithm
- [x] All 5 API endpoints built
- [x] Database schema documented
- [x] Security: anon key for reads, service role optional
- [x] Media URLs returned in feed
- [x] Pagination support (limit + offset)

### ⏳ Next Phase (Priority)
- [ ] **Phase 1**: Deploy to Cloudflare, test with APK
- [ ] **Phase 2**: Implement follower system (followers table)
- [ ] **Phase 3**: User affinity ranking (personalization by user)
- [ ] **Phase 4**: Hashtag extraction & trending dashboard
- [ ] **Phase 5**: Creator analytics dashboard

### 🎁 Bonus
- [ ] Stories feature (use story_views table)
- [ ] Saved posts (use saves table)
- [ ] Creator monetization (use is_monetized flag)
- [ ] Real-time trending via WebSockets
- [ ] Anti-spam & content moderation

---

## 🔐 Environment Variables

**Required** (Cloudflare Worker Settings → Variables):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

**Optional** (for server-only operations):
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Do NOT expose to client
```

---

## 📞 Support

See `docs/USAGE.md` for detailed usage examples and troubleshooting.

---

## 📝 License

Internal TalkSyra project.
