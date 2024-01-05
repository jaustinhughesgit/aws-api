var express = require('express');
var router = express.Router();
const axios = require('axios');
console.log("vsRouter1")
router.all('/*', async function(req, res, next) {
    console.log("vsRouter2")
    console.log("req",req)
    try {
        res.header('Access-Control-Allow-Origin', 'https://1var.com');
        res.header('Access-Control-Allow-Credentials', 'true');
        console.log("vsRouter3")
        const type = req.type; 
        console.log("req.path ==> ",req.apiGateway.event.path)
        reqPath = req.apiGateway.event.path
        const computeUrl = `https://compute.1var.com${reqPath}`;

        const longText = "This is a very long text that I want to send to my API...";
        const data = {
            text: longText
        };

        const response = await axios.post(computeUrl, { 
            credentials: 'include',
            method: 'POST', 
            body: JSON.stringify(data)
        });
        if (type === "url") {
            res.json(response.data);
        } else if (type === "cookies") {
            console.log("set cookies")
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                cookies.forEach(cookie => {
                    res.append('Set-Cookie', cookie);
                });
            }
            res.send(response.data);
        } else {
            res.status(400).send('Invalid type');
        }

    } catch (error) {
        console.error('Error calling compute.1var.com:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;