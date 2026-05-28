// TalkSyra High-Performance Smart Feed Worker (Instagram-like ranking)
import { getHomeFeed } from './feeds/postFeed.js';
import { getReelsFeed } from './feeds/reelsFeed.js';

const SECRET_KEY = 'TalkSyra_Secret_Key_2024';
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-TalkSyra-Secret',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Supabase Config
    const SB_URL = env.SUPABASE_URL || "https://frmazzmzyychdfajnslt.supabase.co";
    const SB_KEY = env.SUPABASE_ANON_KEY;
    const SB_SERVICE_KEY = env.SUPABASE_SERVICE_KEY; // For admin operations
    
    const headers = {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json'
    };

    // Service role headers (for admin operations)
    const serviceHeaders = {
      'apikey': SB_SERVICE_KEY || SB_KEY,
      'Authorization': `Bearer ${SB_SERVICE_KEY || SB_KEY}`,
      'Content-Type': 'application/json'
    };

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      // ===== APK SECURITY VALIDATION =====
      // Validate X-TalkSyra-Secret header for all non-auth requests
      const appSecret = request.headers.get('X-TalkSyra-Secret');
      const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
      
      const isAuthEndpoint = path.startsWith('/api/auth/');
      
      if (!isAuthEndpoint && appSecret !== SECRET_KEY) {
        return jsonResponse({ success: false, error: 'Invalid X-TalkSyra-Secret header', code: 'INVALID_SECRET' }, 401);
      }
      if (!isAuthEndpoint && appSecret !== SECRET_KEY) {
        return jsonResponse({ success: false, error: 'Invalid X-TalkSyra-Secret header', code: 'INVALID_SECRET' }, 401);
      }

      // ===== APK OPERATIONS (6 Core Endpoints) =====

      // 1. AUTHENTICATION (/api/auth/login, /api/auth/signup, /api/auth/google)
      if (path === '/api/auth/login' && method === 'POST') {
        const body = await request.json();
        const { email, password } = body;
        
        if (!email || !password) {
          return jsonResponse({ success: false, error: 'Missing email or password', code: 'INVALID_INPUT' }, 400);
        }

        try {
          // Call Supabase Auth API
          const authRes = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          const authData = await authRes.json();
          
          if (!authRes.ok) {
            return jsonResponse({ success: false, error: 'Invalid credentials', code: 'AUTH_FAILED' }, 401);
          }

          // Fetch user data
          const userRes = await fetch(`${SB_URL}/rest/v1/users?email=eq.${email}`, { headers });
          const users = await userRes.json();
          const user = users[0];

          return jsonResponse({
            success: true,
            data: {
              auth_token: authData.access_token,
              user_id: authData.user.id,
              email: user.email,
              username: user.username,
              profile_pic: user.profile_pic
            }
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message, code: 'SERVER_ERROR' }, 500);
        }
      }

      if (path === '/api/auth/signup' && method === 'POST') {
        const body = await request.json();
        const { email, password, username, full_name } = body;
        
        if (!email || !password || !username) {
          return jsonResponse({ success: false, error: 'Missing required fields', code: 'INVALID_INPUT' }, 400);
        }

        try {
          // Create Supabase auth user
          const signupRes = await fetch(`${SB_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          const signupData = await signupRes.json();
          
          if (!signupRes.ok) {
            return jsonResponse({ success: false, error: signupData.message || 'Signup failed', code: 'SIGNUP_FAILED' }, 400);
          }

          // Insert user into users table
          const userId = signupData.user.id;
          await fetch(`${SB_URL}/rest/v1/users`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({
              id: userId,
              email,
              username,
              full_name: full_name || username,
              created_at: new Date().toISOString()
            })
          });

          return jsonResponse({
            success: true,
            data: {
              auth_token: signupData.session.access_token,
              user_id: userId,
              email,
              username
            }
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message, code: 'SERVER_ERROR' }, 500);
        }
      }

      // 2. MEDIA UPLOAD (/api/upload)
      if (path === '/api/upload' && method === 'POST') {
        if (!authToken) {
          return jsonResponse({ success: false, error: 'Missing Authorization header', code: 'MISSING_AUTH' }, 401);
        }

        try {
          const formData = await request.formData();
          const file = formData.get('file');
          const uploadPath = formData.get('path') || 'posts';
          const userId = formData.get('userId');

          if (!file || !userId) {
            return jsonResponse({ success: false, error: 'Missing file or userId', code: 'INVALID_INPUT' }, 400);
          }

          // Generate unique filename
          const timestamp = Date.now();
          const fileName = `${userId}-${timestamp}-${file.name}`;
          const filePath = `media/${uploadPath}/${fileName}`;

          // Upload to Supabase Storage
          const uploadRes = await fetch(
            `${SB_URL}/storage/v1/object/public/${filePath}`,
            {
              method: 'POST',
              headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${authToken}` },
              body: await file.arrayBuffer()
            }
          );

          if (!uploadRes.ok) {
            return jsonResponse({ success: false, error: 'Upload failed', code: 'UPLOAD_FAILED' }, 400);
          }

          const url = `${SB_URL}/storage/v1/object/public/${filePath}`;

          return jsonResponse({
            success: true,
            data: {
              url,
              path: filePath,
              size: file.size,
              mime_type: file.type
            }
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message, code: 'SERVER_ERROR' }, 500);
        }
      }

      // 3. CREATE POST / REEL (/api/posts/create)
      if (path === '/api/posts/create' && method === 'POST') {
        if (!authToken) {
          return jsonResponse({ success: false, error: 'Missing Authorization header', code: 'MISSING_AUTH' }, 401);
        }

        const body = await request.json();
        const { userId, caption, media_url, type, aspect_ratio, visibility, location_name, audio_url, duration } = body;

        if (!userId || !media_url || !type) {
          return jsonResponse({ success: false, error: 'Missing required fields', code: 'INVALID_INPUT' }, 400);
        }

        try {
          const postId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const postData = {
            id: postId,
            user_id: userId,
            type,
            caption: caption || '',
            media_url,
            aspect_ratio: aspect_ratio || (type === 'reel' ? '9/16' : '4/3'),
            visibility: visibility || 'public',
            location_name: location_name || null,
            audio_url: audio_url || null,
            duration: duration || null,
            score: 0,
            like_count: 0,
            comment_count: 0,
            share_count: 0,
            view_count: 0,
            created_at: new Date().toISOString()
          };

          const createRes = await fetch(`${SB_URL}/rest/v1/posts`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify(postData)
          });

          if (!createRes.ok) {
            return jsonResponse({ success: false, error: 'Failed to create post', code: 'CREATE_FAILED' }, 400);
          }

          return jsonResponse({
            success: true,
            data: {
              id: postId,
              type,
              caption,
              media_url,
              created_at: postData.created_at
            }
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message, code: 'SERVER_ERROR' }, 500);
        }
      }

      // 4. UPDATE PROFILE (/api/users/update)
      if (path === '/api/users/update' && method === 'POST') {
        if (!authToken) {
          return jsonResponse({ success: false, error: 'Missing Authorization header', code: 'MISSING_AUTH' }, 401);
        }

        const body = await request.json();
        const { userId, data } = body;

        if (!userId || !data) {
          return jsonResponse({ success: false, error: 'Missing userId or data', code: 'INVALID_INPUT' }, 400);
        }

        try {
          const updateRes = await fetch(
            `${SB_URL}/rest/v1/users?id=eq.${userId}`,
            {
              method: 'PATCH',
              headers: { ...serviceHeaders, 'Prefer': 'return=representation' },
              body: JSON.stringify({
                ...data,
                updated_at: new Date().toISOString()
              })
            }
          );

          const updated = await updateRes.json();

          if (!updateRes.ok || !updated[0]) {
            return jsonResponse({ success: false, error: 'Failed to update profile', code: 'UPDATE_FAILED' }, 400);
          }

          return jsonResponse({
            success: true,
            data: updated[0]
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message, code: 'SERVER_ERROR' }, 500);
        }
      }

      // 5. SOCIAL ACTIONS (/api/likes/toggle, /api/comments/add, /api/users/follow)
      if (path === '/api/likes/toggle' && method === 'POST') {
        if (!authToken) {
          return jsonResponse({ success: false, error: 'Missing Authorization header', code: 'MISSING_AUTH' }, 401);
        }

        const body = await request.json();
        const { postId, userId, isCurrentlyLiked } = body;

        if (!postId || !userId) {
          return jsonResponse({ success: false, error: 'Missing postId or userId', code: 'INVALID_INPUT' }, 400);
        }

        try {
          if (isCurrentlyLiked) {
            // Delete like
            await fetch(
              `${SB_URL}/rest/v1/likes?post_id=eq.${postId}&user_id=eq.${userId}`,
              { method: 'DELETE', headers: { ...serviceHeaders, 'Prefer': 'return=minimal' } }
            );
          } else {
            // Insert like
            const likeId = `like-${postId}-${userId}`;
            await fetch(`${SB_URL}/rest/v1/likes`, {
              method: 'POST',
              headers: { ...serviceHeaders, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ id: likeId, post_id: postId, user_id: userId })
            });
          }

          // Get updated like count
          const countRes = await fetch(`${SB_URL}/rest/v1/likes?post_id=eq.${postId}&select=count()`, {
            headers: { ...serviceHeaders, 'Prefer': 'count=exact' }
          });

          const likeCount = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0');

          return jsonResponse({
            success: true,
            data: {
              liked: !isCurrentlyLiked,
              like_count: likeCount
            }
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message, code: 'SERVER_ERROR' }, 500);
        }
      }

      if (path === '/api/comments/add' && method === 'POST') {
        if (!authToken) {
          return jsonResponse({ success: false, error: 'Missing Authorization header', code: 'MISSING_AUTH' }, 401);
        }

        const body = await request.json();
        const { postId, userId, content, parentCommentId } = body;

        if (!postId || !userId || !content) {
          return jsonResponse({ success: false, error: 'Missing required fields', code: 'INVALID_INPUT' }, 400);
        }

        try {
          const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const commentRes = await fetch(`${SB_URL}/rest/v1/comments`, {
            method: 'POST',
            headers: { ...serviceHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify({
              id: commentId,
              post_id: postId,
              user_id: userId,
              content,
              parent_comment_id: parentCommentId || null,
              created_at: new Date().toISOString()
            })
          });

          const comment = (await commentRes.json())[0];

          // Get author info
          const userRes = await fetch(`${SB_URL}/rest/v1/users?id=eq.${userId}`, { headers });
          const author = (await userRes.json())[0];

          return jsonResponse({
            success: true,
            data: {
              id: commentId,
              postId,
              content,
              created_at: comment.created_at,
              author: {
                username: author.username,
                profile_pic: author.profile_pic
              }
            }
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message, code: 'SERVER_ERROR' }, 500);
        }
      }

      if (path === '/api/users/follow' && method === 'POST') {
        if (!authToken) {
          return jsonResponse({ success: false, error: 'Missing Authorization header', code: 'MISSING_AUTH' }, 401);
        }

        const body = await request.json();
        const { followerId, followingId, isFollowing } = body;

        if (!followerId || !followingId) {
          return jsonResponse({ success: false, error: 'Missing followerId or followingId', code: 'INVALID_INPUT' }, 400);
        }

        if (followerId === followingId) {
          return jsonResponse({ success: false, error: 'Cannot follow yourself', code: 'INVALID_ACTION' }, 400);
        }

        try {
          if (isFollowing) {
            // Delete follow
            await fetch(
              `${SB_URL}/rest/v1/followers?follower_id=eq.${followerId}&following_id=eq.${followingId}`,
              { method: 'DELETE', headers: { ...serviceHeaders, 'Prefer': 'return=minimal' } }
            );
          } else {
            // Insert follow
            const followId = `follow-${followerId}-${followingId}`;
            await fetch(`${SB_URL}/rest/v1/followers`, {
              method: 'POST',
              headers: { ...serviceHeaders, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ id: followId, follower_id: followerId, following_id: followingId })
            });
          }

          // Get updated follower count
          const countRes = await fetch(`${SB_URL}/rest/v1/followers?following_id=eq.${followingId}&select=count()`, {
            headers: { ...serviceHeaders, 'Prefer': 'count=exact' }
          });

          const followerCount = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0');

          return jsonResponse({
            success: true,
            data: {
              following: !isFollowing,
              follower_count: followerCount
            }
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message, code: 'SERVER_ERROR' }, 500);
        }
      }

      // 6. FEED RETRIEVAL (/api/feed) - Updated with header validation
      if (path === '/api/feed') {
        const type = url.searchParams.get('type') || 'post';
        const userId = url.searchParams.get('userId');
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = parseInt(url.searchParams.get('offset')) || 0;
        const personalized = url.searchParams.get('personalized') === 'true';

        let result;
        if (type === 'reel') {
          result = await getReelsFeed(SB_URL, SB_KEY, userId, limit, offset, personalized);
        } else {
          result = await getHomeFeed(SB_URL, SB_KEY, userId, limit, offset, personalized);
        }

        return result.success 
          ? jsonResponse(result) 
          : errorResponse(result.error, 400);
      }

      // Legacy support: /api/posts/reels -> /api/feed?type=reel
      if (path === '/api/posts/reels' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '20') || 20;
        const offset = parseInt(url.searchParams.get('offset') || '0') || 0;
        const userId = url.searchParams.get('userId');
        const result = await getReelsFeed(SB_URL, SB_KEY, userId, limit, offset, false);
        return result.success 
          ? jsonResponse(result) 
          : errorResponse(result.error, 400);
      }

      // 2. RISING STARS (/api/stars) — Top Creators
      if (path === '/api/stars') {
        const query = `${SB_URL}/rest/v1/users?select=id,username,full_name,profile_pic,follower_count,post_count,is_verified&order=follower_count.desc&limit=10`;
        const res = await fetch(query, { headers });
        const stars = await res.json();
        
        // Add creator score (Follower count + verification boost)
        const scoredStars = stars.map(u => ({
          ...u,
          creator_score: u.follower_count * (u.is_verified ? 1.5 : 1.0) + u.post_count * 0.1
        })).sort((a, b) => b.creator_score - a.creator_score);
        
        return jsonResponse(scoredStars);
      }

      // 3. TRENDING CONTENT (/api/trending) — Viral Posts
      if (path === '/api/trending') {
        const type = url.searchParams.get('type') || 'post';
        const limit = parseInt(url.searchParams.get('limit')) || 15;
        const offset = parseInt(url.searchParams.get('offset')) || 0;
        
        // Route to appropriate trending feed
        let result;
        if (type === 'reel') {
          result = await getReelsFeed(SB_URL, SB_KEY, null, limit, offset, false);
        } else {
          result = await getHomeFeed(SB_URL, SB_KEY, null, limit, offset, false);
        }
        
        return result.success 
          ? jsonResponse(result.data) 
          : errorResponse(result.error, 400);
      }

      // 4. SEARCH BY HASHTAG (/api/hashtags/[tag])
      if (path.startsWith('/api/hashtags/')) {
        const tag = path.split('/')[3];
        if (!tag) return jsonResponse([]);
        
        // Search posts containing hashtag in caption
        const query = `${SB_URL}/rest/v1/posts?select=id,type,caption,media_url,thumbnail_url,like_count,comment_count,view_count,created_at,user_id,author:users!posts_user_id_fkey(username,full_name,profile_pic,is_verified)&caption=ilike.%23${tag}%&order=like_count.desc&limit=20`;
        const res = await fetch(query, { headers });
        const posts = await res.json();
        if (!Array.isArray(posts)) return errorResponse(res.statusText || posts.message || JSON.stringify(posts), 500);
        return jsonResponse(posts);
      }

      // 5. USER PROFILE FEED (/api/user/[userId]/posts)
      if (path.startsWith('/api/user/') && path.includes('/posts')) {
        const userId = path.split('/')[3];
        if (!userId) return jsonResponse([]);
        
        const query = `${SB_URL}/rest/v1/posts?select=id,type,caption,media_url,thumbnail_url,like_count,comment_count,view_count,created_at,user_id&user_id=eq.${userId}&order=created_at.desc&limit=20`;
        const res = await fetch(query, { headers });
        return jsonResponse(await res.json());
      }

      // ===== PHASE 2: FOLLOWER SYSTEM =====

      // 6. FOLLOW USER (/api/users/:targetUserId/follow)
      if (path.startsWith('/api/users/') && path.includes('/follow') && !path.includes('/following')) {
        if (request.method === 'POST') {
          const targetUserId = path.split('/')[3];
          const body = await request.json();
          const followerId = body.follower_id;
          
          if (!targetUserId || !followerId) return errorResponse('Missing userId or followerId', 400);
          if (targetUserId === followerId) return errorResponse('Cannot follow yourself', 400);
          
          try {
            // Insert follow relationship
            const followQuery = `${SB_URL}/rest/v1/followers`;
            await fetch(followQuery, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ 
                follower_id: followerId, 
                following_id: targetUserId 
              })
            });
            
            // Update follower count
            await fetch(`${SB_URL}/rest/v1/users?id=eq.${targetUserId}`, {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ follower_count: new Date() }) // Trigger RPC or use raw SQL
            });
            
            return jsonResponse({ status: 'followed', message: 'Successfully followed user' });
          } catch (err) {
            return errorResponse(err.message, 400);
          }
        }
      }

      // 7. UNFOLLOW USER (/api/users/:targetUserId/unfollow)
      if (path.startsWith('/api/users/') && path.includes('/unfollow')) {
        if (request.method === 'DELETE') {
          const targetUserId = path.split('/')[3];
          const followerId = url.searchParams.get('follower_id');
          
          if (!targetUserId || !followerId) return errorResponse('Missing userId or followerId', 400);
          
          try {
            // Delete follow relationship
            const deleteQuery = `${SB_URL}/rest/v1/followers?follower_id=eq.${followerId}&following_id=eq.${targetUserId}`;
            await fetch(deleteQuery, {
              method: 'DELETE',
              headers: { ...headers, 'Prefer': 'return=minimal' }
            });
            
            return jsonResponse({ status: 'unfollowed', message: 'Successfully unfollowed user' });
          } catch (err) {
            return errorResponse(err.message, 400);
          }
        }
      }

      // 8. GET FOLLOWING LIST (/api/users/:userId/following)
      if (path.startsWith('/api/users/') && path.endsWith('/following')) {
        const userId = path.split('/')[3];
        if (!userId) return jsonResponse([]);
        
        const query = `${SB_URL}/rest/v1/followers?select=following_id&follower_id=eq.${userId}&limit=100`;
        const res = await fetch(query, { headers });
        const followingIds = await res.json();
        
        if (followingIds.length === 0) return jsonResponse([]);
        
        const ids = followingIds.map(f => f.following_id).join(',');
        const usersQuery = `${SB_URL}/rest/v1/users?id=in.(${ids})&select=id,username,full_name,profile_pic,is_verified,follower_count`;
        const usersRes = await fetch(usersQuery, { headers });
        return jsonResponse(await usersRes.json());
      }

      // 9. GET FOLLOWERS LIST (/api/users/:userId/followers)
      if (path.startsWith('/api/users/') && path.endsWith('/followers')) {
        const userId = path.split('/')[3];
        if (!userId) return jsonResponse([]);
        
        const query = `${SB_URL}/rest/v1/followers?select=follower_id&following_id=eq.${userId}&limit=100`;
        const res = await fetch(query, { headers });
        const followerIds = await res.json();
        
        if (followerIds.length === 0) return jsonResponse([]);
        
        const ids = followerIds.map(f => f.follower_id).join(',');
        const usersQuery = `${SB_URL}/rest/v1/users?id=in.(${ids})&select=id,username,full_name,profile_pic,is_verified,follower_count`;
        const usersRes = await fetch(usersQuery, { headers });
        return jsonResponse(await usersRes.json());
      }

      // 10. CHECK IF FOLLOWING (/api/users/:targetUserId/isFollowing?userId=X)
      if (path.startsWith('/api/users/') && path.endsWith('/isFollowing')) {
        const targetUserId = path.split('/')[3];
        const userId = url.searchParams.get('userId');
        
        if (!targetUserId || !userId) return errorResponse('Missing userId or targetUserId', 400);
        
        const query = `${SB_URL}/rest/v1/followers?follower_id=eq.${userId}&following_id=eq.${targetUserId}&limit=1`;
        const res = await fetch(query, { headers });
        const result = await res.json();
        return jsonResponse({ isFollowing: result.length > 0 });
      }

      // ===== PHASE 2: HASHTAG TRENDING =====

      // 11. GET TRENDING HASHTAGS (/api/trending/hashtags)
      if (path === '/api/trending/hashtags') {
        const limit = url.searchParams.get('limit') || 10;
        const query = `${SB_URL}/rest/v1/hashtags?order=usage_count.desc&limit=${limit}`;
        const res = await fetch(query, { headers });
        const tags = await res.json();
        if (!Array.isArray(tags)) return errorResponse(res.statusText || tags.message || JSON.stringify(tags), 500);

        // Add trend indicator
        const enriched = tags.map(tag => ({
          ...tag,
          trend: 'up', // In production, compare with previous day
          trend_pct: Math.floor(Math.random() * 20) // Mock percentage
        }));
        return jsonResponse(enriched);
      }

      // 12. GET POSTS BY HASHTAG (/api/hashtags/:tag/posts)
      if (path.startsWith('/api/hashtags/') && path.endsWith('/posts')) {
        const tag = path.split('/')[3];
        const limit = url.searchParams.get('limit') || 20;
        if (!tag) return jsonResponse([]);
        
        const query = `${SB_URL}/rest/v1/posts?select=id,type,caption,media_url,thumbnail_url,audio_url,like_count,comment_count,view_count,created_at,user_id,author:users!posts_user_id_fkey(username,full_name,profile_pic,is_verified)&caption=ilike.%23${tag}%&order=like_count.desc&limit=${limit}`;
        const res = await fetch(query, { headers });
        const posts = await res.json();
        if (!Array.isArray(posts)) return errorResponse(res.statusText || posts.message || JSON.stringify(posts), 500);
        return jsonResponse(posts);
      }

      // ===== PHASE 2: CREATOR ANALYTICS =====

      // 13. GET CREATOR ANALYTICS (/api/creator/:userId/analytics)
      if (path.startsWith('/api/creator/') && path.endsWith('/analytics')) {
        const creatorId = path.split('/')[3];
        if (!creatorId) return errorResponse('Missing userId', 400);
        
        try {
          // Fetch creator info
          const userQuery = `${SB_URL}/rest/v1/users?id=eq.${creatorId}`;
          const userRes = await fetch(userQuery, { headers });
          const userArr = await userRes.json();
          if (!userArr || userArr.length === 0) return errorResponse('User not found', 404);
          const user = userArr[0];
          
          // Fetch all creator's posts
          const postsQuery = `${SB_URL}/rest/v1/posts?user_id=eq.${creatorId}&order=created_at.desc&limit=100`;
          const postsRes = await fetch(postsQuery, { headers });
          const posts = await postsRes.json();
          if (!Array.isArray(posts)) return errorResponse(postsRes.statusText || posts.message || JSON.stringify(posts), 500);
          
          // Calculate analytics
          const analytics = calculateCreatorAnalytics(user, posts);
          return jsonResponse(analytics);
        } catch (err) {
          return errorResponse(err.message, 500);
        }
      }

      // ===== PHASE 2: PERSONALIZED FEED =====

      // 14. PERSONALIZED FEED (/api/feed with personalized=true)
      // (Modified in the main /api/feed endpoint above)

      return new Response("TalkSyra Worker API is running", { status: 200 });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message, code: 'SERVER_ERROR' }), { status: 500, headers: CORS_HEADERS });
    }
  }
};

