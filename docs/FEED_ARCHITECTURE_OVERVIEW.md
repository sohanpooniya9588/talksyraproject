# 📱 TalkSyra Feed System - Architecture Guide

Complete guide to the separated feed system - Posts Feed & Reels Feed architecture

---

## 📂 Project Structure

```
/src/feeds/
  ├── postFeed.js        # Home page feed logic (Instagram-style posts)
  ├── reelsFeed.js       # Reels/shorts feed logic (TikTok-style vertical videos)
  ├── feedRanker.js      # Shared ranking utilities and algorithms

/docs/
  ├── FEED_API_DOCUMENTATION.md    # Complete API endpoint documentation
  ├── APK_INTEGRATION_GUIDE.md     # How APK should integrate with API
  ├── FEED_ARCHITECTURE_OVERVIEW.md # This file

/worker/
  ├── worker.js          # Cloudflare Worker main entry point
```

---

## 🎯 Two Feed Types Overview

### 1. Home Feed (Posts)
- **Type**: `post`
- **Use Case**: Home page timeline with image/text posts
- **Characteristics**:
  - Longer lifespan (7-day decay)
  - Balanced engagement metrics
  - Mixed media (images, captions, locations)
  - Lower velocity weight (posts stay visible longer)
- **File**: `src/feeds/postFeed.js`
- **API**: `GET /api/feed?type=post&userId=USER&limit=20`

### 2. Reels Feed (Shorts)
- **Type**: `reel`
- **Use Case**: Reels/shorts section with vertical videos
- **Characteristics**:
  - Shorter lifespan (3-day decay)
  - Viral potential emphasized
  - Video-focused (MP4/WebM with audio)
  - Higher velocity weight (trending happens fast)
- **File**: `src/feeds/reelsFeed.js`
- **API**: `GET /api/feed?type=reel&userId=USER&limit=10`

---

## 🔧 How to Use the Feed System

### Basic Usage

#### In Node.js / Cloudflare Worker

```javascript
// Import feed functions
import { getHomeFeed } from "./postFeed.js";
import { getReelsFeed } from "./reelsFeed.js";

// Supabase config
const SB_URL = "https://frmazzmzyychdfajnslt.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Get Home Feed
const homeFeed = await getHomeFeed(SB_URL, SB_KEY, userId, 20, 0, false);
console.log(homeFeed.data); // Array of ranked posts

// Get Reels Feed
const reelsFeed = await getReelsFeed(SB_URL, SB_KEY, userId, 10, 0, false);
console.log(reelsFeed.data); // Array of ranked reels
```

#### In Worker Endpoints

```javascript
// /api/feed endpoint handler
if (path === '/api/feed') {
  const type = url.searchParams.get('type') || 'post';
  const userId = url.searchParams.get('userId');
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  const offset = parseInt(url.searchParams.get('offset')) || 0;
  const personalized = url.searchParams.get('personalized') === 'true';

  let result;
  if (type === 'reel') {
    result = await getReelsFeed(SB_URL, SB_KEY, userId, limit, offset, personalized);
  } else {
    result = await getHomeFeed(SB_URL, SB_KEY, userId, limit, offset, personalized);
  }

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: CORS_HEADERS
  });
}
```

---

## 📊 Ranking Algorithms Explained

### Home Feed Ranking (Posts)

**Score Formula:**
```
SCORE = 
  log10(ENGAGEMENT + 1) × 0.50  [50% Engagement]
  + FRESHNESS × 0.20             [20% Freshness - 7 day decay]
  + log10(CREATOR + 1) × 0.15    [15% Creator Quality]
  + log10(VELOCITY + 1) × 0.10   [10% Velocity]
  + (public ? 0.05 : 0)          [5% Public Boost]
```

**Key Points:**
- Posts stay visible longer (7-day decay)
- Creator quality matters (established creators)
- Steady engagement is valued
- Perfect for long-tail discovery

**Example:**
```
Post A: 500 likes, 20 comments, 5 shares, 10k views, 2 days old, 5k followers
→ High engagement, fresh, good creator → Score: ~8.2 (shows high in feed)

Post B: 50 likes, 2 comments, 0 shares, 100 views, 6 days old, 500 followers
→ Low engagement, stale, small creator → Score: ~2.1 (shows low in feed)
```

---

### Reels Feed Ranking (Shorts)

**Score Formula:**
```
SCORE = 
  log10(ENGAGEMENT + 1) × 0.60  [60% Engagement - higher!]
  + FRESHNESS × 0.15             [15% Freshness - 3 day decay]
  + log10(CREATOR + 1) × 0.10    [10% Creator Quality]
  + log10(VELOCITY + 1) × 0.15   [15% Velocity - higher!]
  + (public ? 0.05 : 0)          [5% Public Boost]
```

**Key Differences from Posts:**
- **Engagement**: 60% instead of 50% (viral content matters)
- **Freshness**: 3-day decay instead of 7 (reels age faster)
- **Velocity**: 15% instead of 10% (trending speed is critical)
- **Time Unit**: Measured in hours instead of days
- **Weights**: Views weighted at 0.1 instead of 0.05

