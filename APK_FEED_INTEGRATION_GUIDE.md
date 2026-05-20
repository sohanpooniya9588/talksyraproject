# 📱 APK FEED INTEGRATION GUIDE - Complete Step by Step

**For APK Developers**: This file explains exactly how feed data flows from API to your app.

---

## 🎯 QUICK ANSWER - FEED KAISE AAYEGI

| Step | What Happens |
|------|--------------|
| 1 | APK user ko login karti hai → Bearer token milta hai |
| 2 | APK `/posts/reels` endpoint ko request bhejti hai |
| 3 | API database se reels fetch karti hai + smart ranking apply karti hai |
| 4 | API JSON response bhejta hai APK ko |
| 5 | APK response parse karti hai |
| 6 | APK reels ko UI me display karti hai (video scroll) |
| 7 | User scroll karta hai → Load more automatically |

---

## 📊 FEED KAISE AAYEGI - DATA STRUCTURE

### **WHAT THE API SENDS BACK (Reels Feed)**

```json
{
  "reels": [
    {
      "id": "f0a8c4d1-2b5e-4f3a-8c9d-1e5a2f3b4c5d",
      "type": "reel",
      "caption": "Amazing dance move! 🔥",
      "media_url": "https://cdn.talksyra.com/videos/reel123.mp4",
      "thumbnail_url": "https://cdn.talksyra.com/thumbnails/reel123.jpg",
      "duration": 30,
      "aspect_ratio": 0.5625,
      "like_count": 5432,
      "comment_count": 245,
      "share_count": 89,
      "view_count": 54320,
      "engagement_score": 8.75,
      "location_name": "Mumbai, India",
      "created_at": "2026-05-20T10:30:00Z",
      "author": {
        "id": "user-uuid-123",
        "username": "dance_creator",
        "full_name": "Raj Kumar",
        "profile_pic": "https://cdn.talksyra.com/profiles/user123.jpg",
        "is_verified": true,
        "follower_count": 50000,
        "is_pro_member": true
      },
      "user_liked": false,
      "user_saved": false
    },
    // ... more reels (20 per page)
  ],
  "hasMore": true,
  "nextOffset": 20
}
```

---

## 🔧 APK KE LIYE REQUEST GUIDE

### **STEP 1: USER LOGIN (Token Get Karna)**

```javascript
// APK code - Flutter/React Native/Native Android
import 'package:supabase_flutter/supabase_flutter.dart';

final supabase = Supabase.instance.client;

// User login
final response = await supabase.auth.signInWithPassword(
  email: 'user@example.com',
  password: 'password123'
);

// Token get karna
final userToken = response.session?.accessToken;
print('Token: $userToken');
```

---

### **STEP 2: REELS FEED REQUEST (API Ko Request Bhej Raha)**

