# 🎯 TalkSyra Feed System - Complete Overview

Master guide for the newly organized feed system

---

## 📦 What Has Been Created

### New Feed Logic Files

#### 1. `src/feeds/postFeed.js` - Home Feed Handler
- **Purpose**: Fetch and rank home page posts
- **Endpoint**: `GET /api/feed?type=post`
- **Returns**: Ranked image/text posts for home timeline
- **Algorithm**: Instagram-style ranking (7-day decay)
- **Key Function**: `getHomeFeed(supabaseUrl, supabaseKey, userId, limit, offset, personalized)`

**Key Features:**
- Fetches posts where `type='post'`
- Filters public visibility only
- Checks user's like status
- Applies personalization (following only)
- Ranks by composite score algorithm

**Ranking Formula:**
```
SCORE = 
  log10(ENGAGEMENT + 1) × 0.50 +
  FRESHNESS × 0.20 +
  log10(CREATOR_QUALITY + 1) × 0.15 +
  log10(VELOCITY + 1) × 0.10 +
  (visibility=='public' ? 0.05 : 0)
```

**Engagement (Posts):**
```
ENGAGEMENT = likes×1.0 + comments×2.5 + shares×5.0 + views×0.05
```

---

#### 2. `src/feeds/reelsFeed.js` - Reels Feed Handler
- **Purpose**: Fetch and rank vertical video reels
- **Endpoint**: `GET /api/feed?type=reel`
- **Returns**: Ranked short-form videos for reels section
- **Algorithm**: TikTok-style ranking (3-day decay, higher velocity)
- **Key Function**: `getReelsFeed(supabaseUrl, supabaseKey, userId, limit, offset, personalized)`

**Key Features:**
- Fetches posts where `type='reel'`
- Filters by aspect ratio 9:16 (vertical)
- Includes audio track support
- Faster trending (3-day decay)
- Higher engagement + velocity weights

**Ranking Formula:**
```
SCORE = 
  log10(ENGAGEMENT + 1) × 0.60 +
  FRESHNESS × 0.15 +
  log10(CREATOR_QUALITY + 1) × 0.10 +
  log10(VELOCITY + 1) × 0.15 +
  (visibility=='public' ? 0.05 : 0)
```

**Engagement (Reels):**
```
ENGAGEMENT = likes×1.0 + comments×3.0 + shares×6.0 + views×0.10
```

---

#### 3. `src/feeds/feedRanker.js` - Shared Utilities
- **Purpose**: Common ranking utilities and algorithms
- **Exports**: `FeedRanker` class with static methods
- **Usage**: Can be imported by postFeed.js, reelsFeed.js

**Available Utilities:**
- `calculateEngagement(post, reelMode)`
- `calculateFreshness(createdAt, decayDays)`
- `calculateCreatorQuality(author)`
- `calculateVelocity(post, timeUnitHours, reelMode)`
- `calculateCompositeScore(post, weights, reelMode)`
- `rankByScore(items, reelMode)`
- `applyDiversityBoost(items, weight)`
- `filterByContext(posts, context)`
- `detectTrending(posts, threshold)`
- `balanceContentTypes(posts, ratios)`

---

### New Documentation Files

#### 1. `docs/FEED_API_DOCUMENTATION.md`
**Complete API documentation** for APK developers

**Contains:**
- API endpoint definitions
- Request/response formats
- Query parameters explained
- Both post and reel response examples
- Smart ranking algorithm details
- Error responses
- Usage examples (cURL, JavaScript, etc.)
- Pagination guide
- Performance tips

**Key Sections:**
- `/api/feed` endpoint documentation
- Response format with all fields
- Reel-specific fields (duration, audio_url, aspect_ratio)
- Home post-specific fields (location_name)
- Error handling guide
- Performance optimization tips

---

#### 2. `docs/APK_INTEGRATION_GUIDE.md`
**Complete integration guide** for Android & iOS apps

