# 📱 TalkSyra Complete API Endpoints Documentation

## 🔐 Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <user_token>
```

---

## 📝 BASE ENDPOINTS

### Base URL
```
https://your-worker.workers.dev/api
```

---

## 👤 USER ENDPOINTS

### 1. Get User Profile
```http
GET /users/:userId
```
**Response:**
```json
{
  "id": "uuid",
  "username": "creator_name",
  "full_name": "Full Name",
  "email": "email@example.com",
  "profile_pic": "https://...",
  "cover_pic": "https://...",
  "bio": "Bio text",
  "website": "https://...",
  "location": "City, Country",
  "birth_date": "2000-01-01",
  "is_verified": true,
  "is_pro_member": true,
  "red_coins": 5000,
  "green_coins": 2000,
  "follower_count": 10000,
  "following_count": 500,
  "post_count": 150,
  "status": "active",
  "last_seen": "2026-05-20T10:30:00Z",
  "is_private": false,
  "created_at": "2026-01-01T00:00:00Z"
}
```

### 2. Update User Profile
```http
PUT /users/:userId
Content-Type: application/json

{
  "full_name": "New Full Name",
  "bio": "Updated bio",
  "profile_pic": "https://new-pic-url.jpg",
  "cover_pic": "https://new-cover-url.jpg",
  "website": "https://mywebsite.com",
  "location": "New Location",
  "is_private": false
}
```
**Response:**
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "user": { ...updated user object }
}
```

### 3. Get User by Username
```http
GET /users/search/:username
```
**Response:**
```json
{
  "id": "uuid",
  "username": "creator_name",
  "full_name": "Full Name",
  "profile_pic": "https://...",
  "is_verified": true,
  "follower_count": 10000,
  "following_count": 500,
  "post_count": 150
}
```

### 4. Search Users
```http
GET /users/search?q=query&limit=20
```
**Response:**
```json
[
  {
    "id": "uuid",
    "username": "creator_name",
    "full_name": "Full Name",
    "profile_pic": "https://..."
  },
  ...
]
```

---

## 📱 POSTS ENDPOINTS

### 5. Create Post
```http
POST /posts
Content-Type: application/json

{
  "caption": "Post description",
  "media_url": "https://...",
  "thumbnail_url": "https://...",
  "type": "post",
  "audio_name": "Song Name",
  "audio_url": "https://...",
  "aspect_ratio": 9/16,
  "duration": 30,
  "visibility": "public",
  "is_monetized": false,
  "location_name": "Mumbai, India"
}
```
**Response:**
```json
{
  "status": "success",
  "post": {
    "id": "uuid",
    "user_id": "uuid",
    "caption": "Post description",
    "media_url": "https://...",
    "like_count": 0,
    "comment_count": 0,
    "view_count": 0,
    "created_at": "2026-05-20T10:30:00Z"
  }
}
```

### 6. Get Post by ID
```http
GET /posts/:postId
```
**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "caption": "Post description",
  "media_url": "https://...",
  "thumbnail_url": "https://...",
  "type": "post",
  "audio_name": "Song Name",
  "audio_url": "https://...",
  "aspect_ratio": 9/16,
  "duration": 30,
  "visibility": "public",
  "like_count": 1500,
  "comment_count": 250,
  "share_count": 50,
  "view_count": 15000,
  "is_monetized": false,
  "location_name": "Mumbai, India",
  "created_at": "2026-05-20T10:30:00Z",
  "author": {
    "id": "uuid",
    "username": "creator_name",
    "full_name": "Full Name",
    "profile_pic": "https://...",
    "is_verified": true
  },
  "user_liked": false,
  "user_saved": false
}
```

### 7. Update Post
```http
PUT /posts/:postId
Content-Type: application/json

