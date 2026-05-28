# 📱 TalkSyra APK ↔ Cloudflare Worker API Contract

**Complete specification for APK to Worker communication**

---

## 🏗️ Architecture Overview

```
APK (Android/iOS)
    ↓ (All requests with headers)
Cloudflare Worker (https://shorts.talksyra.app)
    ↓ (Service Role Key)
Supabase (Database + Storage + Auth)
```

### Global Security Headers (Every Request)

```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
Content-Type: application/json
```

**Exception:** Auth endpoints don't require Authorization header

---

## 📡 6 Core API Operations

### 1. 🔑 Authentication

#### Login
```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "john_doe"
  }
}
```

#### Signup
```
POST /api/auth/signup
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "username": "john_doe",
  "full_name": "John Doe"
}
```

#### Google Auth
```
POST /api/auth/google
```

**Request:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "username": "john_doe"
}
```

**Worker Logic:**
- Validate X-TalkSyra-Secret header
- Call Supabase Auth API
- Generate JWT token
- Return auth_token + user_id
- APK stores in SharedPreferences/UserDefaults

---

### 2. 🖼️ Media Upload

```
POST /api/upload
Content-Type: multipart/form-data
```

**Headers:**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
```

**Payload:**
```
- file: <Binary File>
- path: "posts" | "profiles" | "reels" | "covers"
- userId: "550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "url": "https://shorts.talksyra.app/storage/v1/object/public/media/posts/550e8400.jpg",
    "path": "media/posts/550e8400.jpg",
    "size": 2048576,
    "mime_type": "image/jpeg"
  }
}
```

**Worker Logic:**
- Validate headers
- Verify auth_token
- Upload to Supabase Storage
- Return public URL to APK
- APK uses URL for next step (post creation)

---

### 3. 📝 Post & Reels Creation

```
POST /api/posts/create
```

**Headers:**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
Content-Type: application/json
```

**Request (Post):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "caption": "Amazing sunset! 🌅 #travel",
  "media_url": "https://shorts.talksyra.app/storage/v1/object/public/media/posts/550e8400.jpg",
  "type": "post",
  "aspect_ratio": "4/3",
  "visibility": "public",
  "location_name": "Goa, India"
}
```

**Request (Reel):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "caption": "Learn JavaScript in 60 seconds 👨‍💻",
  "media_url": "https://shorts.talksyra.app/storage/v1/object/public/media/reels/550e8400.mp4",
  "audio_url": "https://shorts.talksyra.app/audio/music-123.mp3",
  "type": "reel",
  "aspect_ratio": "9/16",
  "duration": 60,
  "visibility": "public"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "post-550e8400-e29b-41d4",
    "type": "post",
    "caption": "Amazing sunset! 🌅 #travel",
    "created_at": "2026-05-28T10:30:00Z"
  }
}
```

**Worker Logic:**
- Validate headers
- Verify user owns the post
- Insert into `posts` table
- Auto-generate `score` (0 initially)
- Return post ID

---

### 4. 👤 Profile Update

```
POST /api/users/update
```

**Headers:**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
Content-Type: application/json
```

**Request:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "username": "new_username",
    "full_name": "John Doe Updated",
    "bio": "Travel lover | Photographer 📸",
    "profile_pic": "https://shorts.talksyra.app/storage/v1/object/public/media/profiles/550e8400.jpg",
    "cover_pic": "https://shorts.talksyra.app/storage/v1/object/public/media/covers/550e8400.jpg"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "new_username",
    "full_name": "John Doe Updated",
    "bio": "Travel lover | Photographer 📸",
    "profile_pic": "https://shorts.talksyra.app/storage/v1/object/public/media/profiles/550e8400.jpg"
  }
}
```

**Worker Logic:**
- Validate headers
- Verify user is updating own profile
- Update `users` table
- Return updated profile

---

### 5. ❤️ Social Actions

#### Toggle Like
```
POST /api/likes/toggle
```

**Request:**
```json
{
  "postId": "post-550e8400-e29b-41d4",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "isCurrentlyLiked": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "like_count": 1201
  }
}
```

#### Add Comment
```
POST /api/comments/add
```

**Request:**
```json
{
  "postId": "post-550e8400-e29b-41d4",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Amazing! 🔥",
  "parentCommentId": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "comment-550e8400",
    "postId": "post-550e8400-e29b-41d4",
    "content": "Amazing! 🔥",
    "created_at": "2026-05-28T10:30:00Z"
  }
}
```

#### Toggle Follow
```
POST /api/users/follow
```

**Request:**
```json
{
  "followerId": "550e8400-e29b-41d4-a716-446655440000",
  "followingId": "550e8400-e29b-41d4-a716-446655440001",
  "isFollowing": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "following": true,
    "follower_count": 501
  }
}
```

**Worker Logic (All Social):**
- Validate headers
- Verify user identity
- Insert/Update in `likes`, `comments`, or `followers` table
- Return updated counts

---

### 6. 📡 Feed Retrieval

```
GET /api/feed?type=post&userId=USER_ID&limit=20&offset=0
```

**Headers:**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "post-uuid",
      "type": "post",
      "caption": "Amazing sunset! 🌅",
      "media_url": "https://api.talksyra.app/posts/post-uuid.jpg",
      "thumbnail_url": "https://api.talksyra.app/posts/post-uuid-thumb.jpg",
      "audio_url": null,
      "aspect_ratio": "4/3",
      "duration": null,
      "visibility": "public",
      "like_count": 1200,
      "comment_count": 95,
      "share_count": 45,
      "view_count": 8900,
      "score": 8.75,
      "is_liked": false,
      "created_at": "2026-05-20T10:30:00Z",
      "author": {
        "id": "user-uuid",
        "username": "travel_guru",
        "full_name": "Travel Guru",
        "profile_pic": "https://api.talksyra.app/avatars/user-uuid.jpg",
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

**Query Parameters:**
| Param | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| type | string | No | post | `post` or `reel` |
| userId | string | No | - | For `is_liked` status |
| limit | number | No | 20 | Max 100 |
| offset | number | No | 0 | Pagination |
| personalized | boolean | No | false | Following only |

**Worker Logic:**
- Validate headers
- Query `posts` table filtered by type
- Calculate `score` (50% engagement + 7-day decay for posts; 60% engagement + 3-day decay for reels)
- Sort by score
- Add `is_liked` for current user
- Return with pagination

---

## 🗄️ Database Schema

### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  full_name VARCHAR,
  bio TEXT,
  profile_pic VARCHAR,
  cover_pic VARCHAR,
  is_verified BOOLEAN DEFAULT false,
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### posts table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(10) CHECK (type IN ('post', 'reel')),
  caption TEXT,
  media_url VARCHAR NOT NULL,
  thumbnail_url VARCHAR,
  audio_url VARCHAR,
  aspect_ratio VARCHAR,
  duration INT,
  visibility VARCHAR DEFAULT 'public',
  location_name VARCHAR,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  score NUMERIC(3,2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX (type, created_at),
  INDEX (score, created_at)
);
```