**Contains:**
- API base URLs
- Request format (headers, parameters)
- Response structure
- Android (Kotlin) implementation examples
- iOS (Swift) implementation examples
- Data models (Post, Author, FeedResponse)
- RecyclerView adapter code
- ViewPager2 for reels code
- Infinite scroll implementation
- Error handling
- Retry logic with exponential backoff
- Analytics events to track
- Security best practices

**Key Code Examples:**
- Retrofit interface setup
- ViewModel with pagination
- RecyclerView adapter
- SwiftUI feed view
- Infinite scroll implementation
- Error handling

---

#### 3. `docs/FEED_ARCHITECTURE_OVERVIEW.md`
**Complete architecture guide** explaining the system design

**Contains:**
- Project file structure
- Two feed types overview (Posts vs Reels)
- How to use feed system
- Ranking algorithms explained
- Feed flow diagram
- Database schema reference
- Performance tips
- Testing examples
- Maintenance guidelines
- Deployment checklist

**Key Sections:**
- Feed type comparison (Posts vs Reels)
- Ranking algorithm formulas with examples
- Request/response examples in multiple languages
- Performance optimization strategies
- Monitoring and tuning guidelines

---

#### 4. `docs/FEED_SYSTEM_IMPLEMENTATION.md`
**Step-by-step implementation guide**

**Contains:**
- Integration steps into worker.js
- Testing instructions
- APK integration checklist
- Request/response examples
- Algorithm comparison table
- Score calculation examples
- Data flow diagram
- Troubleshooting guide
- Verification checklist

---

## 🎯 File Organization

```
Project Root/
│
├── src/
│   ├── worker.js                          [Main Worker - needs update]
│   └── feeds/                             [NEW - Feed Logic]
│       ├── postFeed.js                    [✅ NEW - Home feed logic]
│       ├── reelsFeed.js                   [✅ NEW - Reels feed logic]
│       └── feedRanker.js                  [✅ NEW - Shared algorithms]
│
├── docs/
│   ├── FEED_API_DOCUMENTATION.md          [✅ NEW - API reference]
│   ├── APK_INTEGRATION_GUIDE.md           [✅ NEW - APK guide]
│   ├── FEED_ARCHITECTURE_OVERVIEW.md      [✅ NEW - Architecture]
│   └── FEED_SYSTEM_IMPLEMENTATION.md      [✅ NEW - Implementation]
│
├── supabase/
│   └── functions/
│       ├── feed/                          [Existing]
│       ├── handle-interaction/            [Existing]
│       └── api-complete/                  [Existing]
│
└── wrangler.toml                          [Cloudflare config]
```

---

## 🔄 How It Works

### User opens APK home feed
```
APK makes request:
GET https://shorts.talksyra.app/api/feed?type=post&userId=user123&limit=20
                         ↓
Cloudflare Worker receives request
                         ↓
Imports getHomeFeed() from src/feeds/postFeed.js
                         ↓
postFeed.js:
  1. Fetches posts from Supabase (type='post', visibility='public')
  2. Gets user's following list (if personalized=true)
  3. Filters posts by following (if personalized)
  4. Fetches user's like status
  5. Ranks posts using composite score algorithm
  6. Returns top 20 ranked posts
                         ↓
Response JSON sent back to APK:
{
  success: true,
  data: [...20 ranked posts with metadata],
  pagination: { total: 2500, has_more: true }
}
                         ↓
APK displays feed in RecyclerView
```

### User opens APK reels section
```
APK makes request:
GET https://shorts.talksyra.app/api/feed?type=reel&userId=user123&limit=10
                         ↓
Cloudflare Worker receives request
                         ↓
Imports getReelsFeed() from src/feeds/reelsFeed.js
                         ↓
reelsFeed.js:
  1. Fetches reels from Supabase (type='reel', visibility='public')
  2. Gets user's following list (if personalized=true)
  3. Filters reels by following (if personalized)
  4. Fetches user's like status
  5. Ranks reels using reel-specific algorithm (60% engagement, 3-day decay)
  6. Returns top 10 ranked reels
                         ↓
Response JSON sent back to APK:
{
  success: true,
  data: [...10 ranked reels with video URLs],
  pagination: { total: 5000, has_more: true }
}
                         ↓
APK displays reels in ViewPager2
```

