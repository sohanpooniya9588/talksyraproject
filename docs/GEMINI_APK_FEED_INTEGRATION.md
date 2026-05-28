# 📱 TalkSyra Feed Integration - Complete Guide for APK Development

**For Gemini/AI APK Developers** - Everything needed to implement feed in Android/iOS app

---

## 🎯 Quick Overview

TalkSyra Feed System provides two types of content feeds:

| Feed Type | Endpoint | Use Case | Response Size |
|-----------|----------|----------|----------------|
| **Home Posts** | `/api/feed?type=post` | Home timeline with images | 20 posts |
| **Reels/Shorts** | `/api/feed?type=reel` | Vertical videos section | 10 reels |

---

## �️ Cloudflare Worker Architecture

**⚠️ IMPORTANT: APK → Worker → Supabase**

APK अब direct Supabase से connect नहीं करता। सभी requests **Cloudflare Worker के through** जाते हैं जो एक proxy की तरह काम करता है।

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│  APK (Android/iOS)                                      │
│  - No direct Supabase connection                        │
│  - All requests go through Worker                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ With Headers:
                   │ - X-TalkSyra-Secret (Validation)
                   │ - Authorization: Bearer token
                   │
        ┌──────────▼──────────────────────┐
        │  Cloudflare Worker              │
        │  (https://shorts.talksyra.app)  │
        │  - Service Role Key             │
        │  - Database CRUD                │
        │  - Auth Management              │
        │  - Media Upload Handling        │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────▼────────────────────────┐
        │  Supabase                             │
        │  - Database (posts, users, etc)       │
        │  - Storage (media files)              │
        │  - Auth (JWT tokens)                  │
        └───────────────────────────────────────┘
```

### Global Security Headers (Every Request)

**Required Headers for ALL APK requests:**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
Content-Type: application/json
```

**Exception:** Auth endpoints (login/signup) में `Authorization` header optional है

---

## 🌐 API Configuration

### Base URLs
```
Production API: https://shorts.talksyra.app
Media/CDN: https://api.talksyra.app
Database: https://frmazzmzyychdfajnslt.supabase.co
```

### Security Configuration
```
Secret Key: TalkSyra_Secret_Key_2024 (APK Validation)
Supabase Service Role Key: (Worker के लिए - NEVER expose करना)
Supabase Anon Key (Legacy): 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybWF6em16eXljaGRmYWpuc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzEwMDMsImV4cCI6MjA4NzM0NzAwM30.85x1WBkFX9bdpGw1T5-azJ03WsdzJ1r2EiiScxQnQl0
```

---

## 📡 API Endpoints

### 1. Home Feed (Posts)

**Endpoint**
```
GET https://shorts.talksyra.app/api/feed?type=post&userId=USER_ID&limit=20&offset=0
```

**Query Parameters**
| Parameter | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| type | string | No | post | Use `post` for home feed |
| userId | string | No | - | Current user ID (for like status) |
| limit | number | No | 20 | Max 100, recommended 20 |
| offset | number | No | 0 | For pagination |
| personalized | boolean | No | false | Show only following's posts |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "post-uuid",
      "type": "post",
      "caption": "Amazing sunset! 🌅 #travel",
      "media_url": "https://api.talksyra.app/posts/post-uuid.jpg",
      "thumbnail_url": "https://api.talksyra.app/posts/post-uuid-thumb.jpg",
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

---

### 2. Reels Feed (Shorts)

**Endpoint**
```
GET https://shorts.talksyra.app/api/feed?type=reel&userId=USER_ID&limit=10&offset=0
```

**Query Parameters**
| Parameter | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| type | string | No | - | Use `reel` for shorts feed |
| userId | string | No | - | For like status |
| limit | number | No | 10 | Max 100, recommended 10 |
| offset | number | No | 0 | For pagination |
| personalized | boolean | No | false | Following only |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "reel-uuid",
      "type": "reel",
      "caption": "Learn JavaScript in 60 seconds 👨‍💻 #coding",
      "media_url": "https://api.talksyra.app/reels/reel-uuid.mp4",
      "thumbnail_url": "https://api.talksyra.app/reels/reel-uuid-thumb.jpg",
      "audio_url": "https://api.talksyra.app/audio/music-123.mp3",
      "aspect_ratio": "9/16",
      "duration": 60,
      "visibility": "public",
      "like_count": 15000,
      "comment_count": 2100,
      "share_count": 8500,
      "view_count": 450000,
      "created_at": "2026-05-21T08:15:00Z",
      "updated_at": "2026-05-22T14:20:00Z",
      "score": 9.42,
      "is_liked": true,
      "author": {
        "id": "user-uuid-2",
        "username": "code_ninja",
        "full_name": "Code Ninja",
        "profile_pic": "https://api.talksyra.app/avatars/user-uuid-2.jpg",
        "is_verified": true,
        "follower_count": 125000
      }
    }
  ],
  "pagination": {
    "total": 5000,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

---

---

## 🔑 Key Differences: Posts vs Reels

| Aspect | Posts | Reels |
|--------|-------|-------|
| **media_url** | JPG/PNG image | MP4/WebM video |
| **audio_url** | Always null | URL to background music |
| **aspect_ratio** | Varies (4:3, 16:9, 1:1) | Fixed 9:16 (vertical) |
| **duration** | Always null | Video length in seconds |
| **Ranking** | 50% engagement, 7-day decay | 60% engagement, 3-day decay |

---

## 🔐 Complete Worker Endpoints (All 6 Operations)

### 1. 🔑 Authentication (Login / Signup)

APK को direct Supabase से auth नहीं करना है। Worker यह handle करता है।

**Endpoint**
```
POST https://shorts.talksyra.app/api/auth/login
POST https://shorts.talksyra.app/api/auth/signup
POST https://shorts.talksyra.app/api/auth/google
```

**Headers (Optional for Auth)**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Content-Type: application/json
```

**Login Request**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Signup Request**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "username": "john_doe",
  "full_name": "John Doe"
}
```

**Google Auth Request**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "username": "john_doe"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "john_doe",
    "profile_pic": null,
    "created_at": "2026-05-28T10:30:00Z"
  }
}
```

**APK Action:**
```kotlin
// Kotlin - Save token to SharedPreferences
val prefs = context.getSharedPreferences("talksyra_auth", Context.MODE_PRIVATE)
prefs.edit()
  .putString("auth_token", response.data.auth_token)
  .putString("user_id", response.data.user_id)
  .putString("email", response.data.email)
  .apply()
