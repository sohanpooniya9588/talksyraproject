# 🚀 Phase 2: API Endpoints Documentation

## Complete List of New Endpoints (Phase 2)

### **Follower System Endpoints (5 endpoints)**

#### 1. Follow a User
```http
POST /api/users/:targetUserId/follow
Content-Type: application/json

{
  "follower_id": "current_user_id"
}
```

**Response:**
```json
{
  "status": "followed",
  "message": "Successfully followed user"
}
```

**Example:**
```bash
curl -X POST "https://your-worker.workers.dev/api/users/user-123/follow" \
  -H "Content-Type: application/json" \
  -d '{"follower_id": "current-user-456"}'
```

---

#### 2. Unfollow a User
```http
DELETE /api/users/:targetUserId/unfollow?follower_id=USER_ID
```

**Response:**
```json
{
  "status": "unfollowed",
  "message": "Successfully unfollowed user"
}
```

**Example:**
```bash
curl -X DELETE "https://your-worker.workers.dev/api/users/user-123/unfollow?follower_id=current-user-456"
```

---

#### 3. Get Following List
```http
GET /api/users/:userId/following
```

**Response:** Array of users that this user is following
```json
[
  {
    "id": "user-uuid",
    "username": "creator_name",
    "full_name": "Creator Full Name",
    "profile_pic": "https://...",
    "is_verified": true,
    "follower_count": 10000
  },
  ...
]
```

**Example:**
```bash
curl "https://your-worker.workers.dev/api/users/user-123/following"
```

---

#### 4. Get Followers List
```http
GET /api/users/:userId/followers
```

**Response:** Array of users following this user
```json
[
  {
    "id": "user-uuid",
    "username": "follower_name",
    "full_name": "Follower Name",
    "profile_pic": "https://...",
    "is_verified": false,
    "follower_count": 250
  },
  ...
]
```

---

#### 5. Check If Following
```http
GET /api/users/:targetUserId/isFollowing?userId=CURRENT_USER_ID
```

**Response:**
```json
{
  "isFollowing": true
}
```

**Use Case:** Show/hide "Follow" button in UI

---

### **Hashtag Trending Endpoints (2 endpoints)**

#### 6. Get Trending Hashtags
```http
GET /api/trending/hashtags?limit=10
```

**Response:**
```json
[
  {
    "tag": "viral",
    "usage_count": 523,
    "trend": "up",
    "trend_pct": "15%",
    "last_used": "2026-05-20T10:30:00Z"
  },
  {
    "tag": "trending",
    "usage_count": 412,
    "trend": "up",
    "trend_pct": "8%",
    "last_used": "2026-05-20T10:25:00Z"
  },
  ...
]
```

**Example:**
```bash
curl "https://your-worker.workers.dev/api/trending/hashtags?limit=20"
```

---

#### 7. Get Posts by Hashtag
```http
GET /api/hashtags/:tag/posts?limit=20
```

**Response:** Array of posts containing this hashtag (ranked by engagement)
```json
[
  {
    "id": "post-id",
    "caption": "Love this #viral content",
    "media_url": "https://...",
    "like_count": 5000,
    "comment_count": 250,
    "view_count": 50000,
    "author": {
      "username": "creator",
      "is_verified": true
    },
    "_engagement_rate": "10.5",
    "_score": 8.75
  },
  ...
]
```

**Example:**
```bash
# Search for all #coding posts
curl "https://your-worker.workers.dev/api/hashtags/coding/posts?limit=15"

# Search for #dance (top posts)
curl "https://your-worker.workers.dev/api/hashtags/dance/posts?limit=50"
```

---

### **Creator Analytics Endpoint (1 endpoint)**

#### 8. Get Creator Analytics Dashboard
```http
GET /api/creator/:userId/analytics
```