---

## 📊 Key Differences: Posts vs Reels

| Aspect | Posts | Reels |
|--------|-------|-------|
| **Type Value** | `post` | `reel` |
| **API Endpoint** | `/api/feed?type=post` | `/api/feed?type=reel` |
| **Engagement Weight** | 50% | 60% ⬆️ (more important) |
| **Freshness Decay** | 7 days | 3 days ⬆️ (shorter) |
| **Creator Quality** | 15% | 10% |
| **Velocity Weight** | 10% | 15% ⬆️ (trending faster) |
| **Time Measurement** | Days | Hours ⬆️ (finer granularity) |
| **View Weight** | 0.05× | 0.1× ⬆️ (more valued) |
| **Media Format** | JPG/PNG (image) | MP4/WebM (video) |
| **Aspect Ratio** | Varies (4:3, 16:9, 1:1) | Fixed (9:16 vertical) |
| **Audio** | Null | Usually URL (music/sound) |
| **Default Limit** | 20 per request | 10 per request |

---

## 🚀 Quick Start for Developers

### 1. Backend Engineer (Cloudflare Worker)

```javascript
// Update worker.js
import { getHomeFeed } from "./feeds/postFeed.js";
import { getReelsFeed } from "./feeds/reelsFeed.js";

// In /api/feed handler:
if (type === 'reel') {
  result = await getReelsFeed(SB_URL, SB_KEY, userId, limit, offset, personalized);
} else {
  result = await getHomeFeed(SB_URL, SB_KEY, userId, limit, offset, personalized);
}
```

### 2. Android Developer (Kotlin)

```kotlin
// Read: docs/APK_INTEGRATION_GUIDE.md - Android section
// 1. Create data models (Post, Author, FeedResponse)
// 2. Create Retrofit interface
// 3. Create ViewModel with pagination
// 4. Create RecyclerView adapter
// 5. Implement infinite scroll

val homeFeed = api.getHomeFeed(
    type = "post",
    userId = userId,
    limit = 20,
    offset = 0
)
```

### 3. iOS Developer (Swift)

```swift
// Read: docs/APK_INTEGRATION_GUIDE.md - iOS section
// 1. Create Codable data models
// 2. Create API call using Alamofire
// 3. Create @ObservedObject ViewModel
// 4. Create SwiftUI views
// 5. Implement pagination

let params: [String: Any] = [
    "type": "reel",
    "userId": userId,
    "limit": 10
]
AF.request("https://shorts.talksyra.app/api/feed", parameters: params)
```

---

## 📡 API Summary

### Endpoints

**Home Feed (Posts)**
```
GET /api/feed?type=post&userId=USER_ID&limit=20&offset=0
```
Returns: 20 ranked home timeline posts

**Reels Feed (Shorts)**
```
GET /api/feed?type=reel&userId=USER_ID&limit=10&offset=0
```
Returns: 10 ranked short-form videos

**Personalized Feed**
```
GET /api/feed?type=post&userId=USER_ID&personalized=true&limit=20
```
Returns: Posts only from users you follow

---

## 🧮 Ranking Examples

### Post Example

Input:
- 1,000 likes, 80 comments, 40 shares, 15,000 views
- 2 days old
- Creator: 10k followers, verified ✓

Calculation:
```
Engagement = 1000 + 200 + 200 + 750 = 2,150
Freshness = 1 - (2/7) = 0.714
Creator = 10,000 × 1.5 = 15,000
Velocity = 2,150 / 3 = 716.7

Score = log10(2150)×0.5 + 0.714×0.2 + log10(15000)×0.15 + log10(717)×0.1 + 0.05
Score ≈ 7.8 (shows high in feed)
```

### Reel Example

Input:
- 20,000 likes, 5,000 comments, 15,000 shares, 500,000 views
- 1 day (24 hours) old
- Creator: 100k followers, verified ✓

