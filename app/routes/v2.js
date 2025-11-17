// at top-level somewhere:
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');

const router = express.Router();

// Make sure cookies are parsed before this router
// app.use(cookieParser());

// If you want true pass-through for binary/multipart bodies, prefer raw:
router.use(express.raw({ type: '*/*', limit: '50mb' })); // adjust limit as needed

// CORS (keep what you had; adding expose-headers helps the browser read custom headers)
const allowedOrigins = ["https://1var.com", "https://email.1var.com"];
router.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Original-Host, X-accessToken");
  res.header("Access-Control-Expose-Headers", "*, Authorization"); // optional
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

// hop-by-hop headers must not be forwarded
const HOP_BY_HOP = new Set([
  'connection','keep-alive','proxy-authenticate','proxy-authorization',
  'te','trailer','transfer-encoding','upgrade'
]);

function filterHeaders(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) out[k] = v;
  }
  return out;
}

router.all('*', async (req, res) => {
  try {
    // Build compute URL with path+query intact
    const computeUrl = `https://compute.1var.com${req.originalUrl}`;

    // Pull what you need from the incoming request
    const accessToken = req.cookies?.accessToken || req.headers['x-accesstoken'] || '';
    const originalHost = req.headers['x-original-host'];

    // Forward request as-is. Use stream to avoid buffering/transforming.
    const resp = await axios({
      url: computeUrl,
      method: req.method,
      // For GET/HEAD there is no body; for others we pass the raw buffer
      data: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      responseType: 'stream',
      // pass through relevant headers; override host to compute domain
      headers: {
        ...filterHeaders(req.headers),
        host: 'compute.1var.com',
        'x-original-host': originalHost,
        'x-accesstoken': accessToken,
      },
      // don't reject non-2xx; we want to pass status through
      validateStatus: () => true,
      withCredentials: true,
      maxRedirects: 0,
      decompress: false, // pass content-encoding as-is
    });

    // Forward status + headers (minus hop-by-hop)
    res.status(resp.status);
    for (const [k, v] of Object.entries(filterHeaders(resp.headers))) {
      // Express expects array for multi-value headers like set-cookie
      res.setHeader(k, v);
    }

    // Stream body directly to the client
    resp.data.pipe(res);
  } catch (err) {
    // If the upstream failed before sending a response, return something sane
    const status = err.response?.status ?? 502;
    const headers = err.response?.headers ? filterHeaders(err.response.headers) : {};
    const payload = err.response?.data ?? 'Upstream error';
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    // If we got a buffer/stream, just send it; otherwise stringify a bit
    if (payload && typeof payload.pipe === 'function') {
      res.status(status);
      payload.pipe(res);
    } else {
      res.status(status).send(payload);
    }
  }
});

module.exports = router;
