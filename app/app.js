const AWS = require('aws-sdk');
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
var indexRouter = require('./routes/index');
var v2Router = require('./routes/v2');
app.use('/', indexRouter);
// Route for /cookies/* and /url/*
app.use('/:type(cookies|url)*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'https://1var.com');
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log("req",req)
    req.type = req.params.type; // Capture the type (cookies or url)
    next('route'); // Pass control to the next route
}, v2Router);

// Fallback route for other paths
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});
module.exports.handler = serverless(app);