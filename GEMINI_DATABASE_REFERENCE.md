# 📱 TalkSyra Database Tables - Quick Reference for APK

## 🚀 QUICK START FOR APK DEVELOPERS

### Copy This to Share with Team/Gemini:

---

## ✅ ACTIVE TABLES (With Data)

| Table | Columns | Status | Use Case |
|-------|---------|--------|----------|
| **users** | 22 | ✓ Active | User accounts & profiles |
| **posts** | 18 | ✓ Active | Posts/Reels content |
| **likes** | 3 | ✓ Active | Post likes |
| **comments** | 6 | ✓ Active | Post comments & replies |

---

## 📋 EMPTY TABLES (Ready to Use)

### Social Features
| Table | Purpose | Activate |
|-------|---------|----------|
| **followers** | Follow relationships | Priority 1 |
| **saves** | Bookmark posts | Priority 2 |
| **blocks** | Block users | Priority 3 |

### Content & Discovery
| Table | Purpose | Activate |
|-------|---------|----------|
| **hashtags** | Trending hashtags | Priority 1 |
| **post_hashtags** | Post→Hashtag mapping | Priority 1 |
| **trending_posts** | Trending content cache | Priority 2 |

### Stories & Ephemeral
| Table | Purpose | Activate |
|-------|---------|----------|
| **stories** | 24-hour stories | Priority 2 |
| **story_views** | Story view tracking | Priority 2 |
| **story_highlights** | Saved story collections | Priority 3 |

### Messaging
| Table | Purpose | Activate |
|-------|---------|----------|
| **conversations** | DM & group chats | Priority 3 |
| **conversation_members** | Conversation members | Priority 3 |
| **messages** | Direct messages | Priority 3 |

### Notifications
| Table | Purpose | Activate |
|-------|---------|----------|
| **notifications** | User notifications | Priority 2 |

### Monetization & Coins
| Table | Purpose | Activate |
|-------|---------|----------|
| **transactions** | Coin transactions | Priority 3 |
| **coins_transaction_log** | Coin audit log | Priority 3 |
| **ads** | Advertising system | Priority 4 |

### Analytics & Personalization
| Table | Purpose | Activate |
|-------|---------|----------|
| **user_activity_log** | User behavior tracking | Priority 4 |
| **user_analytics** | Daily user stats | Priority 3 |
| **user_interests** | User preferences | Priority 4 |
| **user_preferences** | Settings & config | Priority 3 |
| **engagement_analytics** | Post engagement metrics | Priority 3 |
| **post_views_timeline** | View count over time | Priority 4 |
| **feed_cache** | Cached feeds | Priority 4 |
| **feed_ranking_scores** | Pre-calculated scores | Priority 4 |
| **search_history** | Search tracking | Priority 4 |
| **device_info** | Device tracking | Priority 4 |
| **recommendations** | User recommendations | Priority 4 |

### Moderation & Reports
| Table | Purpose | Activate |
|-------|---------|----------|
| **reports** | Content reports | Priority 3 |
| **content_moderation_queue** | Moderation workflow | Priority 3 |

### Content Features
| Table | Purpose | Activate |
|-------|---------|----------|
| **reposts** | Repost/share tracking | Priority 3 |
| **polls** | Poll feature | Priority 4 |
| **poll_options** | Poll options | Priority 4 |
| **poll_votes** | Poll votes | Priority 4 |

### Groups & Community
| Table | Purpose | Activate |
|-------|---------|----------|
| **groups** | Community groups | Priority 4 |
| **group_members** | Group memberships | Priority 4 |

### Communications
| Table | Purpose | Activate |
|-------|---------|----------|
| **calls** | Audio/Video calls | Priority 4 |

---

## 📊 TABLE STRUCTURES IN DETAIL

### 1. USERS (22 columns)
```
✓ id, username, full_name, email
✓ profile_pic, cover_pic
✓ bio, website, location, birth_date
✓ is_verified, is_pro_member
✓ red_coins, green_coins
✓ follower_count, following_count, post_count
✓ status, last_seen, created_at, is_private
✓ password (hashed)
```

