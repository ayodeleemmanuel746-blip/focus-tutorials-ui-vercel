'use strict';
const { app, ready } = require('../server');
module.exports = async function handler(req, res) {
  try {
    await ready;
    return app(req, res);
  } catch (error) {
    console.error('FOCUS TUTORIALS UI startup failed:', error);
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('FOCUS TUTORIALS UI is temporarily unavailable. Check the Vercel function logs.');
    }
  }
};
