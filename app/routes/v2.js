var express = require('express');
var router = express.Router();
const axios = require('axios');

router.get('/', async function(req, res, next) {
    try {
        // Replace this URL with the actual URL of compute.1var.com
        const computeUrl = 'https://compute.1var.com/cookies';
        const response = await axios.get(computeUrl, { withCredentials: true });

        // Forward the cookies received from compute.1var.com to the user
        console.log("a")
        const cookies = response.headers['set-cookie'];
        console.log("b")
        if (cookies) {
            console.log("c")
            cookies.forEach(cookie => {
                console.log(cookie)
                res.setHeader('Set-Cookie', cookie);
            });
        }

        res.render('v2', { title: 'v2.1' });
    } catch (error) {
        console.error('Error calling compute.1var.com:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;