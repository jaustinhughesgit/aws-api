var express = require('express');
var router = express.Router();
const axios = require('axios');
const {
    COMPUTE_PROXY_TIMEOUT_MS,
    isComputeTimeout
} = require("../lib/computeProxyPolicy");

// Allowlist of origins
const allowedOrigins = [
    "https://1var.com",
    "https://email.1var.com"
];

// ---------- CORS Middleware ----------
router.use((req, res, next) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-Original-Host, X-accessToken");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    next();
});
// ------------------------------------

router.all('/*', async function(req, res, next) {
    try {
        const accessToken = req.cookies['accessToken'];

        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.header("Access-Control-Allow-Origin", origin);
            res.header("Access-Control-Allow-Credentials", "true");
        }

        const type = req.type;
        const reqPath = req.apiGateway.event.path;
        const requestBody = req.body;
        const originalHost = req.headers['x-original-host'];

        if (req.method === 'GET' || req.method === 'POST') {
            const computeUrl = `https://compute.1var.com${reqPath}`;
            const response = await axios.post(computeUrl, {
                withCredentials: true,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Original-Host': originalHost,
                    'X-accessToken': accessToken
                },
                body: requestBody
            }, {
                timeout: COMPUTE_PROXY_TIMEOUT_MS
            });

            if (type === "url") {
                res.json(response.data);
            } else if (type === "cookies") {
                const cookies = response.headers['set-cookie'];
                if (cookies) {
                    cookies.forEach(cookie => {
                        res.append('Set-Cookie', cookie);
                    });
                }

                if (typeof response.data === 'string') {
                    let ent = getPathStartingWithABC(originalHost);
                    res.send({"response":{"oai":{"html":response.data,"entity":ent}}});
                } else if (typeof response.data === "object") {
                    let ent = getPathStartingWithABC(originalHost);
                    res.send({"response":{"oai":{"html":response.data,"entity":ent}}});
                } else {
                    res.send(response.data);
                }
            } else {
                res.status(400).send('Invalid type');
            }
        } else {
            res.send("");
        }

    } catch (error) {
        console.error("Compute proxy request failed", {
            code: String(error?.code || "COMPUTE_UPSTREAM_FAILED"),
            status: Number(error?.response?.status || 0) || null,
            message: String(error?.message || "Compute request failed").slice(0, 300)
        });
        if (isComputeTimeout(error)) {
            return res.status(504).json({
                ok: false,
                error: {
                    code: "COMPUTE_TIMEOUT",
                    message: "Compute exceeded its bounded response window. The request can be retried safely."
                }
            });
        }
        res.status(502).json({
            ok: false,
            error: {
                code: "COMPUTE_UPSTREAM_FAILED",
                message: "Compute could not complete the request."
            }
        });
    }
});

function getPathStartingWithABC(url) {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);

    for (let segment of pathSegments) {
        if (segment.startsWith("1v4r")) {
            return segment;
        }
    }
    return null;
}

module.exports = router;