**Example:**
```
Reel A: 10k likes, 2k comments, 8k shares, 500k views, 1 day old
→ Very high engagement, fresh, viral → Score: ~9.4 (trending!)

Reel B: 100 likes, 10 comments, 5 shares, 5k views, 3 days old
→ Low engagement, aging → Score: ~2.3 (archive)
```

---

## 🎯 Ranking Components

### 1. Engagement Score

**Posts:**
```
ENGAGEMENT = 
  likes × 1.0 
  + comments × 2.5    [comments = high intent]
  + shares × 5.0      [shares = viral signal]
  + views × 0.05
```

**Reels:**
```
ENGAGEMENT = 
  likes × 1.0 
  + comments × 3.0    [comments more important]
  + shares × 6.0      [shares are viral]
  + views × 0.1       [more weight on views]
```

### 2. Freshness Score

**Posts (7-day decay):**
```
0 days old   → 1.0 (perfect)
3.5 days old → 0.5 (half life)
7 days old   → 0.0 (stale)
```

**Reels (3-day decay):**
```
0 days old   → 1.0 (perfect)
1.5 days old → 0.5 (half life)
3 days old   → 0.0 (archived)
```

### 3. Creator Quality Score

```
CREATOR_QUALITY = followers × (verified ? 1.5 : 1.0)

Examples:
- 5k followers, verified   → 7,500
- 5k followers, unverified → 5,000
- 100k followers, verified → 150,000
```

### 4. Velocity Score

**Posts (daily basis):**
```
VELOCITY = ENGAGEMENT / (post_age_days + 1)

Example: 500 engagement, 2 days old
→ 500 / (2 + 1) = 166.7 engagements/day
```

**Reels (hourly basis):**
```
VELOCITY = ENGAGEMENT / (reel_age_hours + 1)

Example: 5000 engagement, 6 hours old
→ 5000 / (6 + 1) = 714 engagements/hour
```

---

## 🔄 Feed Flow Diagram

```
APK Request
    ↓
/api/feed?type=post (or reel)
    ↓
Cloudflare Worker
    ↓
1. Fetch posts/reels from Supabase
   ├─ Filter by type (post or reel)
   ├─ Filter by visibility (public)
   └─ Fetch 5x more than requested
    ↓
2. Get User Context (if logged in)
   ├─ Get following list (if personalized)
   ├─ Get liked posts
   └─ Attach is_liked flag
    ↓
3. Rank by Score
   ├─ Calculate engagement
   ├─ Calculate freshness
   ├─ Calculate creator quality
   ├─ Calculate velocity
   └─ Sort by composite score
    ↓
4. Apply Filters
   ├─ Filter by following (if personalized=true)
   └─ Return top N results
    ↓
5. Return to APK
   {
     success: true,
     data: [...ranked posts],
     pagination: {...}
   }
```

---

## 📡 API Request Examples

### cURL

```bash
# Home Feed
curl "https://shorts.talksyra.app/api/feed?type=post&userId=user123&limit=20&offset=0"

# Reels Feed
curl "https://shorts.talksyra.app/api/feed?type=reel&userId=user123&limit=10&offset=0"

# Personalized (following only)
curl "https://shorts.talksyra.app/api/feed?type=post&userId=user123&limit=20&personalized=true"

# Anonymous (no like status)
curl "https://shorts.talksyra.app/api/feed?type=reel&limit=10"
```

### JavaScript

```javascript
// Fetch home feed
const homeFeed = await fetch(
  'https://shorts.talksyra.app/api/feed?type=post&userId=user123&limit=20'
).then(r => r.json());

// Fetch reels feed
const reelsFeed = await fetch(
  'https://shorts.talksyra.app/api/feed?type=reel&userId=user123&limit=10'
).then(r => r.json());
```

### Kotlin (Android)

```kotlin
val response = api.getHomeFeed(
    type = "post",
    userId = userId,
    limit = 20,
    offset = 0
)
```

### Swift (iOS)

```swift
let params: [String: Any] = [
    "type": "post",
    "userId": userId,
    "limit": 20,
    "offset": 0
]

AF.request("https://shorts.talksyra.app/api/feed", parameters: params)
```

---

## 🎨 Response Format

### Posts Response

