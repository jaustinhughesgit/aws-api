const AWS = require('aws-sdk');
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const app = express();
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
    req.type = req.params.type; // Capture the type (cookies or url)
    next('route'); // Pass control to the next route
}, v2Router);

// Fallback route for other paths
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});
module.exports.handler = serverless(app);