```javascript
// ====== REQUEST ======
GET /posts/reels?limit=20&offset=0 HTTP/1.1
Host: https://your-worker.workers.dev/api
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Complete APK Code Example:**

```javascript
// Flutter/Dart
Future<List<Reel>> getReelsFeed({int limit = 20, int offset = 0}) async {
  try {
    final response = await http.get(
      Uri.parse('https://shorts.talksyra.app/api/posts/reels?limit=$limit&offset=$offset'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      final reels = (json['reels'] as List)
          .map((r) => Reel.fromJson(r))
          .toList();
      return reels;
    } else if (response.statusCode == 401) {
      throw Exception('Unauthorized - Invalid token');
    } else {
      throw Exception('Failed to load reels');
    }
  } catch (e) {
    print('Error: $e');
    rethrow;
  }
}
```

```javascript
// React Native / JavaScript
async function getReelsFeed(userToken, limit = 20, offset = 0) {
  try {
    const response = await fetch(
      `https://shorts.talksyra.app/api/posts/reels?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.reels; // Array of reels
  } catch (error) {
    console.error('Error fetching reels:', error);
    throw error;
  }
}
```

```kotlin
// Kotlin - Android Native
suspend fun getReelsFeed(userToken: String, limit: Int = 20, offset: Int = 0): List<Reel> {
    return withContext(Dispatchers.IO) {
        val client = OkHttpClient()
        val request = Request.Builder()
            .url("https://shorts.talksyra.app/api/posts/reels?limit=$limit&offset=$offset")
            .addHeader("Authorization", "Bearer $userToken")
            .addHeader("Content-Type", "application/json")
            .get()
            .build()

        val response = client.newCall(request).execute()
        
        if (response.isSuccessful) {
            val json = JSONObject(response.body?.string() ?: "{}")
            val reelsArray = json.getJSONArray("reels")
            // Parse to Reel objects
            parseReels(reelsArray)
        } else {
            throw Exception("Failed to fetch reels: ${response.code}")
        }
    }
}
```

---

### **STEP 3: APK ME RESPONSE RECEIVE & PARSE KARNA**

```javascript
// What APK receives and how to use it
const data = {
  "reels": [
    {
      "id": "reel-id-1",
      "caption": "Amazing dance move!",
      "media_url": "https://cdn.talksyra.com/videos/reel.mp4",
      "like_count": 5432,
      "author": {
        "username": "dance_creator",
        "profile_pic": "https://cdn.talksyra.com/profile.jpg"
      },
      "user_liked": false,
      // ... more fields
    }
  ],
  "hasMore": true
}

// APK me use karna
data.reels.forEach(reel => {
  // 1. Video player me video play karna
  loadVideoPlayer(reel.media_url)
  
  // 2. Creator ke naam + pic show karna
  displayCreatorInfo(reel.author.username, reel.author.profile_pic)
  
  // 3. Like count display
  displayLikeCount(reel.like_count)
  
  // 4. Caption show karna
  displayCaption(reel.caption)
})
```

---

## 📱 COMPLETE APK INTEGRATION EXAMPLE

### **Flutter Complete Example**

```dart
// lib/screens/reels_screen.dart

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ReelsScreen extends StatefulWidget {
  final String userToken;
  
  const ReelsScreen({required this.userToken});

  @override
  _ReelsScreenState createState() => _ReelsScreenState();
}

class _ReelsScreenState extends State<ReelsScreen> {
  List<dynamic> reels = [];
  int offset = 0;
  bool isLoading = true;
  bool hasMore = true;
  
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    fetchReels();
    
    // Infinite scroll - load more when user scrolls to end
    _scrollController.addListener(() {
      if (_scrollController.position.pixels ==
          _scrollController.position.maxScrollExtent) {
        if (hasMore) {
          fetchReels();
        }
      }
    });
  }

  Future<void> fetchReels() async {
    if (!mounted) return;
    
    setState(() => isLoading = true);
    
    try {
      final response = await http.get(
        Uri.parse(
          'https://shorts.talksyra.app/api/posts/reels?limit=20&offset=$offset',
        ),
        headers: {
          'Authorization': 'Bearer ${widget.userToken}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        
        if (mounted) {
          setState(() {
            reels.addAll(json['reels']);
            offset += 20;
            hasMore = json['hasMore'] ?? false;
            isLoading = false;
          });
        }
      } else if (response.statusCode == 401) {
        // Token expired - redirect to login
        Navigator.of(context).pushReplacementNamed('/login');
      } else {
        throw Exception('Failed to load reels');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('For You')),
      body: isLoading && reels.isEmpty
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              controller: _scrollController,
              itemCount: reels.length + (hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == reels.length) {
                  return Padding(
                    padding: EdgeInsets.all(16),
                    child: CircularProgressIndicator(),
                  );
                }
                
                final reel = reels[index];
                
                return ReelCard(
                  reel: reel,
                  userToken: widget.userToken,
                );
              },
            ),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}

// Reel card widget
class ReelCard extends StatefulWidget {
  final dynamic reel;
  final String userToken;

  const ReelCard({
    required this.reel,
    required this.userToken,
  });

  @override
  _ReelCardState createState() => _ReelCardState();
}

class _ReelCardState extends State<ReelCard> {
  late bool isLiked;

  @override
  void initState() {
    super.initState();
    isLiked = widget.reel['user_liked'] ?? false;
  }

  Future<void> toggleLike() async {
    try {
      if (isLiked) {
        // Unlike
        await http.delete(
          Uri.parse(
            'https://shorts.talksyra.app/api/likes/${widget.reel['id']}',
          ),
          headers: {'Authorization': 'Bearer ${widget.userToken}'},
        );
      } else {
        // Like
        await http.post(
          Uri.parse('https://shorts.talksyra.app/api/likes'),
          headers: {
            'Authorization': 'Bearer ${widget.userToken}',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({'post_id': widget.reel['id']}),
        );
      }

      setState(() {
        isLiked = !isLiked;
        widget.reel['like_count'] += isLiked ? 1 : -1;
      });
    } catch (e) {
      print('Error toggling like: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height,
      color: Colors.black,
      child: Stack(
        children: [
          // Video Player
          Center(
            child: VideoPlayer(
              url: widget.reel['media_url'],
            ),
          ),

          // Creator Info - Top Left
          Positioned(
            bottom: 80,
            left: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Creator avatar + name
                Row(
                  children: [
                    CircleAvatar(
                      backgroundImage: NetworkImage(
                        widget.reel['author']['profile_pic'] ?? '',
                      ),
                      radius: 20,
                    ),
                    SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.reel['author']['username'],
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (widget.reel['author']['is_verified'] == true)
                          Icon(Icons.verified, color: Colors.blue, size: 14),
                      ],
                    ),
                  ],
                ),
                SizedBox(height: 10),
                
                // Caption
                Text(
                  widget.reel['caption'] ?? '',
                  style: TextStyle(color: Colors.white, fontSize: 14),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Interactions - Right Side
          Positioned(
            right: 16,
            bottom: 100,
            child: Column(
              children: [
                // Like button
                GestureDetector(
                  onTap: toggleLike,
                  child: Column(
                    children: [
                      Icon(
                        isLiked ? Icons.favorite : Icons.favorite_border,
                        color: isLiked ? Colors.red : Colors.white,
                        size: 28,
                      ),
                      SizedBox(height: 4),
                      Text(
                        widget.reel['like_count'].toString(),
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 20),

                // Comment button
                Column(
                  children: [
                    Icon(Icons.comment, color: Colors.white, size: 28),
                    SizedBox(height: 4),
                    Text(
                      widget.reel['comment_count'].toString(),
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ],
                ),
                SizedBox(height: 20),

                // Share button
                Icon(Icons.share, color: Colors.white, size: 28),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 🔄 POST FEED VS REELS FEED - DIFFERENCE

### **POST FEED (Chronological Timeline)**

```
GET /posts/feed?limit=20&offset=0

Response:
{
  "posts": [
    {
      "type": "post",  // ← Text post with image
      "caption": "Check this out!",
      "media_url": "https://cdn.talksyra.com/image.jpg",
      // No duration, aspect_ratio
      // Created at shown
    }
  ]
}
```

**UI**: Instagram style feed - scroll vertically, each post takes part of screen

---

### **REELS FEED (For You Page - Smart Ranking)**

```
GET /posts/reels?limit=20&offset=0

Response:
{
  "reels": [
    {
      "type": "reel",  // ← Video reel
      "caption": "Amazing dance!",
      "media_url": "https://cdn.talksyra.com/video.mp4",
      "duration": 30,
      "aspect_ratio": 0.5625,  // 9:16
      "engagement_score": 8.75,  // ← Smart ranking
      // Reels are full screen
    }
  ]
}
```

**UI**: TikTok/Instagram Reels style - full screen video, swipe up to next

---

## ⚡ OPTIMIZATION TIPS

### **1. CACHING (Offline Support)**

```javascript
// Save reels locally
await localStorage.setItem('cachedReels', JSON.stringify(reels));

// Load from cache first
const cached = await localStorage.getItem('cachedReels');
if (cached) {
  displayReels(JSON.parse(cached));
}

// Sync with API in background
fetchReelsFromAPI();
```

### **2. LAZY LOADING (Video)**

```javascript
// Don't download all videos
// Only load current + next 2 videos

const currentIndex = 0;

function preloadVideos(index) {
  // Load current
  preloadVideo(reels[index].media_url);
  
  // Preload next 2
  if (index + 1 < reels.length) {
    preloadVideo(reels[index + 1].media_url);
  }
  if (index + 2 < reels.length) {
    preloadVideo(reels[index + 2].media_url);
  }
}
```

### **3. ERROR HANDLING**

```javascript
async function getReelsWithRetry(userToken, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getReelsFeed(userToken);
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error}`);
      }
      // Wait before retry (exponential backoff)
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}
```

---

## 🚨 COMMON ERRORS & FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| **401 Unauthorized** | Token expired/invalid | Re-login user, get new token |
| **404 Not Found** | Wrong endpoint URL | Check URL: `/api/posts/reels` |
| **Empty feed** | No reels in DB | Create sample reels first |
| **Slow loading** | Too many videos | Use lazy loading + pagination |
| **Video won't play** | Invalid media_url | Check CDN URL is accessible |
| **Like button no response** | API timeout | Add retry logic + timeout handling |

---

## 📡 REQUEST CHECKLIST

Before sending request to API, check:

- ✅ Bearer token is valid and not expired
- ✅ Token is in `Authorization` header
- ✅ Header format: `Authorization: Bearer <token>`
- ✅ URL is correct: `https://shorts.talksyra.app/api/posts/reels`
- ✅ Query params: `?limit=20&offset=0`
- ✅ Method: `GET`
- ✅ Content-Type: `application/json`
- ✅ Internet connection is active
- ✅ Firewall/proxy not blocking requests

---

## 🔐 SECURITY CHECKLIST

- ❌ Never hardcode token in code
- ✅ Use secure storage (Keychain/Keystore)
- ❌ Never log token
- ✅ Use HTTPS only
- ❌ Never expose token in URLs
- ✅ Add token expiration handling
- ✅ Refresh token before it expires

---

## 📊 RESPONSE TIME EXPECTATIONS

| Operation | Expected Time |
|-----------|----------------|
| Get 20 reels | 200-400ms |
| Like/Unlike | 100-200ms |
| Comment | 150-300ms |
| Load video | 500-1000ms |
| Full page load | 1-2 seconds |

---

## 🎯 STEP-BY-STEP IMPLEMENTATION

### **Step 1: Setup**
```
1. Install HTTP client library (http, dio, etc.)
2. Get user token from Supabase Auth
3. Store token securely
```

### **Step 2: Create API Service**
```
1. Create function getReelsFeed(token, limit, offset)
2. Add error handling
3. Add retry logic
```

### **Step 3: Create UI**
```
1. Create Reels screen
2. Add video player
3. Add interaction buttons (like, comment, share)
4. Add infinite scroll
```

### **Step 4: Test**
```
1. Test without internet
2. Test with expired token
3. Test pagination
4. Test video playback
```

---

## 📱 APK KE LIYE FINAL CODE

**Minimal working example:**

```javascript
// APK me directly use kar sakte ho

const API_BASE = "https://shorts.talksyra.app/api";
let userToken = ""; // Set after login
let offset = 0;
let reels = [];

// Function 1: Login
async function login(email, password) {
  // Get token from Supabase
  const response = await supabase.auth.signInWithPassword({
    email, password
  });
  userToken = response.session.access_token;
}

// Function 2: Get Reels
async function getReels() {
  const response = await fetch(
    `${API_BASE}/posts/reels?limit=20&offset=${offset}`,
    {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }
  );
  const data = await response.json();
  reels = [...reels, ...data.reels];
  offset += 20;
  return data.reels;
}

// Function 3: Display Reels
function displayReels(reelsData) {
  reelsData.forEach(reel => {
    console.log(`${reel.author.username}: ${reel.caption}`);
    console.log(`Likes: ${reel.like_count}`);
    console.log(`Video: ${reel.media_url}`);
    
    // Render in UI
    renderReelCard(reel);
  });
}

// Function 4: Like Post
async function likePost(postId) {
  const response = await fetch(`${API_BASE}/likes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ post_id: postId })
  });
  return response.json();
}

// Usage
(async () => {
  await login('user@example.com', 'password');
  const reels = await getReels();
  displayReels(reels);
})();
```

---

## ✅ FINAL CHECKLIST

- [x] API endpoint know: `/posts/reels`
- [x] Request method: `GET`
- [x] Authentication: Bearer token
- [x] Response format: JSON array of reels
- [x] Pagination: limit + offset
- [x] Error handling: 401, 404, 500
- [x] Caching: Local storage
- [x] Lazy loading: Video preload
- [x] Infinite scroll: Load more on end
- [x] UI rendering: Video player + buttons

---

**Last Updated**: May 20, 2026  
**For**: TalkSyra APK Developers  
**Status**: Ready to Implement ✅
