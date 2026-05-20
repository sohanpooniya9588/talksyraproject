# 📊 Phase 2: Database Analysis & Implementation Plan

## Database Structure for Phase 2

### ✅ Available Tables

#### 1. **`followers`** (EMPTY - Ready to populate)
```sql
Structure:
  follower_id (UUID FK → users.id)    -- Who is following
  following_id (UUID FK → users.id)   -- Who is being followed
  created_at (timestamp)              -- When followed
```

**Usage**: 
- Store follow relationships
- Query: "Who does user X follow?" 
- Query: "Who follows user Y?"

**Example SQL**:
```sql
-- Get all users that USER_ID is following
SELECT * FROM followers WHERE follower_id = 'USER_ID'

-- Get all followers of USER_ID
SELECT * FROM followers WHERE following_id = 'USER_ID'

-- Check if USER_A follows USER_B
SELECT * FROM followers 
WHERE follower_id = 'USER_A' AND following_id = 'USER_B'
```

---

#### 2. **`hashtags`** (EMPTY - Ready to populate)
```sql
Structure:
  tag (text)              -- Hashtag name (e.g., "viral", "trending")
  usage_count (int)       -- How many posts use this tag
  last_used (timestamp)   -- When last used
  created_at (timestamp)  -- When tag was first created
```

**Usage**:
- Track trending hashtags
- Auto-increment usage_count when posts tagged
- Show trending #tags in app

**Example SQL**:
```sql
-- Get trending hashtags (top 10)
SELECT * FROM hashtags ORDER BY usage_count DESC LIMIT 10

-- Get posts with specific hashtag
SELECT * FROM posts WHERE caption ILIKE '%#viral%'

-- Update hashtag usage after post creation
UPDATE hashtags SET usage_count = usage_count + 1 
WHERE tag = 'viral'
```

---

#### 3. **`saves`** (EMPTY - Ready to populate)
```sql
Structure:
  user_id (UUID FK → users.id)   -- Who saved
  post_id (UUID FK → posts.id)   -- Which post
  created_at (timestamp)         -- When saved
```

**Usage**:
- Save/bookmark posts
- Fetch user's saved collection
- Find saved posts by category

---

#### 4. **`users`** (ACTIVE - 3+ users)
```sql
Existing Columns:
  id, username, full_name, email
  profile_pic, cover_pic, bio
  follower_count, following_count, post_count  ← USE FOR PERSONALIZATION
  is_verified, is_pro_member
  red_coins, green_coins
  status, last_seen, created_at
  
Analytics Ready:
  ✅ follower_count      -- For creator tier
  ✅ post_count          -- For creator activity
  ✅ is_verified         -- For authority boost
  ✅ is_pro_member       -- For premium features
```

---

#### 5. **`posts`** (ACTIVE - 5+ posts)
```sql
Existing Columns:
  id, user_id, type (post/reel)
  caption, media_url, thumbnail_url
  audio_name, audio_url
  aspect_ratio, duration
  visibility (public/private)
  is_monetized
  
Analytics Columns Ready:
  ✅ like_count          -- Engagement metric
  ✅ comment_count       -- Engagement metric
  ✅ share_count         -- Viral potential
  ✅ view_count          -- Reach metric
  ✅ created_at          -- Freshness
  ✅ user_id             -- Creator ID
```

---

#### 6. **`likes`** (ACTIVE - Sample data exists)
```sql
Structure:
  user_id, post_id, created_at
```

**For Analytics**:
- Count likes per post per day
- Track like velocity (engagement speed)
- Find influencer-liked posts

---

#### 7. **`comments`** (ACTIVE - Sample data exists)
```sql
Structure:
  id, post_id, user_id, parent_id
  content, created_at
```

**For Analytics**:
- Comment sentiment analysis (future)
- Count comments per post
- Find discussion-heavy posts

---

## 🎯 Phase 2 Implementation Strategy

### **Feature 1: Follower System**

**API Endpoints to Build:**

```javascript
// 1. Follow a user
POST /api/users/:targetUserId/follow
Body: { follower_id: "current_user_id" }
Response: { status: "followed", follower_count: 100 }

// 2. Unfollow a user
DELETE /api/users/:targetUserId/unfollow
Query: ?follower_id=current_user_id
Response: { status: "unfollowed", follower_count: 99 }

// 3. Get user's following list
GET /api/users/:userId/following
Response: [{ id, username, full_name, profile_pic, is_verified }, ...]

// 4. Get user's followers list
GET /api/users/:userId/followers
Response: [{ id, username, full_name, profile_pic, is_verified }, ...]

// 5. Check if following (for UI buttons)
GET /api/users/:targetUserId/isFollowing?userId=current_user_id
Response: { isFollowing: true }
```