{
  "caption": "Updated caption",
  "visibility": "private"
}
```
**Response:**
```json
{
  "status": "success",
  "post": { ...updated post object }
}
```

### 8. Delete Post
```http
DELETE /posts/:postId
```
**Response:**
```json
{
  "status": "success",
  "message": "Post deleted successfully"
}
```

### 9. Get Posts Feed (Chronological)
```http
GET /posts/feed?limit=20&offset=0
```
**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "caption": "Post description",
      "media_url": "https://...",
      "like_count": 1500,
      "comment_count": 250,
      "author": {...},
      "user_liked": false
    },
    ...
  ],
  "nextOffset": 20,
  "hasMore": true
}
```

### 10. Get Reels Feed (For You Page - Smart Ranking)
```http
GET /posts/reels?limit=20&offset=0
```
**Response:**
```json
{
  "reels": [
    {
      "id": "uuid",
      "type": "reel",
      "caption": "Reel description",
      "media_url": "https://...",
      "thumbnail_url": "https://...",
      "duration": 30,
      "aspect_ratio": 9/16,
      "like_count": 5000,
      "comment_count": 500,
      "view_count": 50000,
      "engagement_score": 8.75,
      "author": {
        "id": "uuid",
        "username": "creator_name",
        "full_name": "Full Name",
        "profile_pic": "https://...",
        "is_verified": true,
        "follower_count": 50000
      },
      "user_liked": false,
      "user_saved": false
    },
    ...
  ],
  "nextOffset": 20,
  "hasMore": true
}
```

### 11. Get Posts by User
```http
GET /users/:userId/posts?limit=20&offset=0
```
**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "caption": "Post",
      "media_url": "https://...",
      ...
    },
    ...
  ],
  "total": 150,
  "hasMore": true
}
```

### 12. Increment Post View Count
```http
POST /posts/:postId/view
```
**Response:**
```json
{
  "status": "success",
  "view_count": 50001
}
```

---

## ❤️ LIKES ENDPOINTS

### 13. Like a Post
```http
POST /likes
Content-Type: application/json

{
  "post_id": "uuid"
}
```
**Response:**
```json
{
  "status": "liked",
  "like_count": 1501
}
```

### 14. Unlike a Post
```http
DELETE /likes/:postId
```
**Response:**
```json
{
  "status": "unliked",
  "like_count": 1500
}
```

### 15. Check if Post is Liked
```http
GET /likes/:postId/check
```
**Response:**
```json
{
  "liked": true
}
```

### 16. Get Posts Liked by User
```http
GET /users/:userId/likes?limit=20&offset=0
```
**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "caption": "Post",
      ...
    },
    ...
  ],
  "total": 500,
  "hasMore": true
}
```

---

## 💬 COMMENTS ENDPOINTS

### 17. Create Comment
```http
POST /comments
Content-Type: application/json

{
  "post_id": "uuid",
  "content": "Great content!",
  "parent_id": null
}
```
**Response:**
```json
{
  "status": "success",
  "comment": {
    "id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid",
    "content": "Great content!",
    "created_at": "2026-05-20T10:30:00Z",
    "author": {
      "id": "uuid",
      "username": "commenter",
      "profile_pic": "https://..."
    }
  }
}
```

### 18. Get Post Comments
```http
GET /posts/:postId/comments?limit=20&offset=0
```
**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "Great content!",
      "created_at": "2026-05-20T10:30:00Z",
      "author": {
        "id": "uuid",
        "username": "commenter",
        "full_name": "Full Name",
        "profile_pic": "https://..."
      },
      "replies": [
        {
          "id": "uuid",
          "content": "Thanks!",
          "parent_id": "parent-uuid",
          "created_at": "2026-05-20T10:35:00Z",
          "author": {...}
        }
      ]
    },
    ...
  ],
  "total": 250,
  "hasMore": true
}
```

### 19. Reply to Comment
```http
POST /comments
Content-Type: application/json

