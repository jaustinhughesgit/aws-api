var express = require('express');
var router = express.Router();
const axios = require('axios');

router.get('/', async function(req, res, next) {
    try {
        res.header('Access-Control-Allow-Origin', 'http://1var.com'); // Replace with your client's URL
        res.header('Access-Control-Allow-Credentials', 'true');

        const computeUrl = 'https://compute.1var.com/cookies';
        const response = await axios.get(computeUrl, { withCredentials: true });

        const cookies = response.headers['set-cookie'];
        if (cookies) {
            cookies.forEach(cookie => {
                res.append('Set-Cookie', cookie);
            });
        }

        res.render('v2', { title: 'v2.3' });
    } catch (error) {
        console.error('Error calling compute.1var.com:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