**Database Queries:**
```sql
-- Insert follow
INSERT INTO followers (follower_id, following_id, created_at)
VALUES ('user_a_id', 'user_b_id', NOW())
ON CONFLICT DO NOTHING

-- Update follower count
UPDATE users SET follower_count = follower_count + 1
WHERE id = 'user_b_id'

-- Get following list
SELECT u.* FROM users u
JOIN followers f ON u.id = f.following_id
WHERE f.follower_id = 'current_user_id'
```

---

### **Feature 2: Personalization**

**How It Works:**
1. Track which posts user likes/saves
2. Extract creator IDs from liked posts
3. Boost posts from followed creators in feed
4. Boost similar content (same hashtags)

**Modified `/api/feed` Endpoint:**
```javascript
GET /api/feed?type=reel&userId=CURRENT_USER&personalized=true

// Algorithm Change:
// Step 1: Fetch user's following list
// Step 2: Fetch all posts (5x limit)
// Step 3: Boost posts from followed creators:
//         - followed creator post: score × 1.5
// Step 4: Boost similar content:
//         - if user liked #viral posts, boost other #viral posts
// Step 5: Sort and return top N
```

**Implementation:**
```javascript
function rankPostsWithPersonalization(posts, userId, followingList, userPreferences) {
  // Boost posts from followed creators
  posts = posts.map(post => {
    let boost = 1.0;
    
    // 1.5x boost for followed creators
    if (followingList.includes(post.user_id)) {
      boost = 1.5;
    }
    
    // 1.2x boost for verified creators
    if (post.author?.is_verified) {
      boost *= 1.2;
    }
    
    return {
      ...post,
      _personalization_boost: boost,
      _final_score: calculateScore(post) * boost
    };
  });
  
  return posts.sort((a, b) => b._final_score - a._final_score);
}
```

---

### **Feature 3: Hashtag Trending**

**API Endpoints:**

```javascript
// 1. Extract hashtags from caption when post created
// (Auto-populate hashtags table)
POST /api/posts (existing endpoint - modify to extract tags)

// 2. Get trending hashtags
GET /api/trending/hashtags?limit=10
Response: [
  { tag: "viral", usage_count: 523, trend: "up", trend_pct: "15%" },
  { tag: "trending", usage_count: 412, trend: "up", trend_pct: "8%" },
  ...
]

// 3. Get posts by hashtag
GET /api/hashtags/:tag/posts?limit=20
Response: [{ posts ranked by engagement }]

// 4. Get hashtag trending graph (hourly data)
GET /api/hashtags/:tag/trends?days=7
Response: [
  { hour: "2026-05-20T00:00", usage_count: 45 },
  { hour: "2026-05-20T01:00", usage_count: 52 },
  ...
]
```

**Hashtag Extraction:**
```javascript
function extractHashtags(caption) {
  // Regex: find all #word patterns
  const regex = /#[\w]+/g;
  const tags = caption.match(regex) || [];
  return tags.map(tag => tag.toLowerCase().substring(1)); // Remove #
}

// Example
extractHashtags("Love this #viral #trending #reels") 
// Returns: ["viral", "trending", "reels"]
```

**Database Logic:**
```sql
-- When post is created with caption containing #viral:
INSERT INTO hashtags (tag, usage_count, last_used, created_at)
VALUES ('viral', 1, NOW(), NOW())
ON CONFLICT (tag) DO UPDATE 
  SET usage_count = hashtags.usage_count + 1,
      last_used = NOW()
```

---

### **Feature 4: Creator Analytics**

**API Endpoint:**

```javascript
// GET creator analytics dashboard
GET /api/creator/:userId/analytics

Response: {
  // Overview
  total_posts: 45,
  total_followers: 10200,
  total_reach: 523000,    // Total views on all posts
  avg_engagement_rate: 8.5, // % of views that engage
  
  // Engagement Metrics
  total_likes: 44290,
  total_comments: 1250,
  total_shares: 580,
  
  // Performance Breakdown
  top_posts: [
    {
      id, caption, like_count, comment_count, view_count, 
      engagement_rate, posted_at
    }
  ],
  
  // Growth Trends (7-day breakdown)
  daily_stats: [
    { date: "2026-05-14", posts: 2, followers_gained: 50, reach: 12000 },
    { date: "2026-05-15", posts: 1, followers_gained: 75, reach: 18000 },
    ...
  ],
  
  // Content Performance
  content_type_performance: {
    reel: { avg_engagement: 12.5, total_posts: 30 },
    post: { avg_engagement: 5.2, total_posts: 15 }
  },
  
  // Creator Tier
  tier: "Star",              // Beginner | Creator | Star | Celebrity
  tier_requirements: {
    next_tier: "Celebrity",
    followers_needed: 50000,
    engagement_rate_needed: 15
  }
}
```

