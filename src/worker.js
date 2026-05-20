// TalkSyra High-Performance Smart Feed Worker (Instagram-like ranking)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Supabase Config (Worker Settings -> Variables mein add karein)
    const SB_URL = env.SUPABASE_URL || "https://frmazzmzyychdfajnslt.supabase.co";
    const SB_KEY = env.SUPABASE_ANON_KEY; 

    const headers = {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json'
    };

    try {
      // 1. HOME & REELS FEED WITH SMART RANKING (/api/feed)
      if (path === '/api/feed') {
        const type = url.searchParams.get('type') || 'post';
        const userId = url.searchParams.get('userId');
        const limit = url.searchParams.get('limit') || 20;
        const offset = url.searchParams.get('offset') || 0;
        const personalized = url.searchParams.get('personalized') === 'true';

        // Fetch more posts than needed for ranking
        const fetchLimit = Math.min(limit * 5, 100); // Fetch 5x to rank better
        const postQuery = `${SB_URL}/rest/v1/posts?select=id,type,caption,media_url,thumbnail_url,audio_url,aspect_ratio,duration,visibility,like_count,comment_count,share_count,view_count,location_name,created_at,user_id,author:users(id,username,full_name,profile_pic,is_verified,follower_count)&type=eq.${type}&offset=${offset}&limit=${fetchLimit}`;
        const postRes = await fetch(postQuery, { headers });
        let posts = await postRes.json();

        // Fetch follower list if personalized
        let followingList = [];
        if (personalized && userId) {
          const followQuery = `${SB_URL}/rest/v1/followers?select=following_id&follower_id=eq.${userId}`;
          const followRes = await fetch(followQuery, { headers });
          const follows = await followRes.json();
          followingList = follows.map(f => f.following_id);
        }

        // Check Like Status if User is logged in
        if (userId && posts.length > 0) {
          const postIds = posts.map(p => p.id);
          const likesQuery = `${SB_URL}/rest/v1/likes?select=post_id&user_id=eq.${userId}&post_id=in.(${postIds.join(',')})`;
          const likesRes = await fetch(likesQuery, { headers });
          const likedData = await likesRes.json();
          const likedIds = new Set(likedData.map(l => l.post_id));

          posts = posts.map(p => ({
            ...p,
            is_liked: likedIds.has(p.id) ? [{ user_id: userId }] : []
          }));
        }

        // Apply Smart Ranking Algorithm (Instagram-style)
        let rankedPosts = rankPosts(posts);
        
        // Apply personalization boost if enabled
        if (personalized && followingList.length > 0) {
          rankedPosts = rankedPosts.map(p => ({
            ...p,
            _personalization_boost: followingList.includes(p.user_id) ? 1.5 : 1.0,
            _score: p._score * (followingList.includes(p.user_id) ? 1.5 : 1.0)
          })).sort((a, b) => b._score - a._score);
        }
        
        // Return top N posts
        return jsonResponse(rankedPosts.slice(0, limit));
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
        const limit = url.searchParams.get('limit') || 15;
        
        // Fetch trending with extra posts for ranking
        const fetchLimit = Math.min(limit * 3, 50);
        const query = `${SB_URL}/rest/v1/posts?select=id,type,caption,media_url,thumbnail_url,audio_url,aspect_ratio,duration,visibility,like_count,comment_count,share_count,view_count,location_name,created_at,user_id,author:users(id,username,full_name,profile_pic,is_verified,follower_count)&type=eq.${type}&order=like_count.desc&limit=${fetchLimit}`;
        const res = await fetch(query, { headers });
        let posts = await res.json();
        
        // Rank by viral potential
        const rankedPosts = rankPosts(posts);
        return jsonResponse(rankedPosts.slice(0, limit));
      }

      // 4. SEARCH BY HASHTAG (/api/hashtags/[tag])
      if (path.startsWith('/api/hashtags/')) {
        const tag = path.split('/')[3];
        if (!tag) return jsonResponse([]);
        
        // Search posts containing hashtag in caption
        const query = `${SB_URL}/rest/v1/posts?select=id,type,caption,media_url,thumbnail_url,like_count,comment_count,view_count,created_at,user_id,author:users(username,full_name,profile_pic,is_verified)&caption=ilike.%23${tag}%&order=like_count.desc&limit=20`;
        const res = await fetch(query, { headers });
        const posts = await res.json();
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
        
        const query = `${SB_URL}/rest/v1/posts?select=id,type,caption,media_url,thumbnail_url,audio_url,like_count,comment_count,view_count,created_at,user_id,author:users(username,full_name,profile_pic,is_verified)&caption=ilike.%23${tag}%&order=like_count.desc&limit=${limit}`;
        const res = await fetch(query, { headers });
        const posts = await res.json();
        return jsonResponse(rankPosts(posts));
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
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
};

// Error response helper
function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
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

// Smart ranking algorithm (Instagram-style multi-factor scoring)
function rankPosts(posts) {
  const now = Date.now();
  
  return posts.map(post => {
    // 1. ENGAGEMENT SCORE (50% weight)
    // Comments & shares weighted more (higher user intent)
    const engagement_score = 
      (post.like_count || 0) * 1.0 +
      (post.comment_count || 0) * 2.5 +
      (post.share_count || 0) * 5.0 +
      (post.view_count || 0) * 0.05;
    
    // 2. FRESHNESS SCORE (20% weight)
    // Recent posts ranked higher; decay over 7 days
    const post_age_days = (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const freshness_score = Math.max(0, 1.0 - (post_age_days / 7.0));
    
    // 3. CREATOR QUALITY SCORE (15% weight)
    // Follower count + verification status + posting consistency
    const author = post.author || {};
    const follower_boost = Math.log10((author.follower_count || 1) + 1); // Logarithmic scale
    const verification_boost = (author.is_verified ? 1.5 : 1.0);
    const creator_quality = follower_boost * verification_boost;
    
    // 4. ENGAGEMENT RATE (10% weight)
    // How fast content is getting engagement
    const engagement_rate = post_age_days > 0 
      ? engagement_score / (post_age_days + 1)
      : engagement_score;
    
    // 5. FINAL COMPOSITE SCORE (normalization + weighted sum)
    const final_score = 
      (Math.log10(engagement_score + 1) * 0.50) +        // Engagement (50%)
      (freshness_score * 0.20) +                           // Freshness (20%)
      (Math.log10(creator_quality + 1) * 0.15) +          // Creator (15%)
      (Math.log10(engagement_rate + 1) * 0.10) +          // Velocity (10%)
      (post.visibility === 'public' ? 0.05 : 0);          // Public boost (5%)
    
    return {
      ...post,
      _score: final_score, // Hidden scoring metadata
      _engagement_rate: engagement_rate.toFixed(2)
    };
  }).sort((a, b) => b._score - a._score); // Sort by score (highest first)
}

// CORS and Caching helper
function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=20' // 20 sec cache for freshness
    }
  });
}
