const AWS = require('aws-sdk');
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const app = express();
const axios = require('axios');
const cookieParser = require('cookie-parser');

// ---------- CORS Middleware ----------
// Keep this BEFORE express.json()/urlencoded(), so malformed JSON and
// preflight failures still include CORS headers in the browser response.
const allowedOrigins = [
  "https://1var.com",
  "https://email.1var.com"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Vary", "Origin");
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Original-Host, X-accessToken, X-AccessToken, X-access-token, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});
// ------------------------------------

const API_BODY_LIMIT = String(process.env.API_BODY_LIMIT || '10mb').trim() || '10mb';

app.use(express.json({ limit: API_BODY_LIMIT }));
app.use(express.urlencoded({
  extended: true,
  limit: API_BODY_LIMIT,
  parameterLimit: 10000,
}));

// Give parser failures a useful response while preserving the CORS headers
// already set above.
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large' || Number(err?.status || err?.statusCode) === 413) {
    return res.status(413).json({
      error: 'Request body is too large',
      limit: API_BODY_LIMIT,
      detail: err?.message || 'Payload exceeded the API Lambda body-parser limit',
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON body',
      detail: err.message
    });
  }
  next(err);
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cookieParser());

var indexRouter = require('./routes/index');
var v2Router = require('./routes/v2');
app.use('/', indexRouter);

// Route for /cookies/* and /url/*
app.use('/:type(cookies|url)*', function(req, res, next) {
    console.log("req",req)
    console.log("req.params.type", req.params.type)
    req.type = req.params.type; // Capture the type (cookies or url)
    next(); // Continue into v2Router
}, v2Router);

app.all("/auth*", async function(req, res, next){
    console.log("*****");

    if (req.method === 'GET' || req.method === 'POST') {
        const reqPath = req.apiGateway.event.path;
        const reqBody = req.body.body;
        console.log("req.headers",req.headers);
        const accessToken = req.body.headers['X-accessToken'];
        const originalHost = req.body.headers['X-Original-Host'];
        const computeUrl = `https://compute.1var.com${reqPath}`;
        console.log("reqPath",reqPath);
        console.log("reqBody",reqBody);
        console.log("originalHost", originalHost);
        console.log("accessToken",accessToken);

        const response = await axios.post(computeUrl, { 
            withCredentials: true,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Original-Host': originalHost,
                'X-accessToken': accessToken
            },
            body: reqBody,
            responseType: 'arraybuffer'
        });

        const contentType = response.headers['content-type'];
        console.log("contentType", contentType);

        if (contentType === 'application/pdf') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
          res.send(response);
        } else {
          res.setHeader('Content-Type', contentType);
        }

        console.log("response.data~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        console.log("response.data", response);
        console.log("response.data", response.data);
        console.log("typeof", typeof response.data);
        console.log("response.status",response.status);
        console.log("response.config.url",response.config.url);
        console.log("response.request.res.responseUrl",response.request.res.responseUrl);

        if (!response.request.res.responseUrl.startsWith("https://compute.1var.com") && 
            !response.request.res.responseUrl.startsWith("https://abc.api.1var.com") && 
            !response.request.res.responseUrl.startsWith("https://1var.com")) {
            console.log("redirect");
            const redirectUrl = response.request.res.responseUrl;
            res.status(302).header('Location', redirectUrl).send();
        } else {
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                cookies.forEach(cookie => {
                    res.append('Set-Cookie', cookie);
                });
            }
            let resData = response.data;
            if (typeof response.data == "number"){
                resData = response.data.toString();
            }
            res.send(resData);
        }
    } else {
        res.send("");
    }
});

app.all("/blocks*", async function(req, res, next){
    console.log("*****");

    if (req.method === 'GET' || req.method === 'POST') {
        const reqPath = req.apiGateway.event.path;
        const reqBody = req.body.body;
        console.log("req.headers",req.headers);
        const accessToken = req.body.headers['X-accessToken'];
        const originalHost = req.body.headers['X-Original-Host'];
        const computeUrl = `https://compute.1var.com/${reqPath}`;
        console.log("reqPath",reqPath);
        console.log("reqBody",reqBody);
        console.log("originalHost", originalHost);
        console.log("accessToken",accessToken);

        const response = await axios.post(computeUrl, { 
            withCredentials: true,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Original-Host': originalHost,
                'X-accessToken': accessToken
            },
            body: reqBody
        });
        
        const cookies = response.headers['set-cookie'];
        if (cookies) {
            cookies.forEach(cookie => {
                res.append('Set-Cookie', cookie);
            });
        }
        console.log("response", response);
        console.log("response.data", response.data);
        console.log("typeof", typeof response.data);

        let resData = response.data;
        if (typeof response.data == "number"){
            resData = response.data.toString();
        }
        res.send(resData);

    } else {
        res.send("");
    }
});

// Fallback route for other paths
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});

module.exports.handler = serverless(app);
