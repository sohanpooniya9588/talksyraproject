# 🚀 TalkSyra Complete Database & API Documentation

**Last Updated**: May 20, 2026  
**Project**: TalkSyra - Instagram-like Social Media Platform  
**Tech Stack**: Supabase (PostgreSQL) + Deno/TypeScript + Cloudflare Workers

---

## 📊 DATABASE SCHEMA - All 40 Tables

### 1️⃣ **USERS TABLE** (Core)
```sql
columns: id, username, full_name, email, profile_pic, cover_pic
         bio, website, location, birth_date, is_verified, is_pro_member
         red_coins, green_coins, follower_count, following_count, post_count
         status, last_seen, created_at, is_private, password
```
**Purpose**: User profiles and authentication  
**Size**: 3+ users currently  
**Relationships**: Posts, Likes, Comments, Followers, Messages

---

### 2️⃣ **POSTS TABLE** (Core - Content)
```sql
columns: id, user_id (FK->users), type (post|reel)
         caption, media_url, thumbnail_url
         audio_name, audio_url, aspect_ratio, duration
         visibility (public|private), is_monetized
         like_count, comment_count, share_count, view_count
         location_name, created_at
```
**Purpose**: User posts and reels  
**Size**: 5+ posts currently  
**Features**:
- Posts can be text with media or video reels
- Smart feed ranking based on engagement
- View tracking and analytics
- Monetization support

---

### 3️⃣ **LIKES TABLE**
```sql
columns: user_id (FK->users), post_id (FK->posts), created_at
```
**Purpose**: Track post likes  
**Size**: 1+ records  
**Features**: 
- Unlike functionality (delete record)
- Like count tracking

---

### 4️⃣ **COMMENTS TABLE**
```sql
columns: id, post_id (FK->posts), user_id (FK->users)
         parent_id (for nested replies), content, created_at
```
**Purpose**: Comments and nested replies  
**Features**: 
- Rate limiting: 1 comment per 10 seconds per user
- Reply to comments (parent_id)
- Character limit: 500 chars

---

### 5️⃣ **FOLLOWERS TABLE** (Empty - Ready)
```sql
columns: follower_id (FK->users), following_id (FK->users), created_at
```
**Purpose**: Follow relationships  
**Status**: Empty, ready to implement  
**Relationships**: Updates follower_count, following_count in users table

---

### 6️⃣ **SAVES TABLE** (Empty - Ready)
```sql
columns: user_id (FK->users), post_id (FK->posts), created_at
```
**Purpose**: Bookmark/save posts  
**Status**: Empty  
**Use Case**: Users save posts for later viewing

---

### 7️⃣ **HASHTAGS TABLE** (Empty - Ready)
```sql
columns: tag, usage_count, last_used, created_at
```
**Purpose**: Track trending hashtags  
**Status**: Empty  
**Features**: Auto-update usage_count when posts tagged

---

### 8️⃣ **STORIES TABLE** (Empty - Ready)
```sql
columns: Similar to posts but for ephemeral content
         user_id, media_url, caption, is_active, created_at
```
**Purpose**: Temporary stories (24-hour posts)  
**Status**: Empty

---

### 9️⃣ **STORY_VIEWS TABLE** (Empty - Ready)
```sql
columns: story_id (FK->stories), user_id (FK->users), viewed_at
```
**Purpose**: Track who viewed each story  
**Status**: Empty

---

### 🔟 **NOTIFICATIONS TABLE** (Empty - Ready)
```sql
columns: id, user_id, type (like|comment|follow)
         actor_id (who triggered it), post_id, created_at, read
```
**Purpose**: User notifications  
**Status**: Empty

---

### 1️⃣1️⃣ **MESSAGES TABLE** (Empty - Ready)
```sql
columns: id, conversation_id, user_id (sender)
         content, type (text|media), media_url, created_at
```
**Purpose**: Direct messages  
**Status**: Empty

---

### 1️⃣2️⃣ **CONVERSATIONS TABLE** (Empty - Ready)
```sql
columns: id, type (direct|group), created_at, updated_at
```
**Purpose**: Group chats or DM conversations  
**Status**: Empty

---

### 1️⃣3️⃣ **CONVERSATION_MEMBERS TABLE** (Empty - Ready)
```sql
columns: conversation_id (FK->conversations)
         user_id (FK->users), joined_at
```
**Purpose**: Memberships in conversations  
**Status**: Empty

---