{
  "post_id": "uuid",
  "content": "Thanks for the feedback!",
  "parent_id": "comment-uuid"
}
```
**Response:**
```json
{
  "status": "success",
  "comment": {
    "id": "uuid",
    "parent_id": "comment-uuid",
    "content": "Thanks for the feedback!",
    ...
  }
}
```

### 20. Delete Comment
```http
DELETE /comments/:commentId
```
**Response:**
```json
{
  "status": "success",
  "message": "Comment deleted successfully"
}
```

---

## 👥 FOLLOW ENDPOINTS

### 21. Follow User
```http
POST /follows
Content-Type: application/json

{
  "following_id": "uuid"
}
```
**Response:**
```json
{
  "status": "followed",
  "follower_count": 10001
}
```

### 22. Unfollow User
```http
DELETE /follows/:userId
```
**Response:**
```json
{
  "status": "unfollowed",
  "follower_count": 10000
}
```

### 23. Check if Following
```http
GET /follows/:userId/check
```
**Response:**
```json
{
  "isFollowing": true
}
```

### 24. Get User's Following List
```http
GET /users/:userId/following?limit=20&offset=0
```
**Response:**
```json
{
  "following": [
    {
      "id": "uuid",
      "username": "creator_name",
      "full_name": "Full Name",
      "profile_pic": "https://...",
      "is_verified": true,
      "follower_count": 50000
    },
    ...
  ],
  "total": 500,
  "hasMore": true
}
```

### 25. Get User's Followers List
```http
GET /users/:userId/followers?limit=20&offset=0
```
**Response:**
```json
{
  "followers": [
    {
      "id": "uuid",
      "username": "follower_name",
      "full_name": "Full Name",
      "profile_pic": "https://...",
      "is_verified": false,
      "follower_count": 5000
    },
    ...
  ],
  "total": 10000,
  "hasMore": true
}
```

### 26. Get Mutual Follows (Common Friends)
```http
GET /users/:userId/mutuals
```
**Response:**
```json
{
  "mutuals": [
    {
      "id": "uuid",
      "username": "mutual_friend",
      "profile_pic": "https://..."
    },
    ...
  ],
  "total": 45
}
```

---

## 💾 SAVES ENDPOINTS

### 27. Save Post
```http
POST /saves
Content-Type: application/json

{
  "post_id": "uuid"
}
```
**Response:**
```json
{
  "status": "saved",
  "message": "Post saved successfully"
}
```

### 28. Unsave Post
```http
DELETE /saves/:postId
```
**Response:**
```json
{
  "status": "unsaved",
  "message": "Post removed from saves"
}
```

### 29. Check if Post is Saved
```http
GET /saves/:postId/check
```
**Response:**
```json
{
  "saved": true
}
```

### 30. Get User's Saved Posts
```http
GET /users/:userId/saves?limit=20&offset=0
```
**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "caption": "Saved post",
      "media_url": "https://...",
      "author": {...},
      "saved_at": "2026-05-20T10:30:00Z"
    },
    ...
  ],
  "total": 150,
  "hasMore": true
}
```

---

## 🏷️ HASHTAG ENDPOINTS

### 31. Get Trending Hashtags
```http
GET /trending/hashtags?limit=20
```
**Response:**
```json
{
  "hashtags": [
    {
      "tag": "viral",
      "usage_count": 523,
      "trend": "up",
      "trend_pct": "15%",
      "last_used": "2026-05-20T10:30:00Z"
    },
    ...
  ]
}
```

