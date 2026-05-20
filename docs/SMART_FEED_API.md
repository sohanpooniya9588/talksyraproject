# TalkSyra Smart Feed API Documentation

## Overview

The worker now implements an **Instagram-like smart ranking algorithm** that surfaces high-quality content from good creators while preventing boring chronological feeds. Good creators get viral, bad content stays invisible.

---

## Ranking Algorithm Details

### Composite Score Formula

```
FINAL_SCORE = 
  log10(ENGAGEMENT + 1) × 0.50        [Engagement: likes, comments, shares, views]
  + FRESHNESS × 0.20                  [Freshness: recent > old (7-day decay)]
  + log10(CREATOR_QUALITY + 1) × 0.15 [Creator: followers + verification + posts]
  + log10(ENGAGEMENT_RATE + 1) × 0.10 [Velocity: how fast getting engagement]
  + (Public ? 0.05 : 0)               [Public visibility boost]
```

### Engagement Score (50%)
```
ENGAGEMENT = 
  likes × 1.0 
  + comments × 2.5        [Comments weighted 2.5x (higher intent)]
  + shares × 5.0          [Shares weighted 5x (highest intent)]
  + views × 0.05          [Views = reach baseline]
```

### Freshness Score (20%)
```
FRESHNESS = max(0, 1.0 - (post_age_days / 7.0))
-- Posts decay over 7 days
-- 0 days old = 1.0 (perfect freshness)
-- 7 days old = 0.0 (stale)
-- 3.5 days old = 0.5
```

### Creator Quality (15%)
```
CREATOR_QUALITY = 
  log10(follower_count + 1) × (is_verified ? 1.5 : 1.0)
-- More followers = higher exposure
-- Verified creators get 1.5x boost
-- Logarithmic scale (diminishing returns at very high followers)
```

### Engagement Velocity (10%)
```
VELOCITY = ENGAGEMENT_SCORE / (post_age_days + 1)
-- Fast engagement = viral potential
-- Old posts with slow engagement = deprioritized
```

---

## API Endpoints

### **1. Smart Home Feed** `GET /api/feed`

Returns personalized, AI-ranked feed.

**Parameters:**
- `type` (string): `post` or `reel` (default: `post`)
- `userId` (string, optional): User ID to check like status
- `limit` (int): Posts per page (default: 20, max: 100)
- `offset` (int): Pagination offset (default: 0)

**Example:**
```bash
curl "https://api.talksyra.app/api/feed?type=reel&userId=USER_ID&limit=20&offset=0" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
[
  {
    "id": "post-id",
    "type": "reel",
    "caption": "#viral #trending",
    "media_url": "https://...",
    "thumbnail_url": "https://...",
    "audio_url": "https://...",
    "aspect_ratio": 9/16,
    "duration": 30,
    "like_count": 5000,
    "comment_count": 250,
    "share_count": 100,
    "view_count": 50000,
    "created_at": "2026-05-20T10:00:00Z",
    "author": {
      "id": "user-id",
      "username": "creator_name",
      "full_name": "Creator Full Name",
      "profile_pic": "https://...",
      "is_verified": true,
      "follower_count": 10000
    },
    "is_liked": [{ "user_id": "current_user" }],
    "_engagement_rate": "142.50"
  },
  ...
]
```

---

### **2. Rising Stars / Top Creators** `GET /api/stars`

Discover trending creators (sorted by creator_score = followers × verification boost).

**Example:**
```bash
curl "https://api.talksyra.app/api/stars"
```

**Response:**
```json
[
  {
    "id": "user-id",
    "username": "top_creator",
    "full_name": "Top Creator",
    "profile_pic": "https://...",
    "follower_count": 50000,
    "post_count": 200,
    "is_verified": true,
    "creator_score": 75000.5  // Custom ranking score
  },
  ...
]
```

---

### **3. Trending / Viral Content** `GET /api/trending`

Discover posts going viral (top by engagement + freshness).

