// ========================================
// SHARED FEED RANKING UTILITIES
// ========================================
// Common functions used by both post and reel feeds
// Imported by: postFeed.js, reelsFeed.js

export class FeedRanker {
  // Generic engagement calculation
  static calculateEngagement(post, reelMode = false) {
    if (reelMode) {
      // Reels: views weighted higher
      return (
        (post.like_count || 0) * 1.0 +
        (post.comment_count || 0) * 3.0 +
        (post.share_count || 0) * 6.0 +
        (post.view_count || 0) * 0.1
      );
    } else {
      // Posts: balanced engagement
      return (
        (post.like_count || 0) * 1.0 +
        (post.comment_count || 0) * 2.5 +
        (post.share_count || 0) * 5.0 +
        (post.view_count || 0) * 0.05
      );
    }
  }

  // Generic freshness calculation
  static calculateFreshness(createdAt, decayDays = 7) {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return Math.max(0, 1.0 - ageDays / decayDays);
  }

  // Creator quality calculation
  static calculateCreatorQuality(author) {
    const verificationBoost = author?.is_verified ? 1.5 : 1.0;
    return (author?.follower_count || 0) * verificationBoost;
  }

  // Velocity calculation (with configurable time unit)
  static calculateVelocity(post, timeUnitHours = 24, reelMode = false) {
    const engagement = this.calculateEngagement(post, reelMode);
    const ageMs = Date.now() - new Date(post.created_at).getTime();
    const ageUnits = ageMs / (1000 * 60 * 60 * timeUnitHours);
    return engagement / (Math.max(ageUnits, 0.5) + 1);
  }

  // Composite score with custom weights
  static calculateCompositeScore(
    post,
    weights = {
      engagement: 0.5,
      freshness: 0.2,
      creator: 0.15,
      velocity: 0.1,
      publicBoost: 0.05,
    },
    reelMode = false
  ) {
    const engagementScore = this.calculateEngagement(post, reelMode);
    const freshnessScore = this.calculateFreshness(
      post.created_at,
      reelMode ? 3 : 7
    );
    const creatorScore = this.calculateCreatorQuality(post.author);
    const velocityScore = this.calculateVelocity(
      post,
      reelMode ? 1 : 24,
      reelMode
    );
    const publicBoost = post.visibility === "public" ? weights.publicBoost : 0;

    return (
      Math.log10(engagementScore + 1) * weights.engagement +
      freshnessScore * weights.freshness +
      Math.log10(creatorScore + 1) * weights.creator +
      Math.log10(velocityScore + 1) * weights.velocity +
      publicBoost
    );
  }

  // Rank array of posts by score
  static rankByScore(items, reelMode = false) {
    return items
      .map((item) => ({
        ...item,
        score: this.calculateCompositeScore(item, undefined, reelMode),
      }))
      .sort((a, b) => b.score - a.score);
  }

  // Diversity scoring - boost posts from different creators
  static applyDiversityBoost(rankedItems, diversityWeight = 0.1) {
    const authorFrequency = {};
    const boostFactor = 1 - diversityWeight;

    return rankedItems.map((item, index) => {
      const authorId = item.author?.id;
      authorFrequency[authorId] = (authorFrequency[authorId] || 0) + 1;

      // Reduce score if same author appears too often
      const repetitionPenalty =
        authorFrequency[authorId] > 5
          ? boostFactor
          : 1 + diversityWeight * (1 / authorFrequency[authorId]);

      return {
        ...item,
        score: item.score * repetitionPenalty,
      };
    });
  }

  // Filter posts by multiple criteria
  static filterByContext(posts, context = {}) {
    const {
      minEngagement = 0,
      minFollowers = 0,
      excludeUsers = [],
      includeHashtag = null,
    } = context;

    return posts.filter((post) => {
      // Engagement threshold
      if (
        FeedRanker.calculateEngagement(post) < minEngagement
      ) {
        return false;
      }

      // Follower threshold
      if (
        (post.author?.follower_count || 0) < minFollowers
      ) {
        return false;
      }

      // Exclude users
      if (excludeUsers.includes(post.author?.id)) {
        return false;
      }

      // Hashtag filter
      if (
        includeHashtag &&
        !post.caption?.includes(`#${includeHashtag}`)
      ) {
        return false;
      }

      return true;
    });
  }

  // Trending detection - posts with high velocity
  static detectTrending(posts, velocityThreshold = 50) {
    return posts.filter((post) => {
      const velocity = FeedRanker.calculateVelocity(post);
      return velocity > velocityThreshold;
    });
  }

  // Content type distribution - balanced feed
  static balanceContentTypes(posts, typeRatios = { post: 0.7, reel: 0.3 }) {
    const grouped = { post: [], reel: [] };

    posts.forEach((p) => {
      if (grouped[p.type]) {
        grouped[p.type].push(p);
      }
    });

    const balanced = [];
    const totalSlots = posts.length;

    const postSlots = Math.floor(totalSlots * typeRatios.post);
    const reelSlots = Math.floor(totalSlots * typeRatios.reel);

    balanced.push(...grouped.post.slice(0, postSlots));
    balanced.push(...grouped.reel.slice(0, reelSlots));

    return balanced.sort((a, b) => b.score - a.score);
  }
}

// ========================================
// EXPORT
// ========================================
export default FeedRanker;
