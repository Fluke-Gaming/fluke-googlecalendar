// --------------------------------------------------
// Cloudflare Worker: Google Calendar Proxy
// --------------------------------------------------

const CALENDAR_ID = 'Zmx1a2VnYW1pbmc1N0BnbWFpbC5jb20@group.calendar.google.com';
const CACHE_TTL = 300; // cache responses for 5 minutes

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const ALLOWED_ORIGINS = [
    "https://flukegaming.com",
    "https://test.flukegaming.com"
  ];

  // Enable CORS for frontend requests
  const corsHeaders = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (ALLOWED_ORIGINS.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  }

  if (request.method === 'OPTIONS') {
    // Preflight request
    return new Response(null, { headers: corsHeaders })
  }

  const cache = caches.default
  const cacheKey = new Request(request.url, request)
  
  // Check cache first
  let response = await cache.match(cacheKey)
  if (response) return response

  try {
    const apiKey = GCALENDAR_API_KEY // Worker secret
    const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${apiKey}&timeMin=${new Date().toISOString()}&singleEvents=true&orderBy=startTime`
    
    const res = await fetch(url)
    const data = await res.json()

    // Return JSON with CORS headers
    response = new Response(JSON.stringify(data), { headers: corsHeaders })

    // Cache the response
    response.headers.append('Cache-Control', `public, max-age=${CACHE_TTL}`)
    await cache.put(cacheKey, response.clone())

    return response
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
}

// -------------------------
// corsResponse helpers
// -------------------------
const ALLOWED_ORIGINS = [
  "https://flukegaming.com",
  "https://test.flukegaming.com"
];

function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "";
  console.log("Request origin:", origin);

  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function corsResponse(body, req, status = 200) {
  return new Response(body, { status, headers: corsHeaders(req) });
}