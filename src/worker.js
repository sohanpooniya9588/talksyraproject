export default {
  async fetch(request, env) {
    const CORS_HEADERS = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Security Check
    const authKey = request.headers.get('Authorization');
    if (authKey !== (env.SECRET_KEY || 'TalkSyra_Secret_Key_2024')) {
      return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS });
    }

    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') || 'others';

        if (!file || !file.name) return new Response('No file uploaded', { status: 400, headers: CORS_HEADERS });

        // Generate Unique Filename
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/\s+/g, '_');
        const filePath = `${folder}/${timestamp}_${cleanFileName}`;

        // Determine content type (default to APK MIME)
        const contentType = file.type || 'application/vnd.android.package-archive';

        // Upload to R2 (talksyra bucket)
        await env.talksyra.put(filePath, file.stream(), {
          httpMetadata: { contentType },
          customMetadata: { originalName: file.name },
        });

        // Return the link with your custom domain (adjust if needed)
        const publicUrl = `https://api.talksyra.app/${filePath}`;

        return new Response(JSON.stringify({ url: publicUrl }), {
          status: 200,
          headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS),
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Upload Error', message: e.message }), {
          status: 500,
          headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS),
        });
      }
    }

    return new Response('TalkSyra R2 Worker is Running!', { headers: CORS_HEADERS });
  },
};
