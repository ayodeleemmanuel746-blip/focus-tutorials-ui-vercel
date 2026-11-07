'use strict';
const { app, ready } = require('../server');

// Vercel sends every request to this single function (see vercel.json).
// Express must see the ORIGINAL browser path (/login, /logout, /dashboard,
// /api/uploads/sign ...) or every route falls through to "Page not found".
// Vercel normally keeps req.url as the original path; older rewrites carried it
// in __focus_path. Both are handled, and unresolved placeholders are ignored.
function restoreOriginalPath(req) {
  const raw = req.url || '/';
  const requestUrl = new URL(raw, 'http://vercel.internal');
  const carried = requestUrl.searchParams.get('__focus_path');

  if (carried !== null) {
    requestUrl.searchParams.delete('__focus_path');
    if (carried && !carried.includes(':path') && !carried.includes('*')) {
      const pathname = carried.startsWith('/') ? carried : `/${carried}`;
      const query = requestUrl.searchParams.toString();
      req.url = pathname + (query ? `?${query}` : '');
      return;
    }
    const query = requestUrl.searchParams.toString();
    req.url = requestUrl.pathname + (query ? `?${query}` : '');
  }

  // Fallback: Vercel exposes the originally requested path in these headers.
  if (requestUrl.pathname === '/api' || requestUrl.pathname === '/api/index' || requestUrl.pathname === '/api/index.js') {
    const hinted = req.headers['x-vercel-original-path'] || req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
    if (typeof hinted === 'string' && hinted.startsWith('/') && !hinted.startsWith('/api/index')) {
      req.url = hinted;
    }
  }
}

module.exports = async function handler(req, res) {
  try {
    restoreOriginalPath(req);
    await ready;
    return app(req, res);
  } catch (error) {
    console.error('FOCUS TUTORIALS UI request failed:', error);
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('FOCUS TUTORIALS UI is temporarily unavailable. Check the Vercel function logs.');
    }
  }
};