```

```swift
// Swift - Save token to UserDefaults
UserDefaults.standard.set(response.data.auth_token, forKey: "authToken")
UserDefaults.standard.set(response.data.user_id, forKey: "userId")
UserDefaults.standard.set(response.data.email, forKey: "userEmail")
```

---

### 2. 🖼️ Media Upload (Images & Reels)

**Endpoint**
```
POST https://shorts.talksyra.app/api/upload
```

**Headers (Required)**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
Content-Type: multipart/form-data
```

**Payload (Multipart)**
```
- file: <Binary File Data>
- path: "posts" | "profiles" | "reels" | "covers"
- userId: "550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "url": "https://shorts.talksyra.app/storage/v1/object/public/media/posts/550e8400-e29b-41d4.jpg",
    "path": "media/posts/550e8400-e29b-41d4.jpg",
    "size": 2048576,
    "mime_type": "image/jpeg"
  }
}
```

**Android Implementation (Kotlin)**
```kotlin
val file = File(context.cacheDir, "post_image.jpg")
val requestBody = file.asRequestBody("image/jpeg".toMediaType())
val body = MultipartBody.Builder()
    .setType(MultipartBody.FORM)
    .addFormDataPart("file", file.name, requestBody)
    .addFormDataPart("path", "posts")
    .addFormDataPart("userId", userId)
    .build()

val request = Request.Builder()
    .url("https://shorts.talksyra.app/api/upload")
    .header("X-TalkSyra-Secret", "TalkSyra_Secret_Key_2024")
    .header("Authorization", "Bearer $authToken")
    .post(body)
    .build()

val response = httpClient.newCall(request).execute()
val uploadedUrl = response.json().getJSONObject("data").getString("url")
```

