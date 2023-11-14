var express = require('express');
var router = express.Router();
const axios = require('axios');

router.get('/', async function(req, res, next) {
    try {
        res.header('Access-Control-Allow-Origin', 'https://1var.com'); // Replace with your client's URL
        res.header('Access-Control-Allow-Credentials', 'true');
        const type = req.type; // Get the type from the request
        const computeUrl = `https://compute.1var.com/${type}`;
        console.log("type", type);
        const response = await axios.get(computeUrl, { withCredentials: true });

        if (type === "url") {
            // Assuming the response from computeUrl is the data you want to send as JSON
            res.json(response.data);
        } else if (type === "cookies") {
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                cookies.forEach(cookie => {
                    res.append('Set-Cookie', cookie);
                });
            }
            res.render('v2', { title: 'v2.3' });
        } else {
            // Handle unexpected type
            res.status(400).send('Invalid type');
        }

    } catch (error) {
        console.error('Error calling compute.1var.com:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;