### 32. Get Posts by Hashtag
```http
GET /hashtags/:tag/posts?limit=20&offset=0
```
**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "caption": "Post with #viral",
      "media_url": "https://...",
      "like_count": 5000,
      "engagement_score": 8.75,
      "author": {...}
    },
    ...
  ],
  "total": 1200,
  "hasMore": true
}
```

### 33. Get Hashtag Stats
```http
GET /hashtags/:tag/stats
```
**Response:**
```json
{
  "tag": "viral",
  "usage_count": 523,
  "post_count": 523,
  "view_count": 2500000,
  "trend": "up",
  "trend_pct": "15%",
  "created_at": "2026-01-01T00:00:00Z",
  "last_used": "2026-05-20T10:30:00Z"
}
```

---

## 🔔 NOTIFICATIONS ENDPOINTS

### 34. Get User Notifications
```http
GET /notifications?limit=20&offset=0
```
**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "like",
      "actor": {
        "id": "uuid",
        "username": "user_name",
        "profile_pic": "https://..."
      },
      "post_id": "uuid",
      "message": "user_name liked your post",
      "read": false,
      "created_at": "2026-05-20T10:30:00Z"
    },
    ...
  ],
  "total": 45,
  "hasMore": true
}
```

### 35. Mark Notification as Read
```http
PUT /notifications/:notificationId
Content-Type: application/json

{
  "read": true
}
```
**Response:**
```json
{
  "status": "success",
  "notification": {...}
}
```

### 36. Mark All Notifications as Read
```http
PUT /notifications/read-all
```
**Response:**
```json
{
  "status": "success",
  "message": "All notifications marked as read"
}
```

---

## 💰 COINS & TRANSACTIONS ENDPOINTS

### 37. Get User Coin Balance
```http
GET /coins/balance
```
**Response:**
```json
{
  "red_coins": 5000,
  "green_coins": 2000,
  "total_value": 7000
}
```

### 38. Create Transaction
```http
POST /transactions
Content-Type: application/json

{
  "coin_type": "red_coins",
  "amount": 100,
  "transaction_type": "purchase",
  "description": "Bought premium sticker pack"
}
```
**Response:**
```json
{
  "status": "success",
  "transaction": {
    "id": "uuid",
    "coin_type": "red_coins",
    "amount": 100,
    "balance_before": 5000,
    "balance_after": 5100,
    "created_at": "2026-05-20T10:30:00Z"
  }
}
```

### 39. Get Transaction History
```http
GET /transactions?limit=20&offset=0
```
**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "coin_type": "red_coins",
      "amount": 100,
      "transaction_type": "purchase",
      "description": "Bought premium sticker pack",
      "balance_before": 5000,
      "balance_after": 5100,
      "created_at": "2026-05-20T10:30:00Z"
    },
    ...
  ],
  "total": 150,
  "hasMore": true
}
```

---

## 📊 ANALYTICS ENDPOINTS

### 40. Get User Analytics Dashboard
```http
GET /analytics/dashboard
```
**Response:**
```json
{
  "user_id": "uuid",
  "total_posts": 150,
  "total_followers": 10000,
  "total_following": 500,
  "total_likes": 50000,
  "total_comments": 5000,
  "total_saves": 2500,
  "total_views": 500000,
  "engagement_rate": 11.2,
  "growth_rate": 5.3,
  "most_liked_post": {
    "id": "uuid",
    "caption": "...",
    "likes": 5000
  },
  "top_3_posts": [...],
  "analytics_by_day": [...]
}
```

### 41. Get Post Analytics
```http
GET /posts/:postId/analytics
```
**Response:**
```json
{
  "post_id": "uuid",
  "views": 50000,
  "likes": 5000,
  "comments": 500,
  "saves": 250,
  "shares": 50,
  "engagement_rate": 10.5,
  "views_by_hour": [...],
  "top_commenters": [...],
  "traffic_sources": [...]
}
```

---

## 🚫 REPORTING & MODERATION ENDPOINTS

### 42. Report Post
```http
POST /reports
Content-Type: application/json

{
  "post_id": "uuid",
  "reason": "inappropriate_content",
  "description": "This content is inappropriate"
}
```
**Response:**
```json
{
  "status": "success",
  "report_id": "uuid",
  "message": "Thank you for reporting. We'll review it shortly."
}
```

### 43. Report User
```http
POST /reports/user
Content-Type: application/json

