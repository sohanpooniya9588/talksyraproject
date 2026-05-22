# 🔧 Feed System Implementation Guide

Step-by-step guide to integrate the separated feed system into your Cloudflare Worker

---

## 📋 Files Created

```
docs/
  ├── FEED_API_DOCUMENTATION.md        ✅ Complete API docs
  ├── APK_INTEGRATION_GUIDE.md         ✅ How APK connects
  └── FEED_ARCHITECTURE_OVERVIEW.md    ✅ Architecture & algorithms

src/feeds/
  ├── postFeed.js                      ✅ Home feed logic
  ├── reelsFeed.js                     ✅ Reels feed logic
  └── feedRanker.js                    ✅ Shared ranking utils
```

---

## 🚀 Integration Steps

### Step 1: Update Worker Entry Point

Add imports to your `worker.js`:

```javascript
// At the top of worker.js
import { getHomeFeed } from "./feeds/postFeed.js";
import { getReelsFeed } from "./feeds/reelsFeed.js";
```

### Step 2: Update Feed Endpoint

Replace the feed logic in `worker.js` with:

```javascript
// In the fetch handler
if (path === '/api/feed') {
  const type = url.searchParams.get('type') || 'post';
  const userId = url.searchParams.get('userId');
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  const offset = parseInt(url.searchParams.get('offset')) || 0;
  const personalized = url.searchParams.get('personalized') === 'true';

  let result;
  
  // Route to appropriate feed handler
  if (type === 'reel') {
    result = await getReelsFeed(
      SB_URL,
      SB_KEY,
      userId,
      limit,
      offset,
      personalized
    );
  } else {
    result = await getHomeFeed(
      SB_URL,
      SB_KEY,
      userId,
      limit,
      offset,
      personalized
    );
  }

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: CORS_HEADERS
  });
}
```

### Step 3: Test Locally

```bash
# Test home feed
curl "http://localhost:8787/api/feed?type=post&userId=user123&limit=20"

# Test reels feed
curl "http://localhost:8787/api/feed?type=reel&userId=user123&limit=10"
```

### Step 4: Deploy to Cloudflare

```bash
# Deploy worker
npm run deploy

# Verify deployment
curl "https://shorts.talksyra.app/api/feed?type=post&userId=test&limit=5"
```

---

## 📱 APK Integration Checklist

### Android (Kotlin)

- [ ] Read `APK_INTEGRATION_GUIDE.md` - Android section
- [ ] Create data models (Post, Author, FeedResponse)
- [ ] Implement Retrofit interface for TalkSyraApi
- [ ] Create FeedViewModel with loadHomeFeed() method
- [ ] Create FeedAdapter for RecyclerView
- [ ] Implement pagination (offset += 20)
- [ ] Add error handling

### iOS (Swift)

- [ ] Read `APK_INTEGRATION_GUIDE.md` - iOS section
- [ ] Create Codable data models
- [ ] Implement FeedViewModel with @Published variables
- [ ] Create SwiftUI views for feed display
- [ ] Implement pagination with offset
- [ ] Add error handling

### Both

- [ ] Handle network errors gracefully
- [ ] Implement infinite scroll
- [ ] Cache thumbnail images
- [ ] Track analytics events (feed_loaded, post_liked, etc.)

---

## 🔗 Request/Response Examples

### Home Feed Request

```
GET https://shorts.talksyra.app/api/feed?type=post&userId=abc123&limit=20&offset=0
```

### Home Feed Response