### 1️⃣4️⃣ **BLOCKS TABLE** (Empty - Ready)
```sql
columns: blocker_id (FK->users), blocked_id (FK->users), created_at
```
**Purpose**: User blocking feature  
**Status**: Empty

---

### 1️⃣5️⃣ **REPORTS TABLE** (Empty - Ready)
```sql
columns: id, reporter_id (FK->users)
         target_type (post|user|comment)
         target_id, reason, description, created_at, status
```
**Purpose**: Content moderation reports  
**Status**: Empty

---

### 1️⃣6️⃣ **TRANSACTIONS TABLE** (Empty - Ready)
```sql
columns: id, user_id, coin_type (red|green)
         amount, transaction_type (purchase|earn|gift)
         description, created_at
```
**Purpose**: Coin transactions and analytics  
**Status**: Empty

---

### 1️⃣7️⃣ **COINS_TRANSACTION_LOG TABLE** (Empty - Ready)
```sql
columns: id, user_id, old_balance, new_balance
         coin_type, amount, reason, created_at
```
**Purpose**: Audit log for coin changes  
**Status**: Empty

---

### 1️⃣8️⃣ **CONTENT_MODERATION_QUEUE TABLE** (Empty - Ready)
```sql
columns: id, post_id, user_id (reported)
         reason, status (pending|approved|rejected)
         reviewer_id, created_at
```
**Purpose**: Content moderation workflow  
**Status**: Empty

---

### 1️⃣9️⃣ **POST_HASHTAGS TABLE** (Empty - Ready)
```sql
columns: post_id (FK->posts), hashtag_id (FK->hashtags)
```
**Purpose**: Many-to-many relationship for posts and hashtags  
**Status**: Empty

---

### 2️⃣0️⃣ **POST_VIEWS_TIMELINE TABLE** (Empty - Ready)
```sql
columns: post_id, view_count, viewed_at (timestamp bucketed)
```
**Purpose**: Track views over time for analytics  
**Status**: Empty

---

### 2️⃣1️⃣ **USER_ACTIVITY_LOG TABLE** (Empty - Ready)
```sql
columns: id, user_id, action (login|logout|post|like|comment)
         timestamp, ip_address, device_info
```
**Purpose**: User behavior analytics  
**Status**: Empty

---

### 2️⃣2️⃣ **USER_ANALYTICS TABLE** (Empty - Ready)
```sql
columns: id, user_id, total_likes, total_comments
         total_followers, total_views, engagement_rate
         date (daily aggregation), created_at
```
**Purpose**: Daily aggregated user analytics  
**Status**: Empty

---

### 2️⃣3️⃣ **USER_INTERESTS TABLE** (Empty - Ready)
```sql
columns: user_id (FK->users), interest (category/tag)
         score (weight for personalization)
```
**Purpose**: Store user interests for feed personalization  
**Status**: Empty

---

### 2️⃣4️⃣ **USER_PREFERENCES TABLE** (Empty - Ready)
```sql
columns: user_id (FK->users)
         theme (dark|light), language, notification_settings
         privacy_level, updated_at
```
**Purpose**: User settings and preferences  
**Status**: Empty

---

### 2️⃣5️⃣ **TRENDING_POSTS TABLE** (Empty - Ready)
```sql
columns: post_id (FK->posts), trend_score
         trending_at, category
```
**Purpose**: Cache trending posts for fast retrieval  
**Status**: Empty

---

### 2️⃣6️⃣ **RECOMMENDATIONS TABLE** (Empty - Ready)
```sql
columns: id, user_id (recipient)
         recommended_user_id, score, reason (similar_interests|mutual_friends)
         created_at
```
**Purpose**: Personalized user recommendations  
**Status**: Empty

---

### 2️⃣7️⃣ **SEARCH_HISTORY TABLE** (Empty - Ready)
```sql
columns: id, user_id, search_query, result_type
         created_at
```
**Purpose**: Track user search history  
**Status**: Empty

---

### 2️⃣8️⃣ **DEVICE_INFO TABLE** (Empty - Ready)
```sql
columns: id, user_id, device_type (mobile|web)
         device_name, os, app_version, last_seen
```
**Purpose**: Device and app version tracking  
**Status**: Empty

---

### 2️⃣9️⃣ **ENGAGEMENT_ANALYTICS TABLE** (Empty - Ready)
```sql
columns: id, post_id, metric_type (like|comment|view|save)
         count, timestamp (hourly), updated_at
```
**Purpose**: Hourly engagement metrics  
**Status**: Empty

