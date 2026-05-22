// ========================================
// REELS FEED LOGIC - Shorts Feed
// ========================================
// Used for: /api/feed?type=reel
// Purpose: Feed ranking for vertical video reels/shorts
// Returns: Ranked reels with engagement metrics

export async function getReelsFeed(
  supabaseUrl,
  supabaseKey,
  userId,
  limit = 10,
  offset = 0,
  personalized = false
) {
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. FETCH REELS (type='reel' only)
    const fetchLimit = Math.min(limit * 5, 100);
    const reelQuery = `${supabaseUrl}/rest/v1/posts?select=id,type,caption,media_url,thumbnail_url,audio_url,aspect_ratio,duration,visibility,like_count,comment_count,share_count,view_count,location_name,created_at,user_id,author:users!posts_user_id_fkey(id,username,full_name,profile_pic,is_verified,follower_count)&type=eq.reel&visibility=eq.public&order=created_at.desc&offset=${offset}&limit=${fetchLimit}`;

    const reelRes = await fetch(reelQuery, { headers });
    let reels = await reelRes.json();

    if (!Array.isArray(reels)) {
      return {
        success: false,
        error: reelRes.statusText || "Failed to fetch reels",
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
      reels = reels.filter((r) => followingList.includes(r.user_id));
    }

    // 4. CHECK LIKE STATUS
    if (userId && reels.length > 0) {
      const reelIds = reels.map((r) => r.id);
      const likesQuery = `${supabaseUrl}/rest/v1/likes?select=post_id&user_id=eq.${userId}&post_id=in.(${reelIds.join(
        ","
      )})`;
      const likesRes = await fetch(likesQuery, { headers });
      const likedData = await likesRes.json();
      const likedIds = new Set(likedData.map((l) => l.post_id));

      reels = reels.map((r) => ({
        ...r,
        is_liked: likedIds.has(r.id),
      }));
    }

    // 5. RANK REELS USING SMART ALGORITHM
    // (Reels tend to have higher engagement, so velocity is more important)
    reels = rankReelsByScore(reels);

    // 6. RETURN PAGINATED RESULTS
    const rankedReels = reels.slice(0, limit);

    return {
      success: true,
      data: rankedReels,
      pagination: {
        total: reels.length,
        limit,
        offset,
        has_more: reels.length > limit,
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
// RANKING ALGORITHM FOR REELS
// ========================================
// Adjusted for Reels: Higher weight on engagement + velocity
// Reels tend to go viral faster, so engagement is more critical

function rankReelsByScore(reels) {
  const rankedReels = reels.map((reel) => {
    const score = calculateReelScore(reel);
    return {
      ...reel,
      score: parseFloat(score.toFixed(2)),
    };
  });

  // Sort by score descending (highest first)
  return rankedReels.sort((a, b) => b.score - a.score);
}

function calculateReelScore(reel) {
  // REELS SCORING (adjusted for short-form video)
  // 60% Engagement (higher than posts because reels are about viral content)
  // 15% Freshness (shorter decay for reels - 3 days instead of 7)
  // 10% Creator Quality
  // 15% Velocity (higher weight for viral potential)

  const engagementScore = calculateReelEngagement(reel);
  const freshnessScore = calculateReelFreshness(reel.created_at);
  const creatorQualityScore = calculateCreatorQuality(reel.author);
  const velocityScore = calculateReelVelocity(reel);
  const publicBoost = reel.visibility === "public" ? 0.05 : 0;

  const finalScore =
    Math.log10(engagementScore + 1) * 0.6 +
    freshnessScore * 0.15 +
    Math.log10(creatorQualityScore + 1) * 0.1 +
    Math.log10(velocityScore + 1) * 0.15 +
    publicBoost;

  return finalScore;
}

function calculateReelEngagement(reel) {
  // For reels: Views are more important, comments show intent
  // likes × 1.0 + comments × 3.0 + shares × 6.0 + views × 0.1
  return (
    (reel.like_count || 0) * 1.0 +
    (reel.comment_count || 0) * 3.0 +
    (reel.share_count || 0) * 6.0 +
    (reel.view_count || 0) * 0.1
  );
}

function calculateReelFreshness(createdAt) {
  // Reels decay faster - 3 days instead of 7
  // New reels get priority quickly
  const reelAgeMs = Date.now() - new Date(createdAt).getTime();
  const reelAgeDays = reelAgeMs / (1000 * 60 * 60 * 24);
  return Math.max(0, 1.0 - reelAgeDays / 3.0);
}

function calculateCreatorQuality(author) {
  // Same as posts
  const verificationBoost = author.is_verified ? 1.5 : 1.0;
  return (author.follower_count || 0) * verificationBoost;
}

function calculateReelVelocity(reel) {
  // Velocity = Engagement / (reel_age_hours + 1)
  // For reels, measure velocity in hours instead of days for faster trending
  const engagementScore = calculateReelEngagement(reel);
  const reelAgeMs = Date.now() - new Date(reel.created_at).getTime();
  const reelAgeHours = reelAgeMs / (1000 * 60 * 60);
  return engagementScore / (Math.max(reelAgeHours, 0.5) + 1); // Min 0.5 hours
}

// ========================================
// EXPORT
// ========================================
export default {
  getReelsFeed,
  rankReelsByScore,
  calculateReelScore,
};
