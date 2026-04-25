export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // API routes for authentication and KV storage
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }
    
    // Serve static assets for all other paths
    return env.ASSETS.fetch(request);
  }
};

async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  
  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Ping endpoint to check if worker is running
    if (url.pathname === '/api/ping') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Authentication Endpoint
    if (url.pathname === '/api/auth') {
      if (request.method === 'POST') {
        const { password } = await request.json();
        const expectedPassword = env.ADMIN || '';
        
        if (!expectedPassword || password === expectedPassword) {
          return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        } else {
          return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
      }
    }

    // Verify Authorization header for data access
    const authHeader = request.headers.get('Authorization') || '';
    const expectedPassword = env.ADMIN || '';
    
    // Check if the expected password is set and matches
    if (expectedPassword && authHeader !== expectedPassword) {
       return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Data Endpoint
    if (url.pathname === '/api/data') {
      if (!env.KV) {
        return new Response(JSON.stringify({ error: 'KV namespace not bound. Please bind a KV namespace in Cloudflare named "KV".' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      if (request.method === 'GET') {
        const data = await env.KV.get('fund_data');
        return new Response(data || JSON.stringify({ transactions: [] }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } 
      
      if (request.method === 'POST') {
        const data = await request.text();
        await env.KV.put('fund_data', data);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}