**iOS Implementation (Swift)**
```swift
func uploadImage(_ imageData: Data, path: String) {
    let url = URL(string: "https://shorts.talksyra.app/api/upload")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("TalkSyra_Secret_Key_2024", forHTTPHeaderField: "X-TalkSyra-Secret")
    request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
    
    let boundary = "Boundary-\(UUID().uuidString)"
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    
    var body = Data()
    
    // Add file
    body.append("--\(boundary)\r\n")
    body.append("Content-Disposition: form-data; name=\"file\"; filename=\"image.jpg\"\r\n")
    body.append("Content-Type: image/jpeg\r\n\r\n")
    body.append(imageData)
    body.append("\r\n")
    
    // Add path
    body.append("--\(boundary)\r\n")
    body.append("Content-Disposition: form-data; name=\"path\"\r\n\r\n")
    body.append(path)
    body.append("\r\n--\(boundary)--\r\n")
    
    request.httpBody = body
    
    URLSession.shared.dataTask(with: request) { data, _, _ in
        if let data = data,
           let json = try? JSONDecoder().decode(UploadResponse.self, from: data) {
            print("Upload URL: \(json.data.url)")
        }
    }.resume()
}
```

---

### 3. 📝 Post & Reels Creation

**Endpoint**
```
POST https://shorts.talksyra.app/api/posts/create
```

**Headers (Required)**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
Content-Type: application/json
```

**Request Payload**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "caption": "Amazing sunset! 🌅 #travel",
  "media_url": "https://shorts.talksyra.app/storage/v1/object/public/media/posts/550e8400.jpg",
  "type": "post",
  "aspect_ratio": "4/3",
  "visibility": "public",
  "location_name": "Goa, India",
  "audio_url": null
}
```

**For Reels (type=reel):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "caption": "Learn JavaScript in 60 seconds 👨‍💻 #coding",
  "media_url": "https://shorts.talksyra.app/storage/v1/object/public/media/reels/550e8400.mp4",
  "audio_url": "https://shorts.talksyra.app/audio/music-123.mp3",
  "type": "reel",
  "aspect_ratio": "9/16",
  "duration": 60,
  "visibility": "public"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "post-550e8400-e29b-41d4",
    "type": "post",
    "caption": "Amazing sunset! 🌅 #travel",
    "media_url": "https://shorts.talksyra.app/storage/v1/object/public/media/posts/550e8400.jpg",
    "created_at": "2026-05-28T10:30:00Z"
  }
}
```

---

### 4. 👤 Profile & Cover Update

**Endpoint**
```
POST https://shorts.talksyra.app/api/users/update
```

**Headers (Required)**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
Content-Type: application/json
```

**Request Payload**
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

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "new_username",
    "full_name": "John Doe Updated",
    "bio": "Travel lover | Photographer 📸",
    "profile_pic": "https://shorts.talksyra.app/storage/v1/object/public/media/profiles/550e8400.jpg",
    "cover_pic": "https://shorts.talksyra.app/storage/v1/object/public/media/covers/550e8400.jpg"
  }
}
```

---

### 5. ❤️ Social Actions (Like, Comment, Follow)

#### Toggle Like
```
POST https://shorts.talksyra.app/api/likes/toggle
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
POST https://shorts.talksyra.app/api/comments/add
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
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "content": "Amazing! 🔥",
    "created_at": "2026-05-28T10:30:00Z",
    "author": {
      "username": "john_doe",
      "profile_pic": "..."
    }
  }
}
```

#### Toggle Follow
```
POST https://shorts.talksyra.app/api/users/follow
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

---

### 6. 📡 Feed Retrieval (Updated with Headers)

**Endpoint**
```
GET https://shorts.talksyra.app/api/feed?type=post&userId=USER_ID&limit=20&offset=0
```

**Headers (Required)**
```
X-TalkSyra-Secret: TalkSyra_Secret_Key_2024
Authorization: Bearer <auth_token>
Content-Type: application/json
```

---

## 🏗️ Data Models