### likes table
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(post_id, user_id)
);
```

### comments table
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);
```

### followers table
```sql
CREATE TABLE followers (
  id UUID PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
```

---

## 🔐 Security Checklist

- ✅ All requests require `X-TalkSyra-Secret` header validation
- ✅ All non-auth requests require `Authorization: Bearer` header
- ✅ Worker validates JWT token signature
- ✅ Worker verifies userId in request matches JWT claim
- ✅ User can only update own profile
- ✅ User can only create/delete own posts
- ✅ Service Role Key used server-side only (NEVER expose)
- ✅ No direct Supabase keys sent to APK
- ✅ All database operations go through Worker

---

## 🛑 Error Responses

### Missing Headers (400)
```json
{
  "success": false,
  "error": "Missing X-TalkSyra-Secret header",
  "code": "MISSING_HEADER"
}
```

### Invalid Token (401)
```json
{
  "success": false,
  "error": "Invalid or expired auth token",
  "code": "INVALID_TOKEN"
}
```

### User Mismatch (403)
```json
{
  "success": false,
  "error": "User ID in request does not match authenticated user",
  "code": "FORBIDDEN"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Post not found",
  "code": "NOT_FOUND"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Database error",
  "code": "SERVER_ERROR"
}
```

---

## 💡 Worker Implementation Tips

1. **Use Service Role Key** - For server-side database operations with full access
2. **Validate Headers** - Every request must have valid `X-TalkSyra-Secret`
3. **JWT Verification** - Verify token signature before trusting userId
4. **Database Indices** - Index on `(type, created_at)` and `(score, created_at)` for feed queries
5. **Error Handling** - Always return `success: false` with specific error codes
6. **Rate Limiting** - Consider implementing rate limits at Worker level
7. **Logging** - Log failed auth attempts for security
8. **CORS** - Enable CORS for APK requests (Origin: *)

---

## 📊 Ranking Algorithm

### For Posts (type='post')
```
score = (50% * engagement_score) + time_decay
engagement_score = (likes + comments*2 + shares*3) / max_engagement
time_decay = 1.0 if created within 7 days, else 0.0
```

### For Reels (type='reel')
```
score = (60% * engagement_score) + (15% * velocity_score) + time_decay
engagement_score = (likes + comments*2 + shares*3) / max_engagement
velocity_score = views_per_hour (higher = more viral)
time_decay = 1.0 if created within 3 days, else 0.0
```

---

## 🚀 Deployment Links

| Environment | URL |
|-------------|-----|
| Production API | https://shorts.talksyra.app |
| Media CDN | https://api.talksyra.app |
| Database | https://frmazzmzyychdfajnslt.supabase.co |

---

## 📋 Implementation Checklist

- [ ] Worker validates `X-TalkSyra-Secret` on every request
- [ ] Auth endpoints return `auth_token` and `user_id`
- [ ] Upload endpoint returns public storage URL
- [ ] Post creation inserts with `score = 0`
- [ ] Feed endpoint sorts by score DESC
- [ ] Social actions update counts correctly
- [ ] Profile update only allows own user
- [ ] All errors return proper error codes
- [ ] JWT tokens expire after 7 days
- [ ] Database indices created for performance
