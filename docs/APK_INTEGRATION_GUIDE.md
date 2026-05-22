# 📱 TalkSyra APK Integration Guide

Complete guide for integrating TalkSyra Feed API into your Android/iOS APK

---

## 🎯 Overview

The TalkSyra API provides two main feed types:
1. **Home Feed** (`type=post`) - Image/text posts from home page
2. **Reels Feed** (`type=reel`) - Short vertical videos in reels section

Both feeds use smart AI ranking to show best content first.

---

## 🚀 API Base URLs

```
API_ENDPOINT = "https://shorts.talksyra.app"
MEDIA_CDN = "https://api.talksyra.app"
SUPABASE_URL = "https://frmazzmzyychdfajnslt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybWF6em16eXljaGRmYWpuc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzEwMDMsImV4cCI6MjA4NzM0NzAwM30.85x1WBkFX9bdpGw1T5-azJ03WsdzJ1r2EiiScxQnQl0"
```

---

## 📡 Request Format

### Home Feed Request

**Endpoint:**
```
GET https://shorts.talksyra.app/api/feed?type=post&userId=USER_ID&limit=20&offset=0
```

**Headers:**
```
GET /api/feed HTTP/1.1
Host: shorts.talksyra.app
Content-Type: application/json
Accept: application/json
Accept-Encoding: gzip, deflate
User-Agent: TalkSyra-APK/1.0
```

**Query Parameters:**

| Parameter | Value | Example |
|-----------|-------|---------|
| `type` | `post` | `type=post` |
| `userId` | User ID (optional) | `userId=abc123def456` |
| `limit` | 20-50 | `limit=20` |
| `offset` | Pagination | `offset=0` |

**Example cURL:**
```bash
curl "https://shorts.talksyra.app/api/feed?type=post&userId=abc123&limit=20&offset=0"
```

---

### Reels Feed Request

**Endpoint:**
```
GET https://shorts.talksyra.app/api/feed?type=reel&userId=USER_ID&limit=10&offset=0
```

**Query Parameters:**

| Parameter | Value | Example |
|-----------|-------|---------|
| `type` | `reel` | `type=reel` |
| `userId` | User ID (optional) | `userId=abc123def456` |
| `limit` | 10-30 | `limit=10` |
| `offset` | Pagination | `offset=0` |

**Example cURL:**
```bash
curl "https://shorts.talksyra.app/api/feed?type=reel&userId=abc123&limit=10&offset=0"
```

---

