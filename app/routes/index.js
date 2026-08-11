/**
 * Platform: Serves the API boundary's diagnostic landing page; product interaction stays in the browser application.
 * Technical: Express GET route that renders `home` with no proxy side effects.
 */
var express = require('express');
var router = express.Router();

router.get('/', async function(req, res, next){
    res.render('home', {title:'1 Var'})
});

module.exports = router;