### Post/Reel Object
```typescript
interface Post {
  id: string;                    // UUID
  type: "post" | "reel";         // Content type
  caption: string;               // User's text content
  media_url: string;             // Image/video URL
  thumbnail_url: string;         // Preview image
  audio_url: string | null;      // Audio (reels only)
  aspect_ratio: string;          // e.g., "9/16", "4/3"
  duration: number | null;       // Video seconds (reels only)
  visibility: "public" | "private";
  location_name?: string;        // Location tag
  like_count: number;            // Total likes
  comment_count: number;         // Total comments
  share_count: number;           // Total shares
  view_count: number;            // Total views
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  score: number;                 // Ranking score (0-10)
  is_liked: boolean;             // Did current user like?
  author: Author;
}

interface Author {
  id: string;
  username: string;
  full_name: string;
  profile_pic: string;
  is_verified: boolean;
  follower_count: number;
}

interface FeedResponse {
  success: boolean;
  data: Post[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}
```

---

## 📱 Android Implementation (Kotlin)

### 1. Setup Dependencies

**build.gradle**
```gradle
dependencies {
    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:okhttp:4.10.0'

    // RecyclerView
    implementation 'androidx.recyclerview:recyclerview:1.3.0'

    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.1'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.1'

    // Image loading
    implementation 'com.github.bumptech.glide:glide:4.15.1'
    implementation 'com.github.bumptech.glide:compiler:4.15.1'

    // Video playback
    implementation 'com.google.android.exoplayer:exoplayer-core:1.1.1'
    implementation 'com.google.android.exoplayer:exoplayer-ui:1.1.1'

    // ViewModel & LiveData
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.1'
}
```

### 2. Data Classes

```kotlin
// models/Post.kt
data class Post(
    val id: String,
    val type: String,          // "post" or "reel"
    val caption: String,
    val media_url: String,
    val thumbnail_url: String,
    val audio_url: String?,
    val aspect_ratio: String,
    val duration: Int?,
    val visibility: String,
    val location_name: String?,
    val like_count: Int,
    val comment_count: Int,
    val share_count: Int,
    val view_count: Int,
    val created_at: String,
    val updated_at: String,
    val score: Double,
    val is_liked: Boolean,
    val author: Author
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
```

### 3. API Client

```kotlin
// api/TalkSyraApi.kt
import retrofit2.http.GET
import retrofit2.http.Query

interface TalkSyraApi {
    
    @GET("/api/feed")
    suspend fun getFeed(
        @Query("type") type: String,
        @Query("userId") userId: String?,
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0,
        @Query("personalized") personalized: Boolean = false
    ): FeedResponse

    @GET("/api/feed")
    suspend fun getHomeFeed(
        @Query("userId") userId: String?,
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0
    ): FeedResponse

    @GET("/api/feed")
    suspend fun getReelsFeed(
        @Query("type") type: String = "reel",
        @Query("userId") userId: String?,
        @Query("limit") limit: Int = 10,
        @Query("offset") offset: Int = 0
    ): FeedResponse
}

// Setup Retrofit
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.google.gson.Gson
import okhttp3.OkHttpClient
import okhttp3.Interceptor
import okhttp3.logging.HttpLoggingInterceptor
import android.content.Context

object RetrofitClient {
    private const val BASE_URL = "https://shorts.talksyra.app"
    private const val SECRET_KEY = "TalkSyra_Secret_Key_2024"
    
    private lateinit var appContext: Context
    
    fun initialize(context: Context) {
        appContext = context.applicationContext
    }
    
    private fun getAuthToken(): String? {
        val prefs = appContext.getSharedPreferences("talksyra_auth", Context.MODE_PRIVATE)
        return prefs.getString("auth_token", null)
    }
    
    // OkHttp Interceptor: Add security headers to every request
    private class HeaderInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): okhttp3.Response {
            val originalRequest = chain.request()
            val authToken = getAuthToken()
            
            // Build new request with headers
            val requestBuilder = originalRequest.newBuilder()
                .header("X-TalkSyra-Secret", SECRET_KEY)
                .header("Content-Type", "application/json")
            
            // Add auth token if available (not for login/signup)
            if (!originalRequest.url.pathSegments.contains("login") && 
                !originalRequest.url.pathSegments.contains("signup")) {
                if (authToken != null) {
                    requestBuilder.header("Authorization", "Bearer $authToken")
                }
            }
            
            return chain.proceed(requestBuilder.build())
        }
    }
    
    // OkHttp Client with interceptor
    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(HeaderInterceptor())
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    val api: TalkSyraApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create(Gson()))
            .build()
            .create(TalkSyraApi::class.java)
    }
}
```