## 📦 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "post-123",
      "type": "post",
      "caption": "Beautiful sunset in Goa #travel",
      "media_url": "https://api.talksyra.app/posts/post-123.jpg",
      "thumbnail_url": "https://api.talksyra.app/posts/post-123-thumb.jpg",
      "audio_url": null,
      "aspect_ratio": "4/3",
      "duration": null,
      "visibility": "public",
      "location_name": "Goa, India",
      "like_count": 1200,
      "comment_count": 95,
      "share_count": 45,
      "view_count": 8900,
      "created_at": "2026-05-20T10:30:00Z",
      "updated_at": "2026-05-22T15:45:00Z",
      "score": 8.75,
      "is_liked": false,
      "author": {
        "id": "user-456",
        "username": "travel_guru",
        "full_name": "Travel Guru",
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

### Reel Response Example

```json
{
  "id": "reel-789",
  "type": "reel",
  "caption": "Learn React Hooks in 60 seconds #coding",
  "media_url": "https://api.talksyra.app/reels/reel-789.mp4",
  "thumbnail_url": "https://api.talksyra.app/reels/reel-789-thumb.jpg",
  "audio_url": "https://api.talksyra.app/audio/music-123.mp3",
  "aspect_ratio": "9/16",
  "duration": 60,
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
    "username": "code_master",
    "full_name": "Code Master",
    "profile_pic": "https://api.talksyra.app/avatars/user-789.jpg",
    "is_verified": true,
    "follower_count": 125000
  }
}
```

---

## 📱 APK Implementation Guide

### Android (Kotlin)

#### 1. Make Request to Home Feed

```kotlin
// Retrofit Interface
interface TalkSyraApi {
    @GET("/api/feed")
    suspend fun getHomeFeed(
        @Query("type") type: String = "post",
        @Query("userId") userId: String,
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0
    ): FeedResponse
}

// Data Model
data class Post(
    val id: String,
    val type: String,
    val caption: String,
    val media_url: String,
    val thumbnail_url: String,
    val audio_url: String?,
    val aspect_ratio: String,
    val duration: Int?,
    val like_count: Int,
    val comment_count: Int,
    val share_count: Int,
    val view_count: Int,
    val is_liked: Boolean,
    val author: Author,
    val created_at: String
)

data class Author(
    val id: String,
    val username: String,
    val full_name: String,
    val profile_pic: String,
    val is_verified: Boolean,
    val follower_count: Int
)

data class FeedResponse(
    val success: Boolean,
    val data: List<Post>,
    val pagination: Pagination
)

data class Pagination(
    val total: Int,
    val limit: Int,
    val offset: Int,
    val has_more: Boolean
)

// Usage in ViewModel
class FeedViewModel(private val api: TalkSyraApi) : ViewModel() {
    private val _posts = MutableLiveData<List<Post>>()
    val posts: LiveData<List<Post>> = _posts

    private var currentOffset = 0

    fun loadHomeFeed(userId: String) {
        viewModelScope.launch {
            try {
                val response = api.getHomeFeed(
                    type = "post",
                    userId = userId,
                    limit = 20,
                    offset = currentOffset
                )
                if (response.success) {
                    _posts.value = response.data
                    currentOffset += response.data.size
                }
            } catch (e: Exception) {
                // Handle error
            }
        }
    }

    fun loadMorePosts(userId: String) {
        viewModelScope.launch {
            try {
                val response = api.getHomeFeed(
                    type = "post",
                    userId = userId,
                    limit = 20,
                    offset = currentOffset
                )
                if (response.success) {
                    val currentPosts = _posts.value.orEmpty()
                    _posts.value = currentPosts + response.data
                    currentOffset += response.data.size
                }
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
```

#### 2. Make Request to Reels Feed

```kotlin
fun loadReelsFeed(userId: String) {
    viewModelScope.launch {
        try {
            val response = api.getHomeFeed(
                type = "reel",
                userId = userId,
                limit = 10,
                offset = currentReelOffset
            )
            if (response.success) {
                _reels.value = response.data
                currentReelOffset += response.data.size
            }
        } catch (e: Exception) {
            // Handle error
        }
    }
}
```

#### 3. Display Posts in RecyclerView

```kotlin
class FeedAdapter(private val posts: List<Post>) : 
    RecyclerView.Adapter<FeedAdapter.PostViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_post, parent, false)
        return PostViewHolder(view)
    }

    override fun onBindViewHolder(holder: PostViewHolder, position: Int) {
        holder.bind(posts[position])
    }

    override fun getItemCount() = posts.size

    inner class PostViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val imageView: ImageView = itemView.findViewById(R.id.postImage)
        private val captionView: TextView = itemView.findViewById(R.id.caption)
        private val authorView: TextView = itemView.findViewById(R.id.author)
        private val likesView: TextView = itemView.findViewById(R.id.likes)

        fun bind(post: Post) {
            // Load image with Glide
            Glide.with(itemView.context)
                .load(post.media_url)
                .thumbnail(Glide.with(itemView).load(post.thumbnail_url))
                .into(imageView)

            captionView.text = post.caption
            authorView.text = post.author.username
            likesView.text = "${post.like_count} likes"
        }
    }
}
```

#### 4. Display Reels in ViewPager2

```kotlin
class ReelsAdapter(private val reels: List<Post>) : 
    RecyclerView.Adapter<ReelsAdapter.ReelViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReelViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_reel, parent, false)
        return ReelViewHolder(view)
    }

    override fun onBindViewHolder(holder: ReelViewHolder, position: Int) {
        holder.bind(reels[position])
    }

    override fun getItemCount() = reels.size

    inner class ReelViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val videoView: VideoView = itemView.findViewById(R.id.videoView)
        private val playButton: ImageButton = itemView.findViewById(R.id.playButton)

        fun bind(reel: Post) {
            videoView.apply {
                setVideoPath(reel.media_url)
                setOnPreparedListener { start() }
            }

            playButton.setOnClickListener {
                if (videoView.isPlaying) {
                    videoView.pause()
                } else {
                    videoView.start()
                }
            }
        }
    }
}
```

---

### iOS (Swift)

#### 1. API Call for Home Feed

```swift
import Alamofire

struct Post: Codable {
    let id: String
    let type: String
    let caption: String
    let media_url: String
    let thumbnail_url: String
    let audio_url: String?
    let aspect_ratio: String
    let duration: Int?
    let like_count: Int
    let comment_count: Int
    let share_count: Int
    let view_count: Int
    let is_liked: Bool
    let author: Author
    let created_at: String
}

struct Author: Codable {
    let id: String
    let username: String
    let full_name: String
    let profile_pic: String
    let is_verified: Bool
    let follower_count: Int
}

struct FeedResponse: Codable {
    let success: Bool
    let data: [Post]
    let pagination: Pagination
}

struct Pagination: Codable {
    let total: Int
    let limit: Int
    let offset: Int
    let has_more: Bool
}

// ViewModel
class FeedViewModel: ObservableObject {
    @Published var posts: [Post] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private var currentOffset = 0
    private let apiURL = "https://shorts.talksyra.app"

    func loadHomeFeed(userId: String) {
        isLoading = true
        
        let params: [String: Any] = [
            "type": "post",
            "userId": userId,
            "limit": 20,
            "offset": currentOffset
        ]

        AF.request("\(apiURL)/api/feed", parameters: params)
            .validate()
            .responseDecodable(of: FeedResponse.self) { response in
                self.isLoading = false

                switch response.result {
                case .success(let feedResponse):
                    self.posts = feedResponse.data
                    self.currentOffset += feedResponse.data.count
                    
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
    }

    func loadMorePosts(userId: String) {
        let params: [String: Any] = [
            "type": "post",
            "userId": userId,
            "limit": 20,
            "offset": currentOffset
        ]

        AF.request("\(apiURL)/api/feed", parameters: params)
            .validate()
            .responseDecodable(of: FeedResponse.self) { response in
                switch response.result {
                case .success(let feedResponse):
                    self.posts.append(contentsOf: feedResponse.data)
                    self.currentOffset += feedResponse.data.count
                    
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
    }
}

// SwiftUI View
struct FeedView: View {
    @ObservedObject var viewModel = FeedViewModel()
    let userId: String

    var body: some View {
        NavigationView {
            List(viewModel.posts) { post in
                PostRow(post: post)
            }
            .onAppear {
                viewModel.loadHomeFeed(userId: userId)
            }
            .navigationTitle("Feed")
        }
    }
}

struct PostRow: View {
    let post: Post

    var body: some View {
        VStack(alignment: .leading) {
            AsyncImage(url: URL(string: post.media_url)) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Color.gray
                    .frame(height: 300)
            }

            Text(post.caption)
                .font(.body)
                .padding()

            HStack {
                Label("\(post.like_count)", systemImage: "heart.fill")
                Label("\(post.comment_count)", systemImage: "bubble.right")
                Label("\(post.share_count)", systemImage: "square.and.arrow.up")
                Spacer()
            }
            .foregroundColor(.gray)
            .padding()
        }
    }
}
```

---

## 🔄 Infinite Scroll / Lazy Loading

### Implementation Checklist

- [ ] Load first batch of 20 posts/10 reels
- [ ] When user scrolls to bottom (5 items remaining), fetch next batch
- [ ] Append new posts to existing list (don't replace)
- [ ] Show loading indicator while fetching
- [ ] Show "End of feed" when `has_more: false`
- [ ] Handle network errors gracefully

### Code Example (Pseudo)

```javascript
// When page loads
loadFeed(type, userId, offset=0) → Display posts

// When user scrolls
onScroll(event) {
  if (remainingItems < 5 && !isLoading) {
    offset += 20
    loadMoreFeed(type, userId, offset) → Append to posts
  }
}
```

---

## ⚡ Performance Optimization

1. **Image Caching**: Cache `thumbnail_url` locally
2. **Video Streaming**: Use `media_url` with streaming player
3. **Request Bundling**: Load 20-30 posts in one request
4. **Preload Next**: Fetch next batch before user scrolls
5. **Connection Reuse**: Keep-alive HTTP connections

---

## 🛑 Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Invalid `type` parameter | Use `post` or `reel` only |
| 401 | Unauthorized | Check API key |
| 429 | Rate limited | Wait 60 seconds, retry |
| 500 | Server error | Retry after 5 seconds |

### Retry Logic

```kotlin
// Exponential backoff
var retryCount = 0
fun loadWithRetry() {
    try {
        loadFeed()
    } catch (e: Exception) {
        if (retryCount < 3) {
            retryCount++
            delay(1000 * 2.pow(retryCount))
            loadWithRetry()
        }
    }
}
```

---

## 📊 Analytics Events to Track

- `feed_loaded` - When feed is fetched
- `post_viewed` - When post is scrolled into view
- `post_liked` - When user likes a post
- `post_commented` - When user comments
- `post_shared` - When user shares
- `user_profile_visited` - When user opens creator profile
- `load_more` - When pagination triggers

---

## 🔒 Security

- Always use HTTPS
- Store user `userId` securely
- Don't expose API keys in frontend code
- Validate response data before display
- Implement certificate pinning for critical operations