### 2. POSTS (18 columns)
```
✓ id, user_id, type (post|reel)
✓ caption, media_url, thumbnail_url
✓ audio_name, audio_url
✓ aspect_ratio, duration
✓ visibility (public|private), is_monetized
✓ like_count, comment_count, share_count, view_count
✓ location_name, created_at
```

### 3. LIKES (3 columns)
```
✓ user_id (FK→users)
✓ post_id (FK→posts)
✓ created_at
```

### 4. COMMENTS (6 columns)
```
✓ id, post_id (FK→posts), user_id (FK→users)
✓ parent_id (for replies)
✓ content, created_at
```

### 5. FOLLOWERS (3 columns)
```
- follower_id (FK→users)
- following_id (FK→users)
- created_at
```

### 6. SAVES (3 columns)
```
- user_id (FK→users)
- post_id (FK→posts)
- created_at
```

### 7. HASHTAGS (4 columns)
```
- tag, usage_count
- last_used, created_at
```

### 8. STORIES (6 columns)
```
- id, user_id (FK→users)
- media_url, caption, is_active
- created_at
```

### 9. STORY_VIEWS (3 columns)
```
- story_id (FK→stories)
- user_id (FK→users)
- viewed_at
```

### 10. NOTIFICATIONS (7 columns)
```
- id, user_id (FK→users)
- type (like|comment|follow|message)
- actor_id (FK→users)
- post_id, created_at, read
```

### 11-40. (Other tables - see main documentation)

---

## 🔗 KEY RELATIONSHIPS

```
users (1) ──→ (many) posts
users (1) ──→ (many) likes
users (1) ──→ (many) comments
users (1) ──→ (many) followers (as follower_id)
users (1) ──→ (many) followers (as following_id)
users (1) ──→ (many) saves
users (1) ──→ (many) stories
users (1) ──→ (many) notifications
users (1) ──→ (many) messages

posts (1) ──→ (many) likes
posts (1) ──→ (many) comments
posts (1) ──→ (many) saves
posts (1) ──→ (many) story_views (FK)
posts (1) ──→ (many) post_hashtags

hashtags (1) ──→ (many) post_hashtags
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: Must Have (Week 1-2)
1. **Followers System** → Enable follow/unfollow
2. **Hashtags** → Track trending tags
3. **Saves** → Bookmark functionality
4. **Smart Feed** → Implement ranking

### Phase 2: Important (Week 3-4)
1. **Stories** → 24-hour content
2. **Notifications** → Alert system
3. **User Preferences** → Settings
4. **Analytics** → Basic stats

### Phase 3: Nice to Have (Week 5+)
1. **Messaging** → DM system
2. **Coins/Monetization** → Creator earnings
3. **Polls** → Engagement feature
4. **Groups** → Community aspect
5. **Advanced Analytics** → Deep insights

### Phase 4: Future (Week 8+)
1. **Calls** → Voice/video
2. **Ads** → Monetization
3. **Recommendations** → Personalization
4. **Reports/Moderation** → Safety

---

## 🛠️ TECHNICAL NOTES

### Database Stats
- **Total Tables**: 40
- **Active Tables**: 4
- **Empty/Ready**: 36
- **Total Columns**: 49+
- **Primary Keys**: All tables have `id` or composite keys
- **Foreign Keys**: Extensively used for relationships

### Data Types Used
- `string` - Text fields (UUID for IDs, text for content)
- `number` - Integers (counts, coins, scores)
- `boolean` - Flags (is_verified, is_pro_member, etc.)
- `object` - JSON fields (null values shown as `object`)
- `array` - JSON arrays (stories array, etc.)

### Performance Optimization
- Denormalized counts (like_count, comment_count) on posts for fast feed
- Composite indexes on (user_id, created_at) for timeline queries
- Hashtag usage_count cached (updated on post insert)
- Feed ranking scores can be pre-calculated and cached

---

## 📲 SAMPLE API CALLS FOR APK

### 1. Get Smart Feed (For You Page)
```bash
curl -X GET "https://shorts.talksyra.app/api/posts/reels?limit=20" \
  -H "Authorization: Bearer USER_TOKEN"