### 4. ViewModel with Pagination

```kotlin
// viewmodel/FeedViewModel.kt
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

class FeedViewModel : ViewModel() {
    
    private val api = RetrofitClient.api
    
    private val _homePosts = MutableLiveData<List<Post>>()
    val homePosts: LiveData<List<Post>> = _homePosts
    
    private val _reels = MutableLiveData<List<Post>>()
    val reels: LiveData<List<Post>> = _reels
    
    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String>()
    val error: LiveData<String> = _error
    
    private var homeOffset = 0
    private var reelsOffset = 0
    private var hasMoreHome = true
    private var hasMoreReels = true

    fun loadHomeFeed(userId: String? = null) {
        if (isLoading.value == true) return
        
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.getHomeFeed(
                    userId = userId,
                    limit = 20,
                    offset = homeOffset
                )
                
                if (response.success) {
                    _homePosts.value = response.data
                    homeOffset += response.data.size
                    hasMoreHome = response.pagination.has_more
                } else {
                    _error.value = "Failed to load home feed"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Unknown error"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadMoreHomeFeed(userId: String? = null) {
        if (!hasMoreHome || isLoading.value == true) return
        
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.getHomeFeed(
                    userId = userId,
                    limit = 20,
                    offset = homeOffset
                )
                
                if (response.success) {
                    val currentPosts = _homePosts.value.orEmpty()
                    _homePosts.value = currentPosts + response.data
                    homeOffset += response.data.size
                    hasMoreHome = response.pagination.has_more
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load more posts"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadReelsFeed(userId: String? = null) {
        if (isLoading.value == true) return
        
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.getReelsFeed(
                    userId = userId,
                    limit = 10,
                    offset = reelsOffset
                )
                
                if (response.success) {
                    _reels.value = response.data
                    reelsOffset += response.data.size
                    hasMoreReels = response.pagination.has_more
                }
            } catch (e: Exception) {
                _error.value = "Failed to load reels"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadMoreReels(userId: String? = null) {
        if (!hasMoreReels || isLoading.value == true) return
        
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.getReelsFeed(
                    userId = userId,
                    limit = 10,
                    offset = reelsOffset
                )
                
                if (response.success) {
                    val currentReels = _reels.value.orEmpty()
                    _reels.value = currentReels + response.data
                    reelsOffset += response.data.size
                    hasMoreReels = response.pagination.has_more
                }
            } catch (e: Exception) {
                _error.value = "Failed to load more reels"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
```

### 5. RecyclerView Adapter

```kotlin
// adapter/FeedAdapter.kt
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide

class FeedAdapter(
    private var posts: List<Post> = emptyList(),
    private val onLoadMore: () -> Unit
) : RecyclerView.Adapter<FeedAdapter.PostViewHolder>() {

    fun updatePosts(newPosts: List<Post>) {
        posts = newPosts
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_post, parent, false)
        return PostViewHolder(view)
    }

    override fun onBindViewHolder(holder: PostViewHolder, position: Int) {
        holder.bind(posts[position])
        
        // Load more when near end
        if (position >= posts.size - 5 && posts.isNotEmpty()) {
            onLoadMore()
        }
    }

    override fun getItemCount() = posts.size

    inner class PostViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val imageView: ImageView = itemView.findViewById(R.id.postImage)
        private val captionView: TextView = itemView.findViewById(R.id.caption)
        private val authorView: TextView = itemView.findViewById(R.id.author)
        private val likesView: TextView = itemView.findViewById(R.id.likes)
        private val commentsView: TextView = itemView.findViewById(R.id.comments)
        private val shareView: TextView = itemView.findViewById(R.id.shares)

        fun bind(post: Post) {
            // Load image with Glide
            Glide.with(itemView.context)
                .load(post.media_url)
                .placeholder(R.drawable.placeholder)
                .thumbnail(Glide.with(itemView).load(post.thumbnail_url))
                .into(imageView)

            captionView.text = post.caption
            authorView.text = "@${post.author.username}"
            likesView.text = "${post.like_count}"
            commentsView.text = "${post.comment_count}"
            shareView.text = "${post.share_count}"

            // Handle likes
            itemView.findViewById<ImageButton>(R.id.likeButton).apply {
                isSelected = post.is_liked
                setOnClickListener {
                    // TODO: Add like functionality
                }
            }
        }
    }
}
```