{
  "user_id": "uuid",
  "reason": "harassment",
  "description": "User is harassing me"
}
```
**Response:**
```json
{
  "status": "success",
  "report_id": "uuid",
  "message": "Thank you for reporting. We'll review it shortly."
}
```

### 44. Get Content Moderation Status
```http
GET /moderation/:itemId
```
**Response:**
```json
{
  "item_id": "uuid",
  "status": "pending",
  "reported_count": 3,
  "reason": "inappropriate_content",
  "created_at": "2026-05-20T10:30:00Z"
}
```

---

## 🔒 PRIVACY ENDPOINTS

### 45. Block User
```http
POST /blocks
Content-Type: application/json

{
  "blocked_user_id": "uuid"
}
```
**Response:**
```json
{
  "status": "blocked",
  "message": "User blocked successfully"
}
```

### 46. Unblock User
```http
DELETE /blocks/:userId
```
**Response:**
```json
{
  "status": "unblocked",
  "message": "User unblocked successfully"
}
```

### 47. Get Blocked Users List
```http
GET /blocks?limit=20&offset=0
```
**Response:**
```json
{
  "blocked_users": [
    {
      "id": "uuid",
      "username": "blocked_user",
      "profile_pic": "https://...",
      "blocked_at": "2026-05-20T10:30:00Z"
    },
    ...
  ],
  "total": 5,
  "hasMore": false
}
```

---

## 📞 CALLS/MESSAGING ENDPOINTS

### 48. Get Conversations List
```http
GET /conversations?limit=20&offset=0
```
**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "type": "direct",
      "members": [
        {
          "id": "uuid",
          "username": "user_name",
          "profile_pic": "https://..."
        }
      ],
      "last_message": {
        "id": "uuid",
        "content": "Hey!",
        "created_at": "2026-05-20T10:30:00Z"
      },
      "unread_count": 2
    },
    ...
  ],
  "total": 15,
  "hasMore": false
}
```

### 49. Get Conversation Messages
```http
GET /conversations/:conversationId/messages?limit=20&offset=0
```
**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "content": "Hey!",
      "type": "text",
      "media_url": null,
      "created_at": "2026-05-20T10:30:00Z"
    },
    ...
  ],
  "total": 100,
  "hasMore": true
}
```

### 50. Send Message
```http
POST /messages
Content-Type: application/json

{
  "conversation_id": "uuid",
  "content": "Hey, how are you?",
  "type": "text",
  "media_url": null
}
```
**Response:**
```json
{
  "status": "success",
  "message": {
    "id": "uuid",
    "content": "Hey, how are you?",
    "created_at": "2026-05-20T10:30:00Z"
  }
}
```

---

## 📚 STORIES ENDPOINTS

### 51. Create Story
```http
POST /stories
Content-Type: application/json

