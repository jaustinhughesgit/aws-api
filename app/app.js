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
app.use('/:type(cookies|url)', function(req, res, next) {

    const originalHost = req.headers['x-forwarded-host'];
    console.log("originalHost2",originalHost)
    req.type = req.params.type; // Capture the type (cookies or url)
    next('route'); // Pass control to the next route
}, v2Router);

// Fallback route for other paths
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});
module.exports.handler = serverless(app);