// Response helpers
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: CORS_HEADERS
  });
}

// Error response helper
function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status: status,
    headers: CORS_HEADERS
  });
}

// Calculate creator analytics dashboard
function calculateCreatorAnalytics(user, posts) {
  const now = Date.now();
  
  // Sum engagement metrics
  const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.share_count || 0), 0);
  const totalReach = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
  
  // Calculate engagement rate
  const avgEngagementRate = totalReach > 0 
    ? ((totalLikes + totalComments + totalShares) / totalReach) * 100 
    : 0;
  
  // Top posts by engagement
  const topPosts = posts
    .map(p => ({
      id: p.id,
      caption: p.caption,
      like_count: p.like_count,
      comment_count: p.comment_count,
      share_count: p.share_count,
      view_count: p.view_count,
      type: p.type,
      engagement_rate: p.view_count > 0 
        ? (((p.like_count + p.comment_count + p.share_count) / p.view_count) * 100).toFixed(1)
        : 0,
      posted_at: p.created_at
    }))
    .sort((a, b) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count))
    .slice(0, 5);
  
  // Daily stats (last 7 days)
  const dailyStats = calculateDailyStats(posts, 7);
  
  // Content type performance
  const contentPerformance = posts.reduce((acc, p) => {
    const type = p.type || 'post';
    if (!acc[type]) {
      acc[type] = { total_posts: 0, total_engagement: 0, total_reach: 0 };
    }
    acc[type].total_posts += 1;
    acc[type].total_engagement += p.like_count + p.comment_count + p.share_count;
    acc[type].total_reach += p.view_count;
    return acc;
  }, {});
  
  // Convert to array with averages
  const contentTypePerformance = Object.entries(contentPerformance).map(([type, stats]) => ({
    type,
    total_posts: stats.total_posts,
    avg_engagement: (stats.total_engagement / stats.total_posts).toFixed(1),
    avg_reach: Math.floor(stats.total_reach / stats.total_posts)
  }));
  
  // Determine creator tier
  const tier = determineCreatorTier(user.follower_count, avgEngagementRate, posts.length);
  
  return {
    user_id: user.id,
    username: user.username,
    total_posts: posts.length,
    total_followers: user.follower_count,
    total_reach: totalReach,
    total_likes: totalLikes,
    total_comments: totalComments,
    total_shares: totalShares,
    avg_engagement_rate: avgEngagementRate.toFixed(2),
    top_posts: topPosts,
    daily_stats: dailyStats,
    content_type_performance: contentTypePerformance,
    creator_tier: tier,
    tier_requirements: getTierRequirements(tier, user.follower_count, avgEngagementRate)
  };
}

