'use strict';

// Minimal zero-dependency static server for the Acadia trip plan and the piñata-drop game.
// Railway (and most PaaS) inject PORT; default to 3000 for local runs.

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// Pages are read once at boot and pre-gzipped — both are static.
function load(file) {
  const raw = fs.readFileSync(path.join(__dirname, file));
  return {
    raw,
    gzipped: zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_COMPRESSION }),
    etag: '"' + crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16) + '"',
  };
}
const plan = load('index.html');
const pinata = load('pinata.html');

// Route table. Anything unlisted resolves to the plan, as before.
const routes = {
  '/pinata': pinata,
  '/pinata.html': pinata,
  '/pinata/': pinata,
};

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

  const page = routes[url] || plan;

  if (req.headers['if-none-match'] === page.etag) {
    res.writeHead(304);
    return res.end();
  }

  const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  const body = acceptsGzip ? page.gzipped : page.raw;

  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'public, max-age=300',
    ETag: page.etag,
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
