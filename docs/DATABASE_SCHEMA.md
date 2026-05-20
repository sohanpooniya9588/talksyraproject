# TalkSyra Database Schema & Architecture

## Complete Database Overview

### 1. **`users`** — User Profiles & Stats
```sql
id (UUID)                  -- Primary key
username (text)            -- Unique username
full_name (text)          -- Display name
email (text)              -- Email address
profile_pic (url)         -- Profile picture link
cover_pic (url)           -- Cover/banner image
bio (text)                -- User bio
website (url)             -- Website link
location (text)           -- Location
birth_date (date)         -- DOB
is_verified (boolean)     -- Blue check
is_pro_member (boolean)   -- Premium user
red_coins (int)           -- Currency 1
green_coins (int)         -- Currency 2
follower_count (int)      -- Total followers
following_count (int)     -- Following count
post_count (int)          -- Total posts
status (text)             -- active/inactive
last_seen (timestamp)     -- Last activity
created_at (timestamp)    -- Signup date
is_private (boolean)      -- Private account
password (text)           -- Hashed password
```

### 2. **`posts`** — Reels, Videos, Content
```sql
id (UUID)                 -- Primary key
user_id (UUID FK)         -- Author
type (text)               -- 'post' or 'reel'
caption (text)            -- Content description
media_url (url)           -- Direct link to media ✅
thumbnail_url (url)       -- Thumbnail preview
audio_name (text)         -- Audio track name
audio_url (url)           -- Audio file link
aspect_ratio (float)      -- Video aspect ratio
duration (int)            -- Video duration (seconds)
visibility (text)         -- 'public' or 'private'
is_monetized (boolean)    -- Monetization enabled
like_count (int)          -- Total likes
comment_count (int)       -- Total comments
share_count (int)         -- Total shares
view_count (int)          -- Total views
location_name (text)      -- Location tagged
created_at (timestamp)    -- Post date
```

### 3. **`likes`** — Like Tracking
```sql
user_id (UUID FK)        -- Who liked
post_id (UUID FK)        -- Which post
created_at (timestamp)   -- When liked
```

### 4. **`comments`** — Comments & Replies
```sql
id (UUID)                -- Primary key
post_id (UUID FK)        -- Parent post
user_id (UUID FK)        -- Commenter
parent_id (UUID FK)      -- For nested replies
content (text)           -- Comment text
created_at (timestamp)   -- Comment date
```

### 5. **`followers`** — Follow Relationships
```sql
-- Empty table (ready for follower tracking)
follower_id (UUID FK)    -- Who is following
following_id (UUID FK)   -- Who is being followed
created_at (timestamp)   -- When followed
```

### 6. **`saves`** — Bookmarked Content
```sql
-- Ready for bookmarking feature
user_id (UUID FK)        -- Who saved
post_id (UUID FK)        -- Which post
created_at (timestamp)   -- When saved
```

### 7. **`hashtags`** — Trending Hashtags
```sql
-- Ready for hashtag tracking
tag (text)               -- Hashtag name
usage_count (int)        -- How many times used
last_used (timestamp)    -- Last used date
created_at (timestamp)   -- Created date
```

### 8. **`story_views`** — Story Analytics
```sql
-- For Stories feature (Stories table also exists)
story_id (UUID FK)       -- Which story
user_id (UUID FK)        -- Who viewed
viewed_at (timestamp)    -- When viewed
```

---

## Current Data Stats (as of May 20, 2026)

- **Users**: 3+
- **Posts**: 5+ (mostly public)
- **Likes**: 1+
- **Comments**: 1+
- **Followers**: Empty (0)
- **Saves**: Empty (0)
- **Hashtags**: Empty (0)

---

## Smart Feed Algorithm Strategy

### **Problem**: Basic feed (order by created_at) = unfair, low visibility for good creators

### **Solution**: Multi-factor ranking like Instagram

1. **Engagement Score** (50%)
   - `(like_count × 1.0) + (comment_count × 2.0) + (share_count × 3.0) + (view_count × 0.1)`
   - Comments & shares weighted more (higher intent)

2. **Freshness Score** (20%)
   - Recent posts ranked higher
   - Decay over time: `max(0, 1 - (days_old / 7))`

3. **Creator Quality** (15%)
   - Follower count
   - Verification status
   - Historical engagement rate
   - Post frequency

4. **User Affinity** (10%)
   - Follow-following similarity
   - Content preference matching
   - Interaction history

5. **Viral Potential** (5%)
   - Early engagement velocity
   - Trending hashtags
   - Location/category trending

---

## What Needs to Be Done

### Phase 1: Smart Feed (Priority ⚡⚡⚡)
- [ ] Add engagement_score calculation to worker
- [ ] Add freshness decay algorithm
- [ ] Hybrid ranking: scores × weights
- [ ] A/B test on APK

### Phase 2: Creator Discovery (⚡⚡)
- [ ] Tag verified creators (is_verified)
- [ ] Expose creator analytics dashboard
- [ ] Creator tier system (based on post_count, follower_count, is_pro_member)

### Phase 3: Personalization (⚡⚡)
- [ ] Track user follow graph (followers table)
- [ ] Store user content preferences (likes history)
- [ ] Feed personalization by user cohort

### Phase 4: Trending/Analytics (⚡)
- [ ] Hashtag extraction from captions
- [ ] Real-time trending endpoint
- [ ] Location-based trending feed

### Phase 5: Anti-Spam & Quality (⚡)
- [ ] Content moderation flags
- [ ] Low-quality post detection
- [ ] Spam/bot detection

---

## Current Issues & Gaps

| Issue | Impact | Fix |
|-------|--------|-----|
| Followers table unused | Can't track social graph | Implement follow system |
| No hashtag parsing | Can't find trending content | Parse captions for #tags |
| Simple chronological feed | Good creators invisible | Add smart ranking ✅ |
| No saved posts feature | Users can't bookmark | Use saves table |
| No story feature | Less engagement | Implement stories |
| No monetization tracking | Creators unmotivated | Expand is_monetized logic |