---

### 3️⃣0️⃣ **FEED_CACHE TABLE** (Empty - Ready)
```sql
columns: id, user_id, feed_type (home|trending|explore)
         cached_posts (JSON), generated_at, expires_at
```
**Purpose**: Cache generated feeds for performance  
**Status**: Empty

---

### 3️⃣1️⃣ **FEED_RANKING_SCORES TABLE** (Empty - Ready)
```sql
columns: post_id, engagement_score, freshness_score
         creator_quality_score, velocity_score, total_score
         calculated_at
```
**Purpose**: Pre-calculated ranking scores for fast feed generation  
**Status**: Empty

---

### 3️⃣2️⃣ **REPOSTS TABLE** (Empty - Ready)
```sql
columns: id, original_post_id (FK->posts)
         repost_by_user_id (FK->users), created_at
```
**Purpose**: Track reposted/shared content  
**Status**: Empty

---

### 3️⃣3️⃣ **POLL_OPTIONS TABLE** (Empty - Ready)
```sql
columns: id, poll_id, option_text, vote_count
```
**Purpose**: Poll options for voting features  
**Status**: Empty

---

### 3️⃣4️⃣ **POLL_VOTES TABLE** (Empty - Ready)
```sql
columns: id, poll_id, user_id, option_id, created_at
```
**Purpose**: Track individual poll votes  
**Status**: Empty

---

### 3️⃣5️⃣ **POLLS TABLE** (Empty - Ready)
```sql
columns: id, post_id (FK->posts), question
         created_at, expires_at, total_votes
```
**Purpose**: Poll/survey in posts  
**Status**: Empty

---

### 3️⃣6️⃣ **STORY_HIGHLIGHTS TABLE** (Empty - Ready)
```sql
columns: id, user_id, title, cover_image_url
         stories (JSON array of story_ids), created_at
```
**Purpose**: Permanent story collections  
**Status**: Empty

---

### 3️⃣7️⃣ **ADS TABLE** (Empty - Ready)
```sql
columns: id, advertiser_id (FK->users)
         title, description, media_url, target_url
         budget, daily_budget, spent, impressions, clicks
         status, created_at, expires_at
```
**Purpose**: Advertising system  
**Status**: Empty

---

### 3️⃣8️⃣ **GROUPS TABLE** (Empty - Ready)
```sql
columns: id, name, description, icon_url
         creator_id (FK->users), member_count, is_private
         created_at
```
**Purpose**: Group/community functionality  
**Status**: Empty

---

### 3️⃣9️⃣ **GROUP_MEMBERS TABLE** (Empty - Ready)
```sql
columns: group_id (FK->groups), user_id (FK->users)
         role (admin|moderator|member), joined_at
```
**Purpose**: Group memberships  
**Status**: Empty

---

### 4️⃣0️⃣ **CALLS TABLE** (Empty - Ready)
```sql
columns: id, initiator_id, receiver_id
         type (audio|video), status (initiated|accepted|declined|ended)
         started_at, ended_at, duration
```
**Purpose**: Voice and video calls  
**Status**: Empty

---

## 🔗 API ENDPOINTS - Complete Reference

### **BASE URL**: `https://your-worker.workers.dev/api`

### **AUTHENTICATION**
```
Header: Authorization: Bearer <user_token>
```

---

## 📝 ENDPOINT CATEGORIES

### **POSTS** (6 endpoints)
- `GET /posts/feed` - Chronological feed
- `GET /posts/reels` - Smart ranked feed (For You page)
- `POST /posts` - Create post
- `GET /posts/:postId` - Get single post
- `PUT /posts/:postId` - Update post
- `DELETE /posts/:postId` - Delete post

### **LIKES** (3 endpoints)
- `POST /likes` - Like/unlike toggle
- `GET /likes/:postId/check` - Check if liked
- `GET /users/:userId/likes` - Get user liked posts

### **COMMENTS** (3 endpoints)
- `POST /comments` - Create comment/reply
- `GET /posts/:postId/comments` - Get post comments
- `DELETE /comments/:commentId` - Delete comment

### **FOLLOWS** (4 endpoints)
- `POST /follows` - Follow user
- `DELETE /follows/:userId` - Unfollow user
- `GET /follows/:userId/check` - Check if following
- `GET /users/:userId/followers` - Get followers list
- `GET /users/:userId/following` - Get following list

