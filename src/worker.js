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

    // 1. Security Check (Authorization)
    const authKey = request.headers.get('Authorization');
    if (authKey !== (env.SECRET_KEY || 'TalkSyra_Secret_Key_2024')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS),
      });
    }

    // 2. Sirf POST requests allow karein
    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') || 'others';
        
        if (!file || !file.name) {
          return new Response(JSON.stringify({ error: 'No file uploaded' }), {
            status: 400,
            headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS),
          });
        }

        // --- UNIQUE FILENAME LOGIC ---
        const timestamp = Date.now();
        const uniqueId = crypto.randomUUID().split('-')[0]; // Short UUID suffix
        const cleanFileName = file.name.replace(/\s+/g, '_'); // Spaces ko underscore se replace
        
        // Final Path: folder/uuid_timestamp_filename.ext
        const filePath = `${folder}/${uniqueId}_${timestamp}_${cleanFileName}`;

        // 3. R2 Bucket (talksyra) mein upload karna
        // Ensure your bucket binding in Cloudflare is named 'talksyra'
        const contentType = file.type || 'application/vnd.android.package-archive';
        await env.talksyra.put(filePath, file.stream(), {
          httpMetadata: { contentType },
        });

        // 4. Custom Domain URL generate karna
        const publicUrl = `https://api.talksyra.app/${filePath}`;
        
        return new Response(JSON.stringify({ 
          success: true,
          url: publicUrl,
          fileName: filePath 
        }), {
          status: 200,
          headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS),
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: 'Worker Error', message: e.message }), {
          status: 500,
          headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS),
        });
      }
    }

    return new Response('TalkSyra API Worker is Active', { headers: CORS_HEADERS });
  },
};
