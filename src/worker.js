// TalkSyra High-Performance Feed Worker
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
      // 1. HOME & REELS FEED (/api/feed)
      if (path === '/api/feed') {
        const type = url.searchParams.get('type') || 'post';
        const userId = url.searchParams.get('userId');
        const limit = url.searchParams.get('limit') || 20;

        // Fetch Posts with Author details
        const postQuery = `${SB_URL}/rest/v1/posts?select=*,author:users(username,full_name,profile_pic)&type=eq.${type}&order=created_at.desc&limit=${limit}`;
        const postRes = await fetch(postQuery, { headers });
        let posts = await postRes.json();

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
        return jsonResponse(posts);
      }

      // 2. RISING STARS (/api/stars)
      if (path === '/api/stars') {
        const query = `${SB_URL}/rest/v1/users?select=id,username,full_name,profile_pic,follower_count&order=follower_count.desc&limit=10`;
        const res = await fetch(query, { headers });
        return jsonResponse(await res.json());
      }

      // 3. TRENDING CONTENT (/api/trending)
      if (path === '/api/trending') {
        const type = url.searchParams.get('type') || 'post';
        const query = `${SB_URL}/rest/v1/posts?select=*,author:users(username,full_name,profile_pic)&type=eq.${type}&order=like_count.desc&limit=15`;
        const res = await fetch(query, { headers });
        return jsonResponse(await res.json());
      }

      return new Response("TalkSyra Worker API is running", { status: 200 });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
};

// CORS aur Caching handle karne ke liye helper
function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=30' // 30 seconds cache for super speed
    }
  });
}
