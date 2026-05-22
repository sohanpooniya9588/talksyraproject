// ========================================
// HOME FEED LOGIC - Posts Feed
// ========================================
// Used for: /api/feed?type=post
// Purpose: Feed ranking for home page posts
// Returns: Ranked posts with engagement metrics

export async function getHomeFeed(
  supabaseUrl,
  supabaseKey,
  userId,
  limit = 20,
  offset = 0,
  personalized = false
) {
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. FETCH POSTS (Home page posts only - type='post')
    const fetchLimit = Math.min(limit * 5, 100);
    const postQuery = `${supabaseUrl}/rest/v1/posts?select=id,type,caption,media_url,thumbnail_url,audio_url,aspect_ratio,duration,visibility,like_count,comment_count,share_count,view_count,location_name,created_at,user_id,author:users!posts_user_id_fkey(id,username,full_name,profile_pic,is_verified,follower_count)&type=eq.post&visibility=eq.public&order=created_at.desc&offset=${offset}&limit=${fetchLimit}`;

    const postRes = await fetch(postQuery, { headers });
    let posts = await postRes.json();

    if (!Array.isArray(posts)) {
      return {
        success: false,
        error: postRes.statusText || "Failed to fetch posts",
        code: "DATABASE_ERROR",
      };
    }

    // 2. GET FOLLOWING LIST (if personalized)
    let followingList = [];
    if (personalized && userId) {
      const followQuery = `${supabaseUrl}/rest/v1/followers?select=following_id&follower_id=eq.${userId}`;
      const followRes = await fetch(followQuery, { headers });
      const follows = await followRes.json();
      if (Array.isArray(follows)) {
        followingList = follows.map((f) => f.following_id);
      }
    }

    // 3. FILTER BY FOLLOWING (if personalized)
    if (personalized && followingList.length > 0) {
      posts = posts.filter((p) => followingList.includes(p.user_id));
    }

    // 4. CHECK LIKE STATUS
    if (userId && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const likesQuery = `${supabaseUrl}/rest/v1/likes?select=post_id&user_id=eq.${userId}&post_id=in.(${postIds.join(
        ","
      )})`;
      const likesRes = await fetch(likesQuery, { headers });
      const likedData = await likesRes.json();
      const likedIds = new Set(likedData.map((l) => l.post_id));

      posts = posts.map((p) => ({
        ...p,
        is_liked: likedIds.has(p.id),
      }));
    }

    // 5. RANK POSTS USING SMART ALGORITHM
    posts = rankPostsByScore(posts);

    // 6. RETURN PAGINATED RESULTS
    const rankedPosts = posts.slice(0, limit);

    return {
      success: true,
      data: rankedPosts,
      pagination: {
        total: posts.length,
        limit,
        offset,
        has_more: posts.length > limit,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: "INTERNAL_ERROR",
    };
  }
}

// ========================================
// RANKING ALGORITHM FOR HOME FEED
// ========================================
// Composite Score = 50% Engagement + 20% Freshness + 15% Creator Quality + 10% Velocity + 5% Public Boost

function rankPostsByScore(posts) {
  const rankedPosts = posts.map((post) => {
    const score = calculateScore(post);
    return {
      ...post,
      score: parseFloat(score.toFixed(2)),
    };
  });

  // Sort by score descending (highest first)
  return rankedPosts.sort((a, b) => b.score - a.score);
}

function calculateScore(post) {
  // Calculate components
  const engagementScore = calculateEngagement(post);
  const freshnessScore = calculateFreshness(post.created_at);
  const creatorQualityScore = calculateCreatorQuality(post.author);
  const velocityScore = calculateVelocity(post);
  const publicBoost = post.visibility === "public" ? 0.05 : 0;

  // Final composite score
  const finalScore =
    Math.log10(engagementScore + 1) * 0.5 +
    freshnessScore * 0.2 +
    Math.log10(creatorQualityScore + 1) * 0.15 +
    Math.log10(velocityScore + 1) * 0.1 +
    publicBoost;

  return finalScore;
}

function calculateEngagement(post) {
  // Engagement = likes × 1.0 + comments × 2.5 + shares × 5.0 + views × 0.05
  return (
    (post.like_count || 0) * 1.0 +
    (post.comment_count || 0) * 2.5 +
    (post.share_count || 0) * 5.0 +
    (post.view_count || 0) * 0.05
  );
}

function calculateFreshness(createdAt) {
  // Freshness decays over 7 days
  // 0 days old = 1.0, 7 days old = 0.0
  const postAgeMs = Date.now() - new Date(createdAt).getTime();
  const postAgeDays = postAgeMs / (1000 * 60 * 60 * 24);
  return Math.max(0, 1.0 - postAgeDays / 7.0);
}

function calculateCreatorQuality(author) {
  // Creator Quality = followers × (verified ? 1.5 : 1.0)
  const verificationBoost = author.is_verified ? 1.5 : 1.0;
  return (author.follower_count || 0) * verificationBoost;
}

function calculateVelocity(post) {
  // Velocity = Engagement / (post_age_days + 1)
  // How fast the post is gaining engagement
  const engagementScore = calculateEngagement(post);
  const postAgeMs = Date.now() - new Date(post.created_at).getTime();
  const postAgeDays = postAgeMs / (1000 * 60 * 60 * 24);
  return engagementScore / (postAgeDays + 1);
}

// ========================================
// EXPORT
// ========================================
export default {
  getHomeFeed,
  rankPostsByScore,
  calculateScore,
};
