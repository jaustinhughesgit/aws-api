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
app.use('/:type(cookies|url)/*', function(req, res, next) {
    req.type = req.params.type; // Capture the type (cookies or url)
    next();
}, v2Router);
module.exports.handler = serverless(app);