Calculation:
```
Engagement = 20000 + 15000 + 90000 + 50000 = 175,000
Freshness = 1 - (1/3) = 0.667
Creator = 100,000 × 1.5 = 150,000
Velocity = 175,000 / 25 = 7,000

Score = log10(175000)×0.6 + 0.667×0.15 + log10(150000)×0.1 + log10(7000)×0.15 + 0.05
Score ≈ 9.4 (trending!)
```

---

## ✅ Implementation Checklist

- [ ] **Backend**: Import feed functions in worker.js
- [ ] **Backend**: Route /api/feed to appropriate handler
- [ ] **Backend**: Deploy worker to Cloudflare
- [ ] **Backend**: Test `/api/feed?type=post` endpoint
- [ ] **Backend**: Test `/api/feed?type=reel` endpoint
- [ ] **APK**: Read `APK_INTEGRATION_GUIDE.md`
- [ ] **APK**: Create data models
- [ ] **APK**: Implement API client
- [ ] **APK**: Create feed UI (RecyclerView/SwiftUI)
- [ ] **APK**: Implement pagination
- [ ] **APK**: Add error handling
- [ ] **APK**: Test on simulator
- [ ] **APK**: Test on real device

---

## 📚 Reference Files

### For Understanding

1. **Start here**: `docs/FEED_ARCHITECTURE_OVERVIEW.md` - Understand the design
2. **For APK**: `docs/APK_INTEGRATION_GUIDE.md` - Implement in your app
3. **For API**: `docs/FEED_API_DOCUMENTATION.md` - API reference
4. **For Deployment**: `docs/FEED_SYSTEM_IMPLEMENTATION.md` - Deploy steps

### For Code

1. `src/feeds/postFeed.js` - Home feed ranking logic
2. `src/feeds/reelsFeed.js` - Reels ranking logic
3. `src/feeds/feedRanker.js` - Shared utilities
4. `src/worker.js` - Worker entry point (needs update)

---

## 🎓 Learning Path

### Week 1: Understanding
- [ ] Read `FEED_ARCHITECTURE_OVERVIEW.md`
- [ ] Understand the two feed types
- [ ] Study ranking algorithms
- [ ] Review database schema

### Week 2: Integration
- [ ] Implement in Cloudflare Worker
- [ ] Deploy and test endpoints
- [ ] Verify ranking results
- [ ] Check database queries

### Week 3: APK Development
- [ ] Read `APK_INTEGRATION_GUIDE.md`
- [ ] Create data models
- [ ] Implement API client
- [ ] Build feed UI

### Week 4: Testing & Optimization
- [ ] Test pagination
- [ ] Test personalization
- [ ] Performance profiling
- [ ] Error handling
- [ ] Analytics tracking

---

## 🔒 Security & Best Practices

✅ **What's Secure:**
- Supabase anon key used (read-only)
- Service key never exposed
- JWT forwarding support
- CORS headers properly set

⚠️ **To Implement:**
- Certificate pinning for sensitive ops
- Rate limiting on /api/feed
- Input validation (limit max 100)
- Cache-control headers
- Content-Security-Policy

---

## 📞 Need Help?

### For API Questions
→ Read `docs/FEED_API_DOCUMENTATION.md`

### For APK Integration
→ Read `docs/APK_INTEGRATION_GUIDE.md`

### For Architecture
→ Read `docs/FEED_ARCHITECTURE_OVERVIEW.md`

### For Deployment
→ Read `docs/FEED_SYSTEM_IMPLEMENTATION.md`

### For Code Details
→ Check comments in `postFeed.js`, `reelsFeed.js`, `feedRanker.js`

---

## 🎉 Summary

You now have a **fully organized and documented feed system**:

✅ Separate logic for posts and reels  
✅ Smart ranking algorithm for each type  
✅ Complete API documentation  
✅ APK integration guide with code examples  
✅ Architecture documentation  
✅ Implementation guide  

**Next Steps:**
1. Update `worker.js` with new imports
2. Deploy to Cloudflare
3. Test endpoints
4. Share docs with APK team
5. Start APK implementation

