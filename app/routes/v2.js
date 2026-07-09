var express = require('express');
var router = express.Router();
const axios = require('axios');
console.log("vsRouter1");

// Allowlist of origins
const allowedOrigins = [
    "https://1var.com",
    "https://email.1var.com"
];

function applyCors(req, res) {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Vary", "Origin");
    }

    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, X-Original-Host, X-accessToken, X-AccessToken, X-access-token"
    );
}

// ---------- CORS Middleware ----------
router.use((req, res, next) => {
    console.log("setting up origins");
    applyCors(req, res);

    if (req.method === "OPTIONS") {
        console.log("END (preflight handled)");
        return res.status(204).end();
    }

    next();
});
// ------------------------------------

router.all('/*', async function(req, res, next) {
    console.log("vsRouter2aaa");
    console.log("req", req);

    try {
        const accessToken = req.cookies['accessToken'];

        applyCors(req, res);

        console.log("vsRouter3");
        const type = req.type; 
        console.log("req.path ==> ", req.apiGateway.event.path);
        const reqPath = req.apiGateway.event.path;
        console.log("req.headers", req.headers);
        console.log("req.apiGateway.event", req.apiGateway.event);
        const requestBody = req.body;
        console.log("requestBody", requestBody);
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
            });

            console.log("response", response);
            console.log("response.headers", response.headers);

            if (type === "url") {
                res.json(response.data);
            } else if (type === "cookies") {
                console.log("set cookies");
                const cookies = response.headers['set-cookie'];
                if (cookies) {
                    cookies.forEach(cookie => {
                        res.append('Set-Cookie', cookie);
                    });
                }

                console.log("response.data", response.data);
                if (typeof response.data === 'string') {
                    let ent = getPathStartingWithABC(originalHost);
                    res.send({"response":{"oai":{"html":response.data,"entity":ent}}});
                } else if (typeof response.data === "object") {
                    let ent = getPathStartingWithABC(originalHost);
                    console.log("originalHost", originalHost);
                    console.log("ent", ent);
                    console.log("response.data", response.data);
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
        console.error('Error calling compute.1var.com:', error);
        applyCors(req, res);

        const status = error?.response?.status || 500;
        const computeData = error?.response?.data;
        const payload = computeData !== undefined
            ? computeData
            : { error: error?.message || 'Server Error' };

        // Preserve the real compute status/body so the browser can show the useful error
        // instead of hiding it behind a generic API-layer 500.
        return res.status(status).send(payload);
    }
});

function getPathStartingWithABC(url) {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);

    console.log("pathSegments", pathSegments);
    for (let segment of pathSegments) {
        console.log("segment", segment);
        if (segment.startsWith("1v4r")) {
            return segment;
        }
    }
    return null;
}

module.exports = router;
