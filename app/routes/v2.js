// router.js
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');

const router = express.Router();

// ——— CORS ———
const allowedOrigins = ["https://1var.com", "https://email.1var.com"];
router.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  // include X-Forward-Path in allowed headers
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Forward-Path, X-accessToken");
  res.header("Access-Control-Expose-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

router.use(cookieParser());

// Use raw body so non-JSON/binary can pass through unchanged
router.use(express.raw({ type: '*/*', limit: '50mb' }));

// hop-by-hop headers must not be forwarded
const HOP = new Set(['connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','transfer-encoding','upgrade']);
const filterHeaders = (h) => {
  const out = {};
  for (const [k,v] of Object.entries(h || {})) if (!HOP.has(k.toLowerCase())) out[k] = v;
  return out;
};

router.all('*', async (req, res) => {
  try {
    const accessToken = req.cookies?.accessToken || req.headers['x-accesstoken'] || '';
    // client tells us which path to call upstream, default to originalUrl
    const forwardPath = req.headers['x-forward-path'] || req.originalUrl;
    const computeUrl  = `https://compute.1var.com${forwardPath}`;

    // copy request headers (minus hop-by-hop)
    const hdrs = filterHeaders(req.headers);
    hdrs.host = 'compute.1var.com';
    hdrs['x-accesstoken'] = accessToken;

    const resp = await axios({
      url: computeUrl,
      method: req.method,
      data: ['GET','HEAD'].includes(req.method) ? undefined : req.body, // raw buffer
      headers: hdrs,
      responseType: 'stream',
      validateStatus: () => true,
      maxRedirects: 0,
      decompress: false,
    });

    // forward status + headers + body (stream)
    res.status(resp.status);
    for (const [k,v] of Object.entries(filterHeaders(resp.headers))) res.setHeader(k, v);
    resp.data.pipe(res);
  } catch (err) {
    const status = err.response?.status ?? 502;
    res.status(status);
    if (err.response?.data?.pipe) err.response.data.pipe(res);
    else res.send(err.response?.data ?? (err.message || 'Upstream error'));
  }
});

module.exports = router;
