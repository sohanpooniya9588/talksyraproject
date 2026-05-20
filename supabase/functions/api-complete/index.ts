import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY ?? ''

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing SUPABASE_URL or key' }), { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Parse URL and get user
    const url = new URL(req.url)
    const pathname = url.pathname
    const searchParams = url.searchParams

    // Authenticate User (except for public endpoints)
    let user = null
    const publicPaths = ['/api/posts/feed', '/api/posts/reels', '/api/trending', '/api/search']
    const isPublic = publicPaths.some(path => pathname.startsWith(path))

    if (!isPublic) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !authUser) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
      user = authUser
    }

    const payload = req.method !== 'GET' ? await req.json().catch(() => ({})) : {}

    // ============ POSTS ENDPOINTS ============

    // GET /api/posts/feed - Chronological feed
    if (pathname === '/api/posts/feed' && req.method === 'GET') {
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*, author:users(id, username, full_name, profile_pic, is_verified)')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ posts, hasMore: posts.length === limit }))
    }

    // GET /api/posts/reels - Smart feed (For You page) with ranking
    if (pathname === '/api/posts/reels' && req.method === 'GET') {
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      // Fetch more posts for ranking
      const fetchCount = Math.min(limit * 5, 500)
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*, author:users(id, username, full_name, profile_pic, is_verified, follower_count)')
        .eq('visibility', 'public')
        .eq('type', 'reel')
        .order('created_at', { ascending: false })
        .limit(fetchCount)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

      // Smart ranking algorithm
      const rankedPosts = (posts || []).map(post => {
        const engagement = (post.like_count || 0) * 1.0 +
                          (post.comment_count || 0) * 2.0 +
                          (post.share_count || 0) * 3.0 +
                          (post.view_count || 0) * 0.1
        
        const hoursOld = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
        const freshness = Math.max(0, 1 - (hoursOld / 168)) // Weekly decay
        
        const creatorScore = (post.author?.follower_count || 0) / 100000 + (post.author?.is_verified ? 1 : 0)
        
        const engagementScore = 50 * (engagement / (Math.max(engagement, 1)))
        const freshnessScore = 20 * freshness
        const creatorQuality = 15 * Math.min(creatorScore / 2, 1)
        const velocityBoost = 5 * Math.min((post.view_count || 1) / 10000, 1)
        const publicBoost = 10

        const totalScore = engagementScore + freshnessScore + creatorQuality + velocityBoost + publicBoost

        return { ...post, engagement_score: totalScore }
      }).sort((a, b) => b.engagement_score - a.engagement_score).slice(offset, offset + limit)

      return new Response(JSON.stringify({ reels: rankedPosts, hasMore: rankedPosts.length === limit }))
    }

    // POST /api/posts - Create post
    if (pathname === '/api/posts' && req.method === 'POST') {
      const { caption, media_url, type = 'post', visibility = 'public' } = payload

      const { data: post, error } = await supabase
        .from('posts')
        .insert({ user_id: user.id, caption, media_url, type, visibility })
        .select()
        .single()

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

      // Update post count
      await supabase.rpc('increment_post_count', { p_user_id: user.id })

      return new Response(JSON.stringify({ status: 'success', post }))
    }

    // GET /api/posts/:postId - Get single post
    if (pathname.match(/^\/api\/posts\/[a-f0-9-]+$/) && req.method === 'GET') {
      const postId = pathname.split('/').pop()
      const { data: post, error } = await supabase
        .from('posts')
        .select('*, author:users(id, username, full_name, profile_pic, is_verified)')
        .eq('id', postId)
        .single()

      if (error) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 })
      return new Response(JSON.stringify({ post }))
    }

    // ============ LIKES ENDPOINTS ============

    // POST /api/likes - Like a post
    if (pathname === '/api/likes' && req.method === 'POST') {
      const { post_id } = payload

      const { data: existing } = await supabase
        .from('likes')
        .select()
        .match({ post_id, user_id: user.id })
        .maybeSingle()

      if (existing) {
        // Unlike
        await supabase.from('likes').delete().match({ post_id, user_id: user.id })
        await supabase.rpc('decrement_like_count', { p_id: post_id })
        return new Response(JSON.stringify({ status: 'unliked' }))
      } else {
        // Like
        await supabase.from('likes').insert({ post_id, user_id: user.id })
        await supabase.rpc('increment_like_count', { p_id: post_id })
        return new Response(JSON.stringify({ status: 'liked' }))
      }
    }

    // ============ COMMENTS ENDPOINTS ============

    // POST /api/comments - Create comment
    if (pathname === '/api/comments' && req.method === 'POST') {
      const { post_id, content, parent_id = null } = payload

      if (!content || content.length > 500) {
        return new Response(JSON.stringify({ error: 'Invalid content' }), { status: 400 })
      }

      // Rate limit: allow one comment every 10 seconds per user
      const { data: recent } = await supabase
        .from('comments')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (recent && recent.length > 0) {
        const lastTime = new Date(recent[0].created_at).getTime()
        if (Date.now() - lastTime < 10000) {
          return new Response(JSON.stringify({ error: 'Too many requests. Wait 10s.' }), { status: 429 })
        }
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({ post_id, user_id: user.id, content, parent_id })
        .select()
        .single()

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

      await supabase.rpc('increment_comment_count', { p_id: post_id })

      return new Response(JSON.stringify({ status: 'success', comment }))
    }

    // GET /api/posts/:postId/comments - Get post comments
    if (pathname.match(/^\/api\/posts\/[a-f0-9-]+\/comments$/) && req.method === 'GET') {
      const postId = pathname.split('/')[3]
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data: comments, error } = await supabase
        .from('comments')
        .select('*, author:users(id, username, full_name, profile_pic)')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ comments, hasMore: comments.length === limit }))
    }

    // ============ FOLLOWS ENDPOINTS ============

    // POST /api/follows - Follow user
    if (pathname === '/api/follows' && req.method === 'POST') {
      const { following_id } = payload

      const { data: existing } = await supabase
        .from('followers')
        .select()
        .match({ follower_id: user.id, following_id })
        .maybeSingle()

      if (existing) {
        return new Response(JSON.stringify({ status: 'already_following' }), { status: 400 })
      }

      await supabase.from('followers').insert({ follower_id: user.id, following_id })
      await supabase.rpc('increment_follower_count', { p_user_id: following_id })
      await supabase.rpc('increment_following_count', { p_user_id: user.id })

      return new Response(JSON.stringify({ status: 'followed' }))
    }

    // DELETE /api/follows/:userId - Unfollow user
    if (pathname.match(/^\/api\/follows\/[a-f0-9-]+$/) && req.method === 'DELETE') {
      const followingId = pathname.split('/').pop()

      await supabase.from('followers').delete().match({ follower_id: user.id, following_id: followingId })
      await supabase.rpc('decrement_follower_count', { p_user_id: followingId })
      await supabase.rpc('decrement_following_count', { p_user_id: user.id })

      return new Response(JSON.stringify({ status: 'unfollowed' }))
    }

    // GET /api/follows/:userId/check - Check if following
    if (pathname.match(/^\/api\/follows\/[a-f0-9-]+\/check$/) && req.method === 'GET') {
      const targetUserId = pathname.split('/')[3]

      const { data: follow } = await supabase
        .from('followers')
        .select()
        .match({ follower_id: user.id, following_id: targetUserId })
        .maybeSingle()

      return new Response(JSON.stringify({ isFollowing: !!follow }))
    }

    // GET /api/users/:userId/followers - Get followers list
    if (pathname.match(/^\/api\/users\/[a-f0-9-]+\/followers$/) && req.method === 'GET') {
      const userId = pathname.split('/')[3]
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data: followers, error } = await supabase
        .from('followers')
        .select('follower:users(id, username, full_name, profile_pic, is_verified)')
        .eq('following_id', userId)
        .range(offset, offset + limit - 1)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

      const result = followers?.map(f => f.follower) || []
      return new Response(JSON.stringify({ followers: result, hasMore: result.length === limit }))
    }

    // GET /api/users/:userId/following - Get following list
    if (pathname.match(/^\/api\/users\/[a-f0-9-]+\/following$/) && req.method === 'GET') {
      const userId = pathname.split('/')[3]
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data: following, error } = await supabase
        .from('followers')
        .select('following:users(id, username, full_name, profile_pic, is_verified)')
        .eq('follower_id', userId)
        .range(offset, offset + limit - 1)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

      const result = following?.map(f => f.following) || []
      return new Response(JSON.stringify({ following: result, hasMore: result.length === limit }))
    }

    // ============ SAVES ENDPOINTS ============

    // POST /api/saves - Save post
    if (pathname === '/api/saves' && req.method === 'POST') {
      const { post_id } = payload

      const { data: existing } = await supabase
        .from('saves')
        .select()
        .match({ post_id, user_id: user.id })
        .maybeSingle()

      if (existing) {
        return new Response(JSON.stringify({ status: 'already_saved' }), { status: 400 })
      }

      await supabase.from('saves').insert({ post_id, user_id: user.id })
      return new Response(JSON.stringify({ status: 'saved' }))
    }

    // DELETE /api/saves/:postId - Unsave post
    if (pathname.match(/^\/api\/saves\/[a-f0-9-]+$/) && req.method === 'DELETE') {
      const postId = pathname.split('/').pop()

      await supabase.from('saves').delete().match({ post_id: postId, user_id: user.id })
      return new Response(JSON.stringify({ status: 'unsaved' }))
    }

    // ============ USER ENDPOINTS ============

    // GET /api/users/:userId - Get user profile
    if (pathname.match(/^\/api\/users\/[a-f0-9-]+$/) && req.method === 'GET' && !pathname.includes('/followers') && !pathname.includes('/following')) {
      const userId = pathname.split('/').pop()

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })

      // Remove sensitive fields
      delete userProfile.password
      return new Response(JSON.stringify({ user: userProfile }))
    }

    // PUT /api/users/:userId - Update user profile
    if (pathname.match(/^\/api\/users\/[a-f0-9-]+$/) && req.method === 'PUT') {
      const userId = pathname.split('/').pop()

      if (userId !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 })
      }

      const { full_name, bio, profile_pic, cover_pic, website, location, is_private } = payload

      const { data: updated, error } = await supabase
        .from('users')
        .update({ full_name, bio, profile_pic, cover_pic, website, location, is_private })
        .eq('id', userId)
        .select()
        .single()

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

      delete updated.password
      return new Response(JSON.stringify({ status: 'success', user: updated }))
    }

    // GET /api/users/:userId/posts - Get user posts
    if (pathname.match(/^\/api\/users\/[a-f0-9-]+\/posts$/) && req.method === 'GET') {
      const userId = pathname.split('/')[3]
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*, author:users(id, username, full_name, profile_pic)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ posts, hasMore: posts.length === limit }))
    }

    // ============ SEARCH ENDPOINTS ============

    // GET /api/search - Global search
    if (pathname === '/api/search' && req.method === 'GET') {
      const q = searchParams.get('q') || ''
      const type = searchParams.get('type') || 'all'
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

      const results = {}

      if (type === 'all' || type === 'users') {
        const { data: users } = await supabase
          .from('users')
          .select('id, username, full_name, profile_pic, is_verified')
          .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
          .limit(limit)

        results.users = users || []
      }

      if (type === 'all' || type === 'posts') {
        const { data: posts } = await supabase
          .from('posts')
          .select('*, author:users(id, username, full_name, profile_pic)')
          .ilike('caption', `%${q}%`)
          .eq('visibility', 'public')
          .limit(limit)

        results.posts = posts || []
      }

      if (type === 'all' || type === 'hashtags') {
        const { data: hashtags } = await supabase
          .from('hashtags')
          .select('tag, usage_count')
          .ilike('tag', `%${q}%`)
          .limit(limit)

        results.hashtags = hashtags || []
      }

      return new Response(JSON.stringify(results))
    }

    // GET /api/hashtags/:tag/posts - Get posts by hashtag
    if (pathname.match(/^\/api\/hashtags\/[^/]+\/posts$/) && req.method === 'GET') {
      const tag = pathname.split('/')[3]
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*, author:users(id, username, full_name, profile_pic)')
        .ilike('caption', `%#${tag}%`)
        .eq('visibility', 'public')
        .order('like_count', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ posts, hasMore: posts.length === limit }))
    }

    // GET /api/trending/hashtags - Get trending hashtags
    if (pathname === '/api/trending/hashtags' && req.method === 'GET') {
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

      const { data: hashtags, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ hashtags }))
    }

    // ============ NOTIFICATIONS ENDPOINTS ============

    // GET /api/notifications - Get user notifications
    if (pathname === '/api/notifications' && req.method === 'GET') {
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*, actor:users(id, username, profile_pic)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ notifications, hasMore: notifications.length === limit }))
    }

    // ============ MESSAGES ENDPOINTS ============

    // GET /api/conversations - Get user conversations
    if (pathname === '/api/conversations' && req.method === 'GET') {
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*, members:conversation_members(user:users(id, username, profile_pic))')
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ conversations, hasMore: conversations.length === limit }))
    }

    // POST /api/messages - Send message
    if (pathname === '/api/messages' && req.method === 'POST') {
      const { conversation_id, content } = payload

      const { data: message, error } = await supabase
        .from('messages')
        .insert({ conversation_id, user_id: user.id, content })
        .select()
        .single()

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ status: 'success', message }))
    }

    // ============ STORIES ENDPOINTS ============

    // POST /api/stories - Create story
    if (pathname === '/api/stories' && req.method === 'POST') {
      const { media_url, caption } = payload

      const { data: story, error } = await supabase
        .from('stories')
        .insert({ user_id: user.id, media_url, caption })
        .select()
        .single()

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ status: 'success', story }))
    }

    // GET /api/stories/feed - Get stories feed
    if (pathname === '/api/stories/feed' && req.method === 'GET') {
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

      const { data: stories, error } = await supabase
        .from('stories')
        .select('*, author:users(id, username, profile_pic, is_verified)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ stories }))
    }

    // ============ COINS & TRANSACTIONS ============

    // GET /api/coins/balance - Get user coin balance
    if (pathname === '/api/coins/balance' && req.method === 'GET') {
      const { data: userBalance } = await supabase
        .from('users')
        .select('red_coins, green_coins')
        .eq('id', user.id)
        .single()

      return new Response(JSON.stringify({
        red_coins: userBalance?.red_coins || 0,
        green_coins: userBalance?.green_coins || 0
      }))
    }

    // POST /api/transactions - Create transaction
    if (pathname === '/api/transactions' && req.method === 'POST') {
      const { coin_type, amount, description } = payload

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          coin_type,
          amount,
          description
        })
        .select()
        .single()

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      return new Response(JSON.stringify({ status: 'success', transaction }))
    }

    // ============ ERROR HANDLING ============

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404 })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 400 })
  }
})