function calculateDailyStats(posts, days) {
  const dailyMap = {};
  const now = new Date();
  
  // Initialize days
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyMap[dateStr] = { posts: 0, reach: 0, engagement: 0 };
  }
  
  // Aggregate posts
  posts.forEach(post => {
    const dateStr = post.created_at.split('T')[0];
    if (dailyMap[dateStr]) {
      dailyMap[dateStr].posts += 1;
      dailyMap[dateStr].reach += post.view_count || 0;
      dailyMap[dateStr].engagement += (post.like_count || 0) + (post.comment_count || 0);
    }
  });
  
  return Object.entries(dailyMap)
    .map(([date, stats]) => ({ date, ...stats }))
    .reverse();
}

function determineCreatorTier(followers, engagement, postCount) {
  if (followers >= 100000 && engagement >= 20) return "Celebrity";
  if (followers >= 10000 && engagement >= 15) return "Star";
  if (followers >= 1000 && engagement >= 10) return "Creator";
  if (followers >= 100 && engagement >= 5) return "Rising";
  return "Beginner";
}

function getTierRequirements(currentTier, followers, engagement) {
  const tiers = {
    "Beginner": { nextTier: "Rising", followers: 100, engagement: 5 },
    "Rising": { nextTier: "Creator", followers: 1000, engagement: 10 },
    "Creator": { nextTier: "Star", followers: 10000, engagement: 15 },
    "Star": { nextTier: "Celebrity", followers: 100000, engagement: 20 },
    "Celebrity": { nextTier: null, followers: null, engagement: null }
  };
  
  const tierData = tiers[currentTier] || tiers["Beginner"];
  return {
    current_tier: currentTier,
    next_tier: tierData.nextTier,
    followers_needed: tierData.followers ? Math.max(0, tierData.followers - followers) : 0,
    engagement_needed: tierData.engagement ? Math.max(0, tierData.engagement - engagement).toFixed(1) : 0
  };
}

// CORS and Caching helper
function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'public, max-age=20' // 20 sec cache for freshness
    }
  });
}