```

### 2. Create Post
```bash
curl -X POST "https://shorts.talksyra.app/api/posts" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Amazing content!",
    "media_url": "https://...",
    "type": "post",
    "visibility": "public"
  }'
```

### 3. Like a Post
```bash
curl -X POST "https://shorts.talksyra.app/api/likes" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"post_id": "post-uuid"}'
```

### 4. Follow User
```bash
curl -X POST "https://shorts.talksyra.app/api/follows" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"following_id": "user-uuid"}'
```

### 5. Get User Profile
```bash
curl -X GET "https://shorts.talksyra.app/api/users/user-uuid" \
  -H "Authorization: Bearer USER_TOKEN"
```

### 6. Search
```bash
curl -X GET "https://shorts.talksyra.app/api/search?q=viral&type=all&limit=20" \
  -H "Authorization: Bearer USER_TOKEN"
```

### 7. Get Trending Hashtags
```bash
curl -X GET "https://shorts.talksyra.app/api/trending/hashtags?limit=20" \
  -H "Authorization: Bearer USER_TOKEN"
```

### 8. Get User Stories
```bash
curl -X GET "https://shorts.talksyra.app/api/users/user-uuid/stories" \
  -H "Authorization: Bearer USER_TOKEN"
```

---

## 🔐 Security Checklist

- [x] All endpoints require authentication (except public feeds)
- [x] Service role key stored securely (env variable)
- [x] Anon key has RLS policies
- [x] Rate limiting on comments (10 seconds)
- [x] Input validation on all payloads
- [x] Sensitive fields removed from responses (password)
- [x] User can only update own profile
- [ ] Rate limiting on follows (implement)
- [ ] Rate limiting on likes (implement)
- [ ] Content moderation checks (implement)

---

## 📞 TROUBLESHOOTING

### "Post not found" (404)
- Check post_id is valid UUID
- Verify post visibility is 'public'

### "Unauthorized" (401)
- Verify JWT token is valid
- Check Bearer prefix in Authorization header

### "Too many requests" (429)
- Wait 10 seconds between comments
- Check rate limiting

### Feed is empty
- Verify posts table has public visibility posts
- Check created_at is not in future

### Followers count not updating
- Ensure followers table has insert
- Verify RPC functions are created: increment_follower_count, decrement_follower_count

---

## 📚 REFERENCE FILES

- `/docs/DATABASE_SCHEMA.md` - Original schema (outdated)
- `/docs/SUPABASE_DATABASE_SCHEMA.md` - Latest from inspection
- `/docs/SUPABASE_TABLES.json` - Raw JSON data
- `/docs/API_ENDPOINTS_COMPLETE.md` - All 60+ endpoints
- `/docs/DATABASE_AND_API_COMPLETE.md` - Full documentation
- `/supabase/functions/api-complete/index.ts` - Complete API handler

---

## ✨ SUMMARY FOR GEMINI

**TalkSyra Database:** 40 tables ready for a full-featured Instagram-like app.
- **4 active tables** with sample data (users, posts, likes, comments)
- **36 empty tables** structured and waiting to be populated
- **60+ API endpoints** implemented and ready
- **Smart feed ranking** using engagement, freshness, creator quality
- **Complete feature set**: Posts, Stories, Messages, Notifications, Monetization

**APK can immediately use:**
- Posts & Reels feed ✓
- Like/Unlike ✓
- Comments & Replies ✓
- User profiles ✓
- Search ✓
- Ready to activate: Followers, Saves, Stories, Messages, Analytics

**Last Updated:** May 20, 2026
