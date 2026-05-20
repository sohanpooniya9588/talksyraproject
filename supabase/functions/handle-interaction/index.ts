import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    // Prefer service role for trusted server operations; fall back to anon key if provided.
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY ?? ''

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing SUPABASE_URL or key' }), { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // 1. Authenticate User
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const payload = await req.json()
    const { action, postId, content } = payload

    if (action === 'like') {
      const { data: existing } = await supabase.from('likes')
        .select().match({ post_id: postId, user_id: user.id }).maybeSingle()

      if (existing) {
        await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id })
        await supabase.rpc('decrement_like_count', { p_id: postId })
        return new Response(JSON.stringify({ status: 'unliked' }), { headers: { 'Content-Type': 'application/json' } })
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
        await supabase.rpc('increment_like_count', { p_id: postId })
        return new Response(JSON.stringify({ status: 'liked' }), { headers: { 'Content-Type': 'application/json' } })
      }
    }

    if (action === 'comment') {
      if (!content || content.length > 500) return new Response(JSON.stringify({ error: 'Invalid content' }), { status: 400 })

      // Rate limit: allow one comment every 10 seconds per user
      const { data: recent } = await supabase.from('comments')
        .select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)

      if (recent && recent.length > 0) {
        const lastTime = new Date(recent[0].created_at).getTime()
        if (Date.now() - lastTime < 10000) return new Response(JSON.stringify({ error: 'Too many requests. Wait 10s.' }), { status: 429 })
      }

      await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content })
      await supabase.rpc('increment_comment_count', { p_id: postId })
      return new Response(JSON.stringify({ status: 'commented' }), { headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 400 })
  }
})