**Parameters:**
- `type` (string): `post` or `reel` (default: `post`)
- `limit` (int): Posts to return (default: 15)

**Example:**
```bash
curl "https://api.talksyra.app/api/trending?type=reel&limit=15"
```

**Response:** Same as `/api/feed` but sorted by viral potential

---

### **4. Hashtag Search** `GET /api/hashtags/:tag`

Find posts by hashtag (e.g., `#viral`, `#trending`).

**Example:**
```bash
curl "https://api.talksyra.app/api/hashtags/viral"
```

**Response:** Array of posts containing `#viral` in caption

---

### **5. User Profile Feed** `GET /api/user/:userId/posts`

Get all posts by a specific user.

**Example:**
```bash
curl "https://api.talksyra.app/api/user/USER_ID/posts"
```

**Response:** Array of user's posts (chronological)

---

## Client Integration (APK)

### Example Kotlin (OkHttp)

```kotlin
import okhttp3.*

val client = OkHttpClient()

// Fetch smart feed
fun fetchSmartFeed(userId: String) {
  val url = "https://api.talksyra.app/api/feed?type=reel&userId=$userId&limit=20"
  val request = Request.Builder().url(url).build()
  
  client.newCall(request).enqueue(object: Callback {
    override fun onResponse(call: Call, response: Response) {
      val body = response.body?.string()
      val posts = parseJson(body) // Parse JSON to Post objects
      displayFeed(posts)
    }
    override fun onFailure(call: Call, e: IOException) {
      showError("Failed to fetch feed: ${e.message}")
    }
  })
}

// Fetch trending
fun fetchTrending() {
  val url = "https://api.talksyra.app/api/trending?type=reel&limit=15"
  val request = Request.Builder().url(url).build()
  client.newCall(request).enqueue(...)
}

// Search hashtag
fun searchHashtag(tag: String) {
  val url = "https://api.talksyra.app/api/hashtags/$tag"
  val request = Request.Builder().url(url).build()
  client.newCall(request).enqueue(...)
}
```

### Example JavaScript (Fetch API)

```javascript
// Smart feed
async function fetchSmartFeed(userId) {
  const url = new URL('https://api.talksyra.app/api/feed');
  url.searchParams.set('type', 'reel');
  url.searchParams.set('userId', userId);
  url.searchParams.set('limit', '20');
  
  const response = await fetch(url);
  const posts = await response.json();
  renderFeed(posts);
}

// Fetch trending
async function fetchTrending() {
  const response = await fetch('https://api.talksyra.app/api/trending?type=reel');
  const posts = await response.json();
  renderTrending(posts);
}

// Pagination
async function loadMore(offset) {
  const response = await fetch(`/api/feed?limit=20&offset=${offset}`);
  const newPosts = await response.json();
  appendFeed(newPosts);
}
```

---

## Why This Algorithm Works

| Factor | Why It Matters | Example |
|--------|---|---|
| **Engagement** | Popular = quality | 1000 likes = algorithm loves it |
| **Freshness** | Discovery window | Older posts get less visibility |
| **Creator Quality** | Authority & authenticity | Verified creator + followers = trusted |
| **Velocity** | Viral momentum | Post getting 100 likes/hr > 100 likes/week |
| **Visibility** | Encourage sharing | Public posts boosted over private |

---

## Performance Notes

- Fetches **5x limit** of posts internally for better ranking
- Sorts by score, returns top N
- 20-second cache for speed
- Supports pagination via `offset` parameter

---

## Future Enhancements

1. **User Affinity**: Track what user likes/saves, personalize feed
2. **Collaborative Filtering**: "Users who liked X also liked Y"
3. **Real-time Trending**: Update every 5 minutes
4. **Anti-Spam**: Detect bot engagement, remove fake likes
5. **Creator Analytics**: Dashboard showing reach/engagement trends
6. **Notification**: Alert when following's post goes viral