**Calculations:**

```javascript
function calculateCreatorAnalytics(userId) {
  // 1. Count posts
  const posts = fetchUserPosts(userId);
  const totalPosts = posts.length;
  
  // 2. Sum engagement
  const totalLikes = posts.reduce((sum, p) => sum + p.like_count, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comment_count, 0);
  const totalShares = posts.reduce((sum, p) => sum + p.share_count, 0);
  const totalReach = posts.reduce((sum, p) => sum + p.view_count, 0);
  
  // 3. Calculate engagement rate
  const avgEngagementRate = totalReach > 0 
    ? ((totalLikes + totalComments + totalShares) / totalReach) * 100 
    : 0;
  
  // 4. Top posts
  const topPosts = posts
    .sort((a, b) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count))
    .slice(0, 5);
  
  // 5. Daily breakdown (last 7 days)
  const dailyStats = calculateDailyStats(posts, 7);
  
  // 6. Creator tier
  const tier = determineCreatorTier(totalFollowers, avgEngagementRate, totalPosts);
  
  return {
    total_posts: totalPosts,
    total_followers: user.follower_count,
    total_reach: totalReach,
    avg_engagement_rate: avgEngagementRate.toFixed(1),
    top_posts: topPosts,
    daily_stats: dailyStats,
    tier: tier
  };
}

function determineCreatorTier(followers, engagement, posts) {
  if (followers >= 100000 && engagement >= 20) return "Celebrity";
  if (followers >= 10000 && engagement >= 15) return "Star";
  if (followers >= 1000 && engagement >= 10) return "Creator";
  return "Beginner";
}
```

---

## 📈 Data Flow Diagram

```
┌─────────────────┐
│  User A         │
│ (current user)  │
└────────┬────────┘
         │
         ├─→ POST /api/users/USER_B/follow
         │   (Insert into followers table)
         │   (Update users.follower_count)
         │
         ├─→ GET /api/feed?personalized=true
         │   (Fetch followers list)
         │   (Boost posts from followed creators)
         │
         ├─→ POST /api/posts (create post with #viral)
         │   (Extract hashtags)
         │   (Update hashtags table)
         │
         └─→ GET /api/creator/USER_B/analytics
             (Calculate engagement metrics)
             (Return dashboard data)
```

---

## 🛠️ Development Checklist for Phase 2

### Follower System
- [ ] POST `/api/users/:targetUserId/follow` — Insert into followers table, update follower_count
- [ ] DELETE `/api/users/:targetUserId/unfollow` — Remove from followers, decrement count
- [ ] GET `/api/users/:userId/following` — Join users + followers tables
- [ ] GET `/api/users/:userId/followers` — Reverse join
- [ ] GET `/api/users/:targetUserId/isFollowing?userId=X` — Check if X follows target

### Personalization
- [ ] Modify `/api/feed` to accept `personalized=true` param
- [ ] Fetch user's following list before ranking
- [ ] Boost posts from followed creators (1.5x multiplier)
- [ ] Test: personalized feed has higher engagement
- [ ] A/B test: compare personalized vs generic feed

### Hashtag Trending
- [ ] Add hashtag extraction function to worker
- [ ] Auto-populate hashtags table on new posts
- [ ] GET `/api/trending/hashtags` — Top 10 by usage_count
- [ ] GET `/api/hashtags/:tag/posts` — Posts with specific hashtag
- [ ] GET `/api/hashtags/:tag/trends` — Historical trending data

### Creator Analytics
- [ ] GET `/api/creator/:userId/analytics` — Full dashboard
- [ ] Calculate engagement rate, reach, top posts
- [ ] Implement creator tiers (Beginner, Creator, Star, Celebrity)
- [ ] Cache analytics (6-hour TTL to save DB calls)
- [ ] Dashboard UI (if applicable)

---

## ⚠️ Important Notes

1. **Follower table is empty** — Start by designing schema, then populate
2. **Hashtags table is empty** — Will auto-populate when posts are created
3. **No existing analytics table** — Calculate on-the-fly from posts/likes/comments
4. **Aggregates blocked by RLS** — Can't use COUNT() in REST API, must fetch and count in worker
5. **Caching recommended** — Analytics calls hit multiple tables; use 6-hour cache