```json
{
  "success": true,
  "data": [
    {
      "id": "post-123",
      "type": "post",
      "caption": "Beautiful sunset 🌅",
      "media_url": "https://api.talksyra.app/posts/post-123.jpg",
      "thumbnail_url": "https://api.talksyra.app/posts/post-123-thumb.jpg",
      "audio_url": null,
      "aspect_ratio": "4/3",
      "duration": null,
      "visibility": "public",
      "location_name": "Goa, India",
      "like_count": 1200,
      "comment_count": 95,
      "share_count": 45,
      "view_count": 8900,
      "created_at": "2026-05-20T10:30:00Z",
      "score": 8.75,
      "is_liked": false,
      "author": {
        "id": "user-456",
        "username": "travel_guru",
        "full_name": "Travel Guru",
        "profile_pic": "https://api.talksyra.app/avatars/user-456.jpg",
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

### Reels Response

```json
{
  "success": true,
  "data": [
    {
      "id": "reel-789",
      "type": "reel",
      "caption": "Learn React in 60 seconds",
      "media_url": "https://api.talksyra.app/reels/reel-789.mp4",
      "thumbnail_url": "https://api.talksyra.app/reels/reel-789-thumb.jpg",
      "audio_url": "https://api.talksyra.app/audio/music-123.mp3",
      "aspect_ratio": "9/16",
      "duration": 60,
      "visibility": "public",
      "like_count": 15000,
      "comment_count": 2100,
      "share_count": 8500,
      "view_count": 450000,
      "created_at": "2026-05-21T08:15:00Z",
      "score": 9.42,
      "is_liked": true,
      "author": {
        "id": "user-789",
        "username": "code_master",
        "full_name": "Code Master",
        "profile_pic": "https://api.talksyra.app/avatars/user-789.jpg",
        "is_verified": true,
        "follower_count": 125000
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

## 🔍 Database Schema Reference

### Posts Table

```sql
posts (
  id UUID PRIMARY KEY
  type TEXT -- 'post' or 'reel'
  caption TEXT
  media_url TEXT
  thumbnail_url TEXT
  audio_url TEXT -- null for posts, URL for reels
  aspect_ratio TEXT -- '4/3', '9/16', '1/1', etc
  duration INT -- null for posts, seconds for reels
  visibility TEXT -- 'public', 'private'
  location_name TEXT
  user_id UUID -- foreign key to users
  like_count INT -- denormalized for performance
  comment_count INT
  share_count INT
  view_count INT
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

### Users Table

```sql
users (
  id UUID PRIMARY KEY
  username TEXT UNIQUE
  full_name TEXT
  profile_pic TEXT
  is_verified BOOLEAN
  follower_count INT -- denormalized for performance
)
```

---

## ⚡ Performance Tips

### Caching

```javascript
// Cache feed for 5 minutes
const feedCache = new Map();

function getCachedFeed(key) {
  const cached = feedCache.get(key);
  if (cached && Date.now() - cached.time < 5 * 60 * 1000) {
    return cached.data;
  }
  return null;
}

function setCachedFeed(key, data) {
  feedCache.set(key, { data, time: Date.now() });
}
```

### Batch Operations

```javascript
// Fetch likes in batch (not one-by-one)
const likedPostIds = [id1, id2, id3, ...];
const likesQuery = `posts?id=in.(${likedPostIds.join(',')})`;
```

### Lazy Loading

```javascript
// Load more when user reaches end
if (remainingPosts < 5) {
  loadMorePosts(offset + 20);
}
```

---

## 🧪 Testing

### Test Post Ranking

```javascript
import { getHomeFeed } from "./postFeed.js";

const testPosts = await getHomeFeed(
  "https://frmazzmzyychdfajnslt.supabase.co",
  "YOUR_KEY",
  "user123",
  20
);

console.log("Ranked posts:", testPosts.data);
```

### Test Reel Ranking

```javascript
import { getReelsFeed } from "./reelsFeed.js";

const testReels = await getReelsFeed(
  "https://frmazzmzyychdfajnslt.supabase.co",
  "YOUR_KEY",
  "user123",
  10
);

console.log("Ranked reels:", testReels.data);
```

---

## 🛠️ Maintenance

### Monitoring

- Track average score per post
- Monitor feed cache hit rate
- Watch for ranking anomalies
- Test with new posts daily

### Tuning

If feed feels stale:
- Increase freshness weight
- Decrease decay time

If feed feels chaotic:
- Decrease velocity weight
- Increase creator quality weight

---

## 📝 File Dependencies

```
worker.js
├── imports getHomeFeed from postFeed.js
├── imports getReelsFeed from reelsFeed.js
└── calls /api/feed endpoint

postFeed.js
├── calculates ranking using formulas
└── imports rankPostsByScore, calculateScore

reelsFeed.js
├── calculates ranking using formulas
└── imports rankReelsByScore, calculateReelScore

feedRanker.js
├── exports FeedRanker utility class
└── shared algorithms (can be imported by postFeed, reelsFeed)
```

---

## 🚀 Deployment Checklist

- [ ] `postFeed.js` - Home feed logic ready
- [ ] `reelsFeed.js` - Reels feed logic ready
- [ ] `feedRanker.js` - Shared utilities ready
- [ ] `worker.js` - Updated with feed imports
- [ ] Database - Posts table has `type` column
- [ ] Database - `type` = 'post' or 'reel' values
- [ ] API - `/api/feed?type=post` endpoint working
- [ ] API - `/api/feed?type=reel` endpoint working
- [ ] APK - Integration guide implemented
- [ ] Testing - Feed ranking verified