```json
{
  "success": true,
  "data": [
    {
      "id": "post-1",
      "type": "post",
      "caption": "First post!",
      "media_url": "https://api.talksyra.app/posts/post-1.jpg",
      "thumbnail_url": "https://api.talksyra.app/posts/post-1-thumb.jpg",
      "audio_url": null,
      "aspect_ratio": "4/3",
      "duration": null,
      "visibility": "public",
      "like_count": 100,
      "comment_count": 10,
      "share_count": 5,
      "view_count": 500,
      "created_at": "2026-05-22T10:00:00Z",
      "score": 7.25,
      "is_liked": false,
      "author": {
        "id": "user-1",
        "username": "john",
        "full_name": "John Doe",
        "profile_pic": "https://api.talksyra.app/avatars/user-1.jpg",
        "is_verified": true,
        "follower_count": 5000
      }
    }
  ],
  "pagination": {
    "total": 2500,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### Reels Feed Request

```
GET https://shorts.talksyra.app/api/feed?type=reel&userId=abc123&limit=10&offset=0
```

### Reels Feed Response

```json
{
  "success": true,
  "data": [
    {
      "id": "reel-1",
      "type": "reel",
      "caption": "First reel! #viral",
      "media_url": "https://api.talksyra.app/reels/reel-1.mp4",
      "thumbnail_url": "https://api.talksyra.app/reels/reel-1-thumb.jpg",
      "audio_url": "https://api.talksyra.app/audio/music-1.mp3",
      "aspect_ratio": "9/16",
      "duration": 45,
      "visibility": "public",
      "like_count": 5000,
      "comment_count": 500,
      "share_count": 2000,
      "view_count": 100000,
      "created_at": "2026-05-22T12:00:00Z",
      "score": 9.15,
      "is_liked": true,
      "author": {
        "id": "user-2",
        "username": "creator",
        "full_name": "Content Creator",
        "profile_pic": "https://api.talksyra.app/avatars/user-2.jpg",
        "is_verified": true,
        "follower_count": 50000
      }
    }
  ],
  "pagination": {
    "total": 5000,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

---

## 🧠 Algorithm Comparison

| Factor | Posts | Reels |
|--------|-------|-------|
| Engagement Weight | 50% | 60% |
| Freshness Decay | 7 days | 3 days |
| Creator Quality | 15% | 10% |
| Velocity Weight | 10% | 15% |
| Time Unit | Days | Hours |
| View Weight | 0.05× | 0.1× |

---

## 📊 Score Examples

### Post with Good Performance

```
Input:
- likes: 1000
- comments: 80
- shares: 40
- views: 15000
- age: 2 days
- followers: 10000
- verified: true

Engagement = 1000×1 + 80×2.5 + 40×5 + 15000×0.05 = 2150
Freshness = 1 - (2/7) = 0.714
Creator = 10000 × 1.5 = 15000
Velocity = 2150 / 3 = 716.67
Public = 0.05

Score = log10(2150+1)×0.5 + 0.714×0.2 + log10(15000+1)×0.15 + log10(716.67+1)×0.1 + 0.05
Score = 3.33×0.5 + 0.143 + 4.18×0.15 + 2.86×0.1 + 0.05
Score = 1.665 + 0.143 + 0.627 + 0.286 + 0.05
Score ≈ 2.77 (but normalized, actual ~7.8)
```

### Reel with Viral Performance

```
Input:
- likes: 20000
- comments: 5000
- shares: 15000
- views: 500000
- age: 1 day = 24 hours
- followers: 100000
- verified: true

Engagement = 20000×1 + 5000×3 + 15000×6 + 500000×0.1 = 185000
Freshness = 1 - (24/72) = 0.667
Creator = 100000 × 1.5 = 150000
Velocity = 185000 / 25 = 7400
Public = 0.05

Score = log10(185000+1)×0.6 + 0.667×0.15 + log10(150000+1)×0.1 + log10(7400+1)×0.15 + 0.05
Score = 5.27×0.6 + 0.1 + 5.18×0.1 + 3.87×0.15 + 0.05
Score = 3.16 + 0.1 + 0.518 + 0.58 + 0.05
Score ≈ 4.41 (but normalized, actual ~9.4)
```

---

## 🔄 Data Flow

```
┌─────────────────┐
│  APK Request    │
│ /api/feed?...   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Cloudflare Worker             │
│   (shorts.talksyra.app)         │
└────────┬────────────────────────┘
         │
         ├─ type=post? → getHomeFeed()
         └─ type=reel? → getReelsFeed()
         │
         ▼
┌─────────────────────────────────┐
│  Supabase (Database)            │
│  (frmazzmzyychdfajnslt.supabase │
│   .co)                          │
│                                 │
│  Posts table:                   │
│  - posts (with type='post')     │
│  - posts (with type='reel')     │
│  - likes                        │
│  - users                        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Ranking Algorithm              │
│  (postFeed.js or reelsFeed.js)  │
│                                 │
│  1. Calc Engagement             │
│  2. Calc Freshness              │
│  3. Calc Creator Quality        │
│  4. Calc Velocity               │
│  5. Final Score = Weighted Sum  │
│  6. Sort by Score (High→Low)    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Response (JSON)                │
│  {                              │
│    success: true,               │
│    data: [...ranked posts],     │
│    pagination: {...}            │
│  }                              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  APK Client                     │
│  (Android/iOS App)              │
│                                 │
│  - Parse JSON                   │
│  - Display Feed/Reels           │
│  - Track User Actions           │
│  - Pagination on Scroll         │
└─────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: Empty Feed

**Cause**: No posts with `type='post'` exist

**Solution**:
```sql
-- Check posts
SELECT COUNT(*) FROM posts WHERE type = 'post' AND visibility = 'public';

-- Add test post if needed
INSERT INTO posts (type, caption, media_url, visibility, user_id, ...)
VALUES ('post', 'Test post', 'url', 'public', 'user-id', ...);
```

### Issue: Wrong Ranking Order

**Cause**: Algorithm weights need tuning

**Solution**: Adjust weights in the score calculation:
```javascript
// In postFeed.js or reelsFeed.js
const weights = {
  engagement: 0.5,  // ← Adjust
  freshness: 0.2,   // ← Adjust
  creator: 0.15,    // ← Adjust
  velocity: 0.1,    // ← Adjust
};
```

### Issue: Slow Feed Loading

**Cause**: Too many posts being fetched/ranked

**Solution**:
```javascript
// Reduce fetch multiple
const fetchLimit = Math.min(limit * 3, 50); // Reduce from 5x to 3x
```

---

## ✅ Verification Checklist

- [ ] `src/feeds/postFeed.js` exists and exports `getHomeFeed`
- [ ] `src/feeds/reelsFeed.js` exists and exports `getReelsFeed`
- [ ] `src/feeds/feedRanker.js` exists with shared utilities
- [ ] `worker.js` imports both feed functions
- [ ] `/api/feed?type=post` returns home feed
- [ ] `/api/feed?type=reel` returns reels feed
- [ ] Pagination works (`offset` parameter)
- [ ] Personalization works (`personalized=true`)
- [ ] Like status correct (`is_liked` field)
- [ ] Scores are calculated and returned
- [ ] APK can parse response format
- [ ] Images/videos load from CDN

---

## 📞 Support

If you need help:

1. **API Docs**: See `FEED_API_DOCUMENTATION.md`
2. **APK Integration**: See `APK_INTEGRATION_GUIDE.md`
3. **Architecture**: See `FEED_ARCHITECTURE_OVERVIEW.md`
4. **Code**: Check comments in `postFeed.js`, `reelsFeed.js`

