# talksyraproject

## Supabase Edge Function: handle-interaction

This repo includes a Supabase Edge Function at `supabase/functions/handle-interaction/index.ts` that handles `like` and `comment` actions.

- **Env vars (examples):** See `.env.example` for `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- **Which key to use:**
	- `SUPABASE_ANON_KEY`: public/anon key — safe for client-side usage; limited by Row-Level Security (RLS).
	- `SUPABASE_SERVICE_ROLE_KEY`: sensitive service-role key — required only for privileged server operations (bypassing RLS). Do NOT commit this to git.

- **Security:** Never commit service role keys or tokens to the repository. Use environment variables or your deployment platform's secret manager (Cloudflare Workers secrets, GitHub Actions Secrets, etc.).

To run or deploy the function:

1. For local development, create a local `.env` (do not commit it):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=anon_key_here
# (Optional) SUPABASE_SERVICE_ROLE_KEY=service_role_key_here
```

2. For Cloudflare Workers with `wrangler` set secrets:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
# For server-only operations, also set SUPABASE_SERVICE_ROLE_KEY
```

3. If you need me to switch the function to require only anon-key-safe operations (and avoid RPC/service-role calls), I can modify the function accordingly.