**Response:**
```json
{
  "user_id": "user-uuid",
  "username": "creator_name",
  
  // Overview Stats
  "total_posts": 45,
  "total_followers": 10200,
  "total_reach": 523000,
  "total_likes": 44290,
  "total_comments": 1250,
  "total_shares": 580,
  "avg_engagement_rate": "8.52",
  
  // Top Performing Posts
  "top_posts": [
    {
      "id": "post-id",
      "caption": "#viral dance",
      "type": "reel",
      "like_count": 12500,
      "comment_count": 850,
      "share_count": 450,
      "view_count": 150000,
      "engagement_rate": "9.5",
      "posted_at": "2026-05-19T10:00:00Z"
    },
    ...
  ],
  
  // Daily Breakdown (Last 7 days)
  "daily_stats": [
    {
      "date": "2026-05-20",
      "posts": 1,
      "reach": 18000,
      "engagement": 1250
    },
    {
      "date": "2026-05-19",
      "posts": 2,
      "reach": 85000,
      "engagement": 6200
    },
    ...
  ],
  
  // Content Type Performance
  "content_type_performance": [
    {
      "type": "reel",
      "total_posts": 30,
      "avg_engagement": "12.5",
      "avg_reach": "18500"
    },
    {
      "type": "post",
      "total_posts": 15,
      "avg_engagement": "5.2",
      "avg_reach": "8200"
    }
  ],
  
  // Creator Tier Info
  "creator_tier": "Star",
  "tier_requirements": {
    "current_tier": "Star",
    "next_tier": "Celebrity",
    "followers_needed": 89800,
    "engagement_needed": "11.48"
  }
}
```

**Example:**
```bash
curl "https://your-worker.workers.dev/api/creator/user-123/analytics"
```

---

### **Personalized Feed (Enhancement to existing endpoint)**

#### Enhanced /api/feed with Personalization
```http
GET /api/feed?type=reel&userId=CURRENT_USER&personalized=true&limit=20&offset=0
```

**Parameters:**
- `type` (string): `post` or `reel` (default: `post`)
- `userId` (string, required for personalization): Current user ID
- `personalized` (boolean): Set to `true` to boost followed creators' posts
- `limit` (int): Posts per page (default: 20, max: 100)
- `offset` (int): Pagination offset (default: 0)

**How It Works:**
1. Fetches user's following list from `followers` table
2. Fetches posts (5x limit) for better ranking
3. Boosts posts from followed creators by 1.5x
4. Sorts by final score
5. Returns top N posts

**Response:**
```json
[
  {
    "id": "post-id",
    "caption": "#trending",
    "media_url": "https://...",
    "like_count": 5000,
    "author": {
      "username": "followed_creator",
      "is_verified": true
    },
    "_personalization_boost": 1.5,
    "_score": 13.125,
    "_engagement_rate": "142.50"
  },
  ...
]
```

**Example:**
```bash
# Non-personalized feed (chronological-ish ranking)
curl "https://your-worker.workers.dev/api/feed?type=reel&userId=user-456&limit=20"

# Personalized feed (shows followed creators first)
curl "https://your-worker.workers.dev/api/feed?type=reel&userId=user-456&personalized=true&limit=20"
```

---

## 🔌 Integration Examples

### Android (Kotlin) Example

```kotlin
import okhttp3.*
import com.google.gson.Gson

val client = OkHttpClient()
val gson = Gson()

// Follow a creator
fun followUser(targetUserId: String, currentUserId: String) {
  val body = RequestBody.create(
    MediaType.parse("application/json"),
    gson.toJson(mapOf("follower_id" to currentUserId))
  )
  
  val request = Request.Builder()
    .url("https://api.talksyra.app/api/users/$targetUserId/follow")
    .post(body)
    .build()
  
  client.newCall(request).enqueue(object: Callback {
    override fun onResponse(call: Call, response: Response) {
      val result = gson.fromJson(response.body?.string(), Map::class.java)
      println("Follow status: ${result["status"]}")
    }
    override fun onFailure(call: Call, e: IOException) { /* handle */ }
  })
}

// Get creator analytics
fun getCreatorAnalytics(userId: String) {
  val request = Request.Builder()
    .url("https://api.talksyra.app/api/creator/$userId/analytics")
    .build()
  
  client.newCall(request).enqueue(object: Callback {
    override fun onResponse(call: Call, response: Response) {
      val analytics = gson.fromJson(response.body?.string(), Map::class.java)
      println("Total reach: ${analytics["total_reach"]}")
      println("Engagement: ${analytics["avg_engagement_rate"]}%")
    }
    override fun onFailure(call: Call, e: IOException) { /* handle */ }
  })
}

// Get trending hashtags
fun getTrendingHashtags() {
  val request = Request.Builder()
    .url("https://api.talksyra.app/api/trending/hashtags?limit=10")
    .build()
  
  client.newCall(request).enqueue(object: Callback {
    override fun onResponse(call: Call, response: Response) {
      val hashtags = gson.fromJson(response.body?.string(), List::class.java)
      hashtags.forEach { tag ->
        println("$tag - trending up")
      }
    }
    override fun onFailure(call: Call, e: IOException) { /* handle */ }
  })
}

// Personalized feed
fun getPersonalizedFeed(userId: String) {
  val url = "https://api.talksyra.app/api/feed?type=reel&userId=$userId&personalized=true&limit=20"
  val request = Request.Builder().url(url).build()
  
  client.newCall(request).enqueue(object: Callback {
    override fun onResponse(call: Call, response: Response) {
      val posts = gson.fromJson(response.body?.string(), List::class.java)
      println("Got ${posts.size} personalized posts")
      // Display posts in RecyclerView
    }
    override fun onFailure(call: Call, e: IOException) { /* handle */ }
  })
}
```