{
  "media_url": "https://...",
  "caption": "Check this out!",
  "duration": 10
}
```
**Response:**
```json
{
  "status": "success",
  "story": {
    "id": "uuid",
    "media_url": "https://...",
    "view_count": 0,
    "created_at": "2026-05-20T10:30:00Z"
  }
}
```

### 52. Get User Stories
```http
GET /users/:userId/stories
```
**Response:**
```json
{
  "stories": [
    {
      "id": "uuid",
      "media_url": "https://...",
      "caption": "Check this out!",
      "view_count": 150,
      "viewers": [
        {
          "id": "uuid",
          "username": "viewer",
          "viewed_at": "2026-05-20T10:30:00Z"
        }
      ],
      "created_at": "2026-05-20T10:30:00Z"
    },
    ...
  ]
}
```

### 53. Get Stories Feed (For You)
```http
GET /stories/feed?limit=20
```
**Response:**
```json
{
  "stories": [
    {
      "user": {
        "id": "uuid",
        "username": "creator",
        "profile_pic": "https://...",
        "is_verified": true
      },
      "stories": [
        {
          "id": "uuid",
          "media_url": "https://...",
          "view_count": 150,
          "viewed": false,
          "created_at": "2026-05-20T10:30:00Z"
        }
      ]
    },
    ...
  ]
}
```

### 54. View Story
```http
POST /stories/:storyId/view
```
**Response:**
```json
{
  "status": "viewed",
  "view_count": 151
}
```

### 55. Delete Story
```http
DELETE /stories/:storyId
```
**Response:**
```json
{
  "status": "success",
  "message": "Story deleted successfully"
}
```

---

## 🎯 SEARCH ENDPOINTS

### 56. Global Search
```http
GET /search?q=query&type=all&limit=20
```
**Parameters:**
- `type`: "all", "posts", "users", "hashtags"

**Response:**
```json
{
  "posts": [...],
  "users": [...],
  "hashtags": [...]
}
```

### 57. Trending Content
```http
GET /trending?type=posts&limit=20
```
**Response:**
```json
{
  "trending": [
    {
      "id": "uuid",
      "title": "Post caption or hashtag",
      "type": "post",
      "engagement": 50000,
      "trend_direction": "up",
      "trend_strength": "high"
    },
    ...
  ]
}
```

---

## ⚙️ SETTINGS ENDPOINTS

### 58. Get User Settings
```http
GET /settings
```
**Response:**
```json
{
  "privacy": "public",
  "allow_messages": true,
  "allow_notifications": true,
  "allow_analytics": true,
  "language": "en",
  "theme": "dark"
}
```

### 59. Update User Settings
```http
PUT /settings
Content-Type: application/json

{
  "privacy": "private",
  "allow_messages": false,
  "allow_notifications": true,
  "language": "hi",
  "theme": "light"
}
```
**Response:**
```json
{
  "status": "success",
  "settings": {...}
}
```

---

## 🎁 REWARDS & MONETIZATION ENDPOINTS

### 60. Get Monetization Status
```http
GET /monetization/status
```
**Response:**
```json
{
  "is_monetized": true,
  "earnings_this_month": 1250,
  "total_earnings": 5000,
  "payment_method": "bank_transfer",
  "pending_payout": 500
}
```

### 61. Claim Reward
```http
POST /rewards/claim
Content-Type: application/json

{
  "reward_id": "uuid"
}
```
**Response:**
```json
{
  "status": "success",
  "coins_earned": 100,
  "message": "Reward claimed successfully"
}
```

---

## 📋 ERROR RESPONSES

All endpoints follow these error response formats:

### 400 Bad Request
```json
{
  "error": "bad_request",
  "message": "Invalid parameters provided"
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Please provide a valid authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "rate_limited",
  "message": "Too many requests. Please wait 10 seconds."
}
```

### 500 Server Error
```json
{
  "error": "server_error",
  "message": "An unexpected error occurred. Please try again."
}
```

---

## 🔄 PAGINATION

All list endpoints support pagination:
```http
GET /endpoint?limit=20&offset=0
```

**Parameters:**
- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response includes:**
```json
{
  "items": [...],
  "total": 500,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

---

## 📌 NOTES FOR APP DEVELOPMENT

1. **Authentication**: Always include Bearer token in Authorization header
2. **Rate Limiting**: 
   - Comments: Max 1 every 10 seconds per user
   - Follow: Max 5 per minute per user
   - General: Max 100 requests per minute per user
3. **Images**: 
   - Profile pics: Max 5MB, 512x512px recommended
   - Post media: Max 500MB, optimized for mobile
   - Thumbnails: Auto-generated, 16:9 ratio recommended
4. **Videos**:
   - Max 15 minutes duration
   - Max 2GB file size
   - Supported formats: MP4, WebM, MOV
5. **Reels**: 
   - Optimized 9:16 aspect ratio
   - Auto-play with sound on
   - Smart ranking algorithm
6. **Offline Support**: 
   - Cache posts and stories locally
   - Queue actions when offline
   - Sync when connection restored

---

**Last Updated**: May 20, 2026
**Version**: 2.0 Complete API