### **SAVES** (3 endpoints)
- `POST /saves` - Save post
- `DELETE /saves/:postId` - Unsave post
- `GET /users/:userId/saves` - Get saved posts

### **USERS** (4 endpoints)
- `GET /users/:userId` - Get user profile
- `PUT /users/:userId` - Update profile
- `GET /users/search/:username` - Search by username
- `GET /users/:userId/posts` - Get user posts

### **SEARCH** (3 endpoints)
- `GET /search?q=query&type=all` - Global search
- `GET /hashtags/:tag/posts` - Posts by hashtag
- `GET /trending/hashtags` - Trending hashtags

### **STORIES** (4 endpoints)
- `POST /stories` - Create story
- `GET /users/:userId/stories` - Get user stories
- `GET /stories/feed` - Stories feed
- `DELETE /stories/:storyId` - Delete story

### **MESSAGES** (3 endpoints)
- `GET /conversations` - List conversations
- `GET /conversations/:id/messages` - Get messages
- `POST /messages` - Send message

### **NOTIFICATIONS** (2 endpoints)
- `GET /notifications` - Get notifications
- `PUT /notifications/:id` - Mark as read

### **COINS & TRANSACTIONS** (3 endpoints)
- `GET /coins/balance` - Get coin balance
- `POST /transactions` - Create transaction
- `GET /transactions` - Get transaction history

### **ADDITIONAL** (5+ endpoints)
- Blocking, reporting, analytics, settings, rewards

---

## 🎯 SMART FEED RANKING ALGORITHM

### Formula:
```
Total Score = (Engagement × 50%) + (Freshness × 20%) 
            + (Creator Quality × 15%) + (Velocity × 10%)
            + (Public Boost × 5%)

Where:
- Engagement = (likes × 1.0) + (comments × 2.0) + (shares × 3.0) + (views × 0.1)
- Freshness = 1 - (days_old / 7) [weekly decay]
- Creator Quality = follower_count/100k + is_verified_bonus
- Velocity = view_count/10000
- Public Boost = fixed +10 points
```

### Result:
- **Posts ranked 0-10**: Show first (top quality)
- **Posts ranked 5-7**: Show next (good engagement)
- **Posts ranked < 5**: Show less (needs engagement)

---

## 🔒 SECURITY FEATURES

1. **Row Level Security (RLS)**: PostgreSQL enforces user data isolation
2. **JWT Authentication**: Supabase Auth tokens validated on every request
3. **Service Role Keys**: Used only on trusted servers (workers/functions)
4. **Rate Limiting**: Built into endpoints (comments: 10s window, etc.)
5. **Input Validation**: All payloads checked before DB insert

---

## 📱 APK INTEGRATION GUIDE

### Setup in APK:
```javascript
const API_URL = "https://your-worker.workers.dev/api"
const USER_TOKEN = "user_jwt_token_from_auth"

// Headers for all requests
const headers = {
  'Authorization': `Bearer ${USER_TOKEN}`,
  'Content-Type': 'application/json'
}

// Example: Get feed
const response = await fetch(`${API_URL}/posts/reels?limit=20`, {
  headers
})
const { reels } = await response.json()
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [x] 40 tables created
- [x] User authentication setup
- [x] Like/Unlike system
- [x] Comment system with rate limiting
- [ ] Follow/Unfollow (ready to activate)
- [ ] Save/Bookmark (ready)
- [ ] Hashtags & Trending (ready)
- [ ] Stories feature (ready)
- [ ] Direct messages (ready)
- [ ] Notifications (ready)
- [ ] Advanced analytics (ready)

---

## 🚀 NEXT STEPS

1. **Activate Follow System**: Enable follows table usage
2. **Populate Hashtags**: Auto-extract from captions
3. **Feed Personalization**: Use user_interests table
4. **Stories Feature**: Enable 24-hour content
5. **Analytics Dashboard**: Aggregate user_analytics
6. **Notifications**: Trigger on likes/comments/follows
7. **Messages**: Full messaging system
8. **Monetization**: Implement coin system

---

## 📞 CONTACT & SUPPORT

**Created for**: TalkSyra APK Development  
**Version**: 2.0 (Complete)  
**Last Updated**: May 20, 2026

---

**Total Development Endpoints**: 60+  
**Tables Available**: 40  
**Active Tables with Data**: 4 (users, posts, likes, comments)  
**Ready to Activate**: 36
