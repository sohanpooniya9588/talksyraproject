# 🎬 TalkSyra Feed API Documentation

Complete guide for feed endpoints - Home Posts Feed & Reels Feed

---

## 📡 API Base URLs

| Environment | Domain | Purpose |
|-------------|--------|---------|
| **Production** | `https://shorts.talksyra.app` | Cloudflare Worker (API) |
| **Media** | `https://api.talksyra.app` | R2 Storage (Images/Videos) |
| **Database** | `https://frmazzmzyychdfajnslt.supabase.co` | Supabase Backend |

---

## 🏠 Feed Endpoint: `/api/feed`

Get personalized smart-ranked feed with both posts and reels.

### Request Parameters

```
GET /api/feed?type=post&userId=USER_ID&limit=20&offset=0&personalized=true
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | ❌ No | `post` | Feed type: `post` (home) or `reel` (shorts) |
| `userId` | string | ❌ No | - | User ID for personalization & like status |
| `limit` | number | ❌ No | 20 | Posts per page (max: 100) |
| `offset` | number | ❌ No | 0 | Pagination offset |
| `personalized` | boolean | ❌ No | false | Show only following's posts |

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "post-123",
      "type": "post",
      "caption": "Amazing sunset 🌅 #travel #photography",
      "media_url": "https://api.talksyra.app/posts/post-123.jpg",
      "thumbnail_url": "https://api.talksyra.app/posts/post-123-thumb.jpg",
      "audio_url": null,
      "aspect_ratio": "4/3",
      "duration": null,
      "visibility": "public",
      "location_name": "Taj Mahal, Agra",
      "like_count": 1250,
      "comment_count": 89,
      "share_count": 45,
      "view_count": 8900,
      "created_at": "2026-05-20T10:30:00Z",
      "updated_at": "2026-05-22T15:45:00Z",
      "score": 8.75,
      "is_liked": false,
      "author": {
        "id": "user-456",
        "username": "john_travels",
        "full_name": "John Traveler",
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

---

## 🎞️ Reel Feed Specifics

### Reel-Specific Endpoint

```
GET /api/feed?type=reel&userId=USER_ID&limit=10
```

**Reel Response Example:**
```json
{
  "id": "reel-789",
  "type": "reel",
  "caption": "POV: You're learning JavaScript 😅 #coding #tutorial",
  "media_url": "https://api.talksyra.app/reels/reel-789.mp4",
  "thumbnail_url": "https://api.talksyra.app/reels/reel-789-thumb.jpg",
  "audio_url": "https://api.talksyra.app/audio/reel-789-audio.mp3",
  "aspect_ratio": "9/16",
  "duration": 45,
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
    "username": "code_ninja",
    "full_name": "Programming Ninja",
    "profile_pic": "https://api.talksyra.app/avatars/user-789.jpg",
    "is_verified": true,
    "follower_count": 125000
  }
}
```

**Key Reel Fields:**
- `duration` - Video length in seconds (typically 15-120 seconds)
- `audio_url` - Background music/audio track
- `aspect_ratio` - Always `9/16` for vertical video
- `media_url` - MP4/WebM video file
- `thumbnail_url` - Preview image for before play

---

## 🏠 Home Feed Specifics

### Home Feed Endpoint

```
GET /api/feed?type=post&userId=USER_ID&limit=20
```

**Home Post Response Example:**
```json
{
  "id": "post-456",
  "type": "post",
  "caption": "Delicious biryani! Best restaurant in the city 👨‍🍳",
  "media_url": "https://api.talksyra.app/posts/post-456.jpg",
  "thumbnail_url": "https://api.talksyra.app/posts/post-456-thumb.jpg",
  "audio_url": null,
  "aspect_ratio": "4/3",
  "duration": null,
  "visibility": "public",
  "location_name": "Mumbai, India",
  "like_count": 2300,
  "comment_count": 156,
  "share_count": 234,
  "view_count": 18000,
  "created_at": "2026-05-22T14:20:00Z",
  "score": 8.23,
  "is_liked": false,
  "author": {
    "id": "user-555",
    "username": "foodie_life",
    "full_name": "Food Explorer",
    "profile_pic": "https://api.talksyra.app/avatars/user-555.jpg",
    "is_verified": false,
    "follower_count": 8500
  }
}
```

**Key Home Post Fields:**
- `duration` - Always `null` for posts
- `audio_url` - Usually `null`
- `aspect_ratio` - Varies (4:3, 16:9, 1:1, etc.)
- `media_url` - JPG/PNG image file
- `location_name` - Optional location tag

---

## 🔍 Smart Ranking Algorithm

Posts are ranked using a **composite score** that surfaces good creators and engaging content:

### Formula

```
FINAL_SCORE = 
  log10(ENGAGEMENT + 1) × 0.50        [50% - Engagement]
  + FRESHNESS × 0.20                  [20% - Freshness]
  + log10(CREATOR_QUALITY + 1) × 0.15 [15% - Creator]
  + log10(VELOCITY + 1) × 0.10        [10% - Velocity]
  + (visibility=='public' ? 0.05 : 0) [5% - Public Boost]
