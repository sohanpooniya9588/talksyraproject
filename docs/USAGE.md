Usage
-----

This Cloudflare Worker acts as a bridge to upload files (e.g., APKs) to an R2 bucket and returns a public URL.

Deploy

1. Install Wrangler v3+ and authenticate: `npm install -g wrangler` then `wrangler login`.
2. Fill in `wrangler.toml` with your `account_id` and confirm the R2 bucket name matches.
3. Publish: `wrangler publish`

Example curl upload

```bash
curl -X POST "https://<your-worker-route>" \
  -H "Authorization: TalkSyra_Secret_Key_2024" \
  -F "file=@/path/to/app-release.apk" \
  -F "folder=apks"
```

Response

- Success: `{"url":"https://api.talksyra.app/apks/169..._app-release.apk"}`
- Error: `{"error":"Upload Error","message":"..."}`

Notes

- The worker checks `Authorization` header; change the secret in `wrangler.toml` or use an env var.
- The returned `publicUrl` assumes you serve R2 content through your custom domain (e.g., `api.talksyra.app`). Configure Cloudflare Gateway or a Worker route to serve files from R2 if needed.
- CORS preflight (`OPTIONS`) is supported for browser / mobile app uploads.
