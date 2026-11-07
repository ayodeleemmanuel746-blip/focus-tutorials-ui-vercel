'use strict';
const { app, ready } = require('../server');

// Every request reaches this single function (see vercel.json). Express must see
// the ORIGINAL browser path (/login, /logout, /dashboard, /api/uploads/sign ...),
// otherwise every route falls through to "Page not found".
// Vercel may deliver either the original path in req.url, or the function path
// (/api) with the original path carried in __focus_path. Both are handled.
function restoreOriginalPath(req) {
  const requestUrl = new URL(req.url || '/', 'http://vercel.internal');
  const carried = requestUrl.searchParams.get('__focus_path');
  if (carried === null) return;

  requestUrl.searchParams.delete('__focus_path');
  const query = requestUrl.searchParams.toString();
  const usable = carried && !carried.includes(':path') && !carried.includes('*');

  if (usable) {
    const pathname = carried.startsWith('/') ? carried : `/${carried}`;
    req.url = pathname + (query ? `?${query}` : '');
  } else if (requestUrl.pathname === '/api' || requestUrl.pathname === '/api/index') {
    // Placeholder was not filled in: this was a request for the site root.
    req.url = '/' + (query ? `?${query}` : '');
  } else {
    req.url = requestUrl.pathname + (query ? `?${query}` : '');
  }
}

module.exports = async function handler(req, res) {
  try {
    // Diagnostic: open /api?debug=1 to see what Vercel passes to the app (no cookies/secrets shown).
    const probe = new URL(req.url || '/', 'http://vercel.internal');
    if (probe.pathname === '/api' && probe.searchParams.get('debug') === '1') {
      const h = req.headers || {};
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({
        method: req.method,
        rawUrl: req.url,
        headers: {
          'x-matched-path': h['x-matched-path'],
          'x-vercel-id': h['x-vercel-id'],
          'x-forwarded-host': h['x-forwarded-host'],
          'x-forwarded-proto': h['x-forwarded-proto']
        }
      }, null, 2));
    }
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