```

### Engagement (50%)
```
ENGAGEMENT = 
  likes × 1.0 
  + comments × 2.5
  + shares × 5.0
  + views × 0.05
```

### Freshness (20%)
```
FRESHNESS = max(0, 1.0 - (post_age_days / 7.0))
-- 0 days old → 1.0 (perfect)
-- 3.5 days old → 0.5
-- 7 days old → 0.0 (stale)
```

### Creator Quality (15%)
```
CREATOR_QUALITY = 
  log10(follower_count + 1) × (is_verified ? 1.5 : 1.0)
```

### Velocity (10%)
```
VELOCITY = ENGAGEMENT / (post_age_days + 1)
-- How fast the post is getting engagement
```

---

## 🛑 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid type parameter. Use 'post' or 'reel'",
  "code": "INVALID_TYPE"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Missing or invalid API key",
  "code": "UNAUTHORIZED"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Database connection failed",
  "code": "DATABASE_ERROR"
}
```

---

## 📊 Usage Examples

### 1. Get Home Feed (First 20 Posts)
```bash
curl "https://shorts.talksyra.app/api/feed?type=post&userId=user123&limit=20&offset=0"
```

### 2. Get Reels Feed with Personalization
```bash
curl "https://shorts.talksyra.app/api/feed?type=reel&userId=user123&limit=10&offset=0&personalized=true"
```

### 3. Pagination - Next Page
```bash
curl "https://shorts.talksyra.app/api/feed?type=post&userId=user123&limit=20&offset=20"
```

### 4. Anonymous User (No Personalization)
```bash
curl "https://shorts.talksyra.app/api/feed?type=reel&limit=15"
```

---

## 🔄 Pagination Guide

Implement lazy-loading with pagination:

```javascript
// Start at offset 0
offset = 0;

// Load more when user scrolls
async function loadMorePosts() {
  const response = await fetch(
    `https://shorts.talksyra.app/api/feed?type=post&userId=${userId}&limit=20&offset=${offset}`
  );
  const data = await response.json();
  
  // Add posts to UI
  addPostsToFeed(data.data);
  
  // Increment for next load
  offset += data.data.length;
  
  // Check if more available
  if (!data.pagination.has_more) {
    showEndOfFeedMessage();
  }
}
```

---

## ⚡ Performance Tips

1. **Batch Requests**: Load 20-30 posts per request
2. **Cache Thumbnails**: Store `thumbnail_url` locally for faster display
3. **Preload Next**: When user is 5 posts from end, fetch next batch
4. **Use Compression**: Request should include `Accept-Encoding: gzip`
5. **Connection Pooling**: Reuse HTTP connections

---

## 📱 Client Integration Summary

- **Home Feed**: `type=post` - Standard image/text posts
- **Reels Feed**: `type=reel` - Vertical videos
- **Personalized**: Set `personalized=true` + `userId` for following only
- **Sorting**: Automatic AI ranking (highest score first)
- **Caching**: Server-side smart caching in `feed_cache` table