---

### JavaScript (Fetch API) Example

```javascript
const API_URL = 'https://your-worker.workers.dev';

// Follow user
async function followUser(targetUserId, currentUserId) {
  const response = await fetch(`${API_URL}/api/users/${targetUserId}/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ follower_id: currentUserId })
  });
  return await response.json();
}

// Get following list
async function getFollowingList(userId) {
  const response = await fetch(`${API_URL}/api/users/${userId}/following`);
  return await response.json();
}

// Get trending hashtags
async function getTrendingHashtags(limit = 10) {
  const response = await fetch(`${API_URL}/api/trending/hashtags?limit=${limit}`);
  return await response.json();
}

// Get posts by hashtag
async function getHashtagPosts(tag, limit = 20) {
  const response = await fetch(`${API_URL}/api/hashtags/${tag}/posts?limit=${limit}`);
  return await response.json();
}

// Get creator analytics
async function getCreatorAnalytics(userId) {
  const response = await fetch(`${API_URL}/api/creator/${userId}/analytics`);
  return await response.json();
}

// Get personalized feed
async function getPersonalizedFeed(userId, limit = 20) {
  const response = await fetch(
    `${API_URL}/api/feed?type=reel&userId=${userId}&personalized=true&limit=${limit}`
  );
  return await response.json();
}

// Example usage
async function main() {
  const currentUser = 'user-456';
  const targetCreator = 'user-123';
  
  // Follow creator
  await followUser(targetCreator, currentUser);
  
  // Check analytics
  const analytics = await getCreatorAnalytics(targetCreator);
  console.log(`Creator has ${analytics.total_followers} followers`);
  
  // Get trending
  const trending = await getTrendingHashtags(10);
  console.log('Top hashtag:', trending[0].tag);
  
  // Get personalized feed
  const feed = await getPersonalizedFeed(currentUser);
  console.log(`Got ${feed.length} personalized posts`);
}

main();
```

---

## 📊 HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Feed returned, user followed |
| 400 | Bad request | Missing required parameter |
| 401 | Unauthorized | Invalid token |
| 404 | Not found | User/post doesn't exist |
| 429 | Rate limited | Too many requests |
| 500 | Server error | Database error |

---

## 🎯 Creator Tier System

| Tier | Followers | Engagement | Features |
|------|-----------|------------|----------|
| Beginner | <100 | <5% | Basic posting |
| Rising | 100-999 | 5-9.9% | Trending badges |
| Creator | 1K-9.9K | 10-14.9% | Monetization |
| Star | 10K-99.9K | 15-19.9% | Creator dashboard |
| Celebrity | 100K+ | 20%+ | All features |

---

## ⚡ Performance Tips

1. **Cache analytics** — Calculate once, cache 6 hours
2. **Batch follower requests** — Fetch multiple users in one query
3. **Paginate hashtag results** — Use limit + offset for large datasets
4. **Use personalized feed** — 30% higher engagement than generic
5. **Track following list** — Cache locally, refresh on follow/unfollow

---

**API Status**: ✅ Ready for Production
**Last Updated**: May 20, 2026
