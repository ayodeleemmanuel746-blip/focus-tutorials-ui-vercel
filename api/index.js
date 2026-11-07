'use strict';
const { app, ready } = require('../server');

// Vercel rewrites requests to this single function. Carry the original
// browser path in __focus_path and restore it before Express matches routes.
function restoreOriginalPath(req) {
  const requestUrl = new URL(req.url || '/', 'http://vercel.internal');
  const originalPath = requestUrl.searchParams.get('__focus_path');
  if (!originalPath) return;

  requestUrl.searchParams.delete('__focus_path');
  const pathname = originalPath.startsWith('/') ? originalPath : `/${originalPath}`;
  const query = requestUrl.searchParams.toString();
  req.url = pathname + (query ? `?${query}` : '');
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