### 6. Fragment for Home Feed

```kotlin
// fragment/HomeFeedFragment.kt
class HomeFeedFragment : Fragment() {
    
    private val viewModel: FeedViewModel by viewModels()
    private var adapter: FeedAdapter? = null
    private var userId: String? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView(view)
        observeViewModel()
        
        // Get current user ID (from SharedPreferences/local storage)
        userId = SharedPreferences.getUserId(requireContext())
        
        viewModel.loadHomeFeed(userId)
    }

    private fun setupRecyclerView(view: View) {
        val recyclerView: RecyclerView = view.findViewById(R.id.feedRecyclerView)
        recyclerView.layoutManager = LinearLayoutManager(context)
        
        adapter = FeedAdapter(
            posts = emptyList(),
            onLoadMore = {
                viewModel.loadMoreHomeFeed(userId)
            }
        )
        recyclerView.adapter = adapter
    }

    private fun observeViewModel() {
        viewModel.homePosts.observe(viewLifecycleOwner) { posts ->
            adapter?.updatePosts(posts)
        }
        
        viewModel.error.observe(viewLifecycleOwner) { error ->
            Toast.makeText(context, error, Toast.LENGTH_SHORT).show()
        }
    }

    companion object {
        fun newInstance() = HomeFeedFragment()
    }
}
```

---

## 🍎 iOS Implementation (Swift)

### 1. Data Models

```swift
// Models/Post.swift
struct Post: Codable {
    let id: String
    let type: String                // "post" or "reel"
    let caption: String
    let media_url: String
    let thumbnail_url: String
    let audio_url: String?
    let aspect_ratio: String
    let duration: Int?
    let visibility: String
    let location_name: String?
    let like_count: Int
    let comment_count: Int
    let share_count: Int
    let view_count: Int
    let created_at: String
    let updated_at: String
    let score: Double
    let is_liked: Bool
    let author: Author
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
```

### 2. API Service

```swift
// Services/APIClient.swift
import Alamofire
import Foundation

class APIClient {
    static let shared = APIClient()
    
    private let baseURL = "https://shorts.talksyra.app"
    
    func getHomeFeed(
        userId: String?,
        limit: Int = 20,
        offset: Int = 0,
        completion: @escaping (Result<FeedResponse, Error>) -> Void
    ) {
        let url = "\(baseURL)/api/feed"
        var parameters: [String: Any] = [
            "type": "post",
            "limit": limit,
            "offset": offset
        ]
        
        if let userId = userId {
            parameters["userId"] = userId
        }
        
        AF.request(url, parameters: parameters)
            .validate()
            .responseDecodable(of: FeedResponse.self) { response in
                completion(response.result)
            }
    }
    
    func getReelsFeed(
        userId: String?,
        limit: Int = 10,
        offset: Int = 0,
        completion: @escaping (Result<FeedResponse, Error>) -> Void
    ) {
        let url = "\(baseURL)/api/feed"
        var parameters: [String: Any] = [
            "type": "reel",
            "limit": limit,
            "offset": offset
        ]
        
        if let userId = userId {
            parameters["userId"] = userId
        }
        
        AF.request(url, parameters: parameters)
            .validate()
            .responseDecodable(of: FeedResponse.self) { response in
                completion(response.result)
            }
    }
}
```

### 3. ViewModel

