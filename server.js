'use strict';

// Minimal zero-dependency static server for the Acadia trip plan.
// Railway (and most PaaS) inject PORT; default to 3000 for local runs.

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const FILE = path.join(__dirname, 'index.html');

// Read once at boot — the page is static, and this keeps responses fast.
const html = fs.readFileSync(FILE);
const gzipped = zlib.gzipSync(html, { level: zlib.constants.Z_BEST_COMPRESSION });
const etag = '"' + require('crypto').createHash('sha1').update(html).digest('hex').slice(0, 16) + '"';

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }

  // Single-page site: everything resolves to the plan.
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304);
    return res.end();
  }

  const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  const body = acceptsGzip ? gzipped : html;

  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'public, max-age=300',
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  };
  if (acceptsGzip) headers['Content-Encoding'] = 'gzip';

  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`Acadia trip plan listening on :${PORT}`);
});

// Railway sends SIGTERM on redeploy; exit cleanly so there's no dropped request.
process.on('SIGTERM', () => server.close(() => process.exit(0)));
