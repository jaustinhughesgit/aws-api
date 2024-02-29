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

app.all("/auth*", async function(req, res, next){
    console.log("*****")
    res.header('Access-Control-Allow-Origin', 'https://1var.com');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Original-Host');

    if (req.method === 'GET' || req.method === 'POST') {
        const reqPath = req.apiGateway.event.path
        const reqBody = req.body.body;
        console.log("req.headers",req.headers)
        const accessToken = req.body.headers['X-accessToken'];
        const originalHost = req.body.headers['X-Original-Host'];
        const computeUrl = `https://compute.1var.com${reqPath}`;
        console.log("reqPath",reqPath)
        console.log("reqBody",reqBody)
        console.log("originalHost", originalHost)
        console.log("accessToken",accessToken)
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
        console.log("response.data", response.data);
        console.log("typeof", typeof response.data)
        let resData = response.data
        if (typeof response.data == "number"){
            resData = response.data.toString()
        }
        res.send(resData);

    } else {
        res.send("")
    }
})

app.all("/blocks*", async function(req, res, next){
    console.log("*****")
    res.header('Access-Control-Allow-Origin', 'https://1var.com');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Original-Host');

    if (req.method === 'GET' || req.method === 'POST') {
        const reqPath = req.apiGateway.event.path
        const reqBody = req.body.body;
        console.log("req.headers",req.headers)
        const accessToken = req.body.headers['X-accessToken'];
        const originalHost = req.body.headers['X-Original-Host'];
        const computeUrl = `https://compute.1var.com/blocks${reqPath}`;
        console.log("reqPath",reqPath)
        console.log("reqBody",reqBody)
        console.log("originalHost", originalHost)
        console.log("accessToken",accessToken)
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
        console.log("response.data", response.data);
        console.log("typeof", typeof response.data)
        let resData = response.data
        if (typeof response.data == "number"){
            resData = response.data.toString()
        }
        res.send(resData);

    } else {
        res.send("")
    }
})

// Fallback route for other paths
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});
module.exports.handler = serverless(app);