```swift
// ViewModels/FeedViewModel.swift
import Combine

class FeedViewModel: ObservableObject {
    @Published var homePosts: [Post] = []
    @Published var reels: [Post] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var homeOffset = 0
    private var reelsOffset = 0
    private var hasMoreHome = true
    private var hasMoreReels = true
    
    func loadHomeFeed(userId: String? = nil) {
        isLoading = true
        
        APIClient.shared.getHomeFeed(
            userId: userId,
            limit: 20,
            offset: homeOffset
        ) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                switch result {
                case .success(let response):
                    self?.homePosts = response.data
                    self?.homeOffset += response.data.count
                    self?.hasMoreHome = response.pagination.has_more
                    
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func loadMoreHomeFeed(userId: String? = nil) {
        guard !isLoading && hasMoreHome else { return }
        
        isLoading = true
        
        APIClient.shared.getHomeFeed(
            userId: userId,
            limit: 20,
            offset: homeOffset
        ) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                switch result {
                case .success(let response):
                    self?.homePosts.append(contentsOf: response.data)
                    self?.homeOffset += response.data.count
                    self?.hasMoreHome = response.pagination.has_more
                    
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func loadReelsFeed(userId: String? = nil) {
        isLoading = true
        
        APIClient.shared.getReelsFeed(
            userId: userId,
            limit: 10,
            offset: reelsOffset
        ) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                switch result {
                case .success(let response):
                    self?.reels = response.data
                    self?.reelsOffset += response.data.count
                    self?.hasMoreReels = response.pagination.has_more
                    
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
}
```

### 4. SwiftUI View

```swift
// Views/HomeFeedView.swift
struct HomeFeedView: View {
    @ObservedObject var viewModel = FeedViewModel()
    @State private var userId: String? = UserDefaults.standard.string(forKey: "userId")
    
    var body: some View {
        NavigationView {
            List(viewModel.homePosts) { post in
                PostRowView(post: post)
                    .onAppear {
                        // Load more when reaching end
                        if post.id == viewModel.homePosts.last?.id {
                            viewModel.loadMoreHomeFeed(userId: userId)
                        }
                    }
            }
            .navigationTitle("Home")
            .onAppear {
                viewModel.loadHomeFeed(userId: userId)
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") {
                    viewModel.errorMessage = nil
                }
            } message: {
                Text(viewModel.errorMessage ?? "Unknown error")
            }
        }
    }
}

struct PostRowView: View {
    let post: Post
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Author info
            HStack {
                AsyncImage(url: URL(string: post.author.profile_pic)) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    Color.gray
                }
                .frame(width: 40, height: 40)
                .cornerRadius(20)
                
                VStack(alignment: .leading) {
                    Text(post.author.full_name)
                        .font(.headline)
                    Text("@\(post.author.username)")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                if post.author.is_verified {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundColor(.blue)
                }
            }
            
            // Post image
            AsyncImage(url: URL(string: post.media_url)) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                ProgressView()
            }
            .frame(height: 300)
            
            // Caption
            Text(post.caption)
                .font(.body)
            
            // Engagement metrics
            HStack(spacing: 16) {
                Label("\(post.like_count)", systemImage: "heart.fill")
                Label("\(post.comment_count)", systemImage: "bubble.right")
                Label("\(post.share_count)", systemImage: "square.and.arrow.up")
                Spacer()
                Text(formatDate(post.created_at))
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .foregroundColor(.blue)
        }
        .padding()
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateString) else { return dateString }
        
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .short
            return dateFormatter.string(from: date)
        }
    }
}
```

---

## 🔄 Pagination Implementation

### Infinite Scroll Pattern

```
1. Load initial 20 posts/10 reels
2. User scrolls to position 15 (for 20 posts)
3. Trigger loadMore()
4. Append new posts to existing list
5. Increment offset by 20
6. Repeat until has_more = false
```

### Pseudo Code
```javascript
// On each feed view
offset = 0;
hasMore = true;

function loadFeed() {
  if (isLoading) return;
  isLoading = true;
  
  fetch(`/api/feed?type=post&userId=${userId}&limit=20&offset=${offset}`)
    .then(response => response.json())
    .then(data => {
      appendPosts(data.data);
      offset += data.data.length;
      hasMore = data.pagination.has_more;
      isLoading = false;
    });
}

function onScroll(position) {
  // When 5 posts from end, load more
  if (position > totalPosts - 5 && hasMore && !isLoading) {
    loadFeed();
  }
}
```

---

## 🛑 Error Handling

### Common Errors

| HTTP Status | Error | Solution |
|------------|-------|----------|
| 400 | Invalid type parameter | Use `post` or `reel` only |
| 401 | Unauthorized/Missing key | Check Supabase key |
| 429 | Rate limited | Wait 60 seconds |
| 500 | Server error | Retry after 5 seconds |
| Network | Connection timeout | Check internet, retry |

### Error Response Format
```json
{
  "success": false,
  "error": "Invalid type parameter. Use 'post' or 'reel'",
  "code": "INVALID_TYPE"
}
```

### Retry Logic (Exponential Backoff)

```kotlin
// Android
fun loadWithRetry(attempt: Int = 0) {
    if (attempt >= 3) {
        _error.value = "Failed after 3 attempts"
        return
    }
    
    try {
        // Load feed
    } catch (e: Exception) {
        val delay = 1000L * (2.0.pow(attempt)).toLong()
        Handler(Looper.getMainLooper()).postDelayed({
            loadWithRetry(attempt + 1)
        }, delay)
    }
}
```

```swift
// iOS
func loadWithRetry(attempt: Int = 0) {
    guard attempt < 3 else {
        self.errorMessage = "Failed after 3 attempts"
        return
    }
    
    APIClient.shared.getHomeFeed(userId: userId) { result in
        switch result {
        case .success(let response):
            self.homePosts = response.data
            
        case .failure:
            let delay = Int(1000.0 * pow(2.0, Double(attempt)))
            DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(delay)) {
                self.loadWithRetry(attempt: attempt + 1)
            }
        }
    }
}
```

---

## 📊 Analytics Events to Track

Track these events in Firebase Analytics or your analytics service:

```
- feed_loaded
  Parameters: type (post/reel), userId

- post_viewed
  Parameters: post_id, author_id, type

- post_liked
  Parameters: post_id, author_id

- post_commented
  Parameters: post_id, comment_count

- post_shared
  Parameters: post_id, share_count

- profile_visited
  Parameters: author_id

- load_more_triggered
  Parameters: feed_type, current_count
```

---

## 🔒 Security Best Practices

1. **Always use HTTPS** - Never transmit data over HTTP
2. **Validate responses** - Check data types before display
3. **Handle sensitive data** - Don't log API keys or user tokens
4. **Certificate pinning** - Pin SSL certificates for critical operations
5. **Rate limiting** - Implement client-side rate limiting
6. **Error messages** - Don't expose server stack traces to users

---

## 🚀 Testing Checklist

- [ ] Home feed loads 20 posts
- [ ] Reels feed loads 10 reels
- [ ] Pagination works (offset increments)
- [ ] Like status shows correctly
- [ ] Author profile pic loads
- [ ] Media URL loads images/videos
- [ ] Score displays ranking (0-10)
- [ ] Infinite scroll triggers at bottom
- [ ] Error handling works
- [ ] Retry logic works
- [ ] Empty feed shows properly
- [ ] Loading indicator shows

---

## 📞 Quick Reference

| Need | Resource |
|------|----------|
| API Docs | `/api/feed` endpoint specs above |
| Database | Supabase: `frmazzmzyychdfajnslt.supabase.co` |
| Media CDN | `https://api.talksyra.app` |
| Anon Key | Use provided Supabase key |
| Ranking | 50% engagement (posts), 60% (reels) |
| Response | JSON with Post array + pagination |

---

## 🎯 Implementation Order

1. **Day 1**: Setup API client, data models, basic list view
2. **Day 2**: Implement pagination, loading states
3. **Day 3**: Add error handling, retry logic
4. **Day 4**: Style UI, add engagement buttons
5. **Day 5**: Testing, optimization, analytics

