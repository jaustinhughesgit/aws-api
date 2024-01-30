const AWS = require('aws-sdk');
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const app = express();
const axios = require('axios');
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    next('route'); // Pass control to the next route
}, v2Router);

app.get("/auth*", async function(req, res, next){
    console.log("*****")
    res.header('Access-Control-Allow-Origin', 'https://1var.com');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Original-Host');
    const reqPath = req.apiGateway.event.path
    const reqBody = req.body;
    const accessToken = req.cookies.accessToken;
    if (req.method === 'GET' || req.method === 'POST') {
        console.log("reqPath",reqPath)
        console.log("reqBody",reqBody)
        console.log("accessToken",accessToken)
        const originalHost = req.headers['x-original-host'];
        const computeUrl = `https://compute.1var.com${reqPath}`;
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
        
        res.send(response.data);

    } else {
        res.send("")
    }
})

// Fallback route for other paths
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});
module.exports.handler = serverless(app);