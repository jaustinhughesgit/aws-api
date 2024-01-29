var express = require('express');
var router = express.Router();
const axios = require('axios');
const bodyParser = require('body-parser');

router.use(bodyParser.json());
router.all('/*', async function(req, res, next) {
    try {
        const accessToken = req.cookies['accessToken'];
        console.log("accessToken", accessToken)
        res.header('Access-Control-Allow-Origin', 'https://1var.com');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'Content-Type, X-Original-Host');
        const type = req.type; 
        reqPath = req.apiGateway.event.path
        const requestBody = req.body;
        const originalHost = req.headers['x-original-host'];
        if (req.method === 'GET' || req.method === 'POST') {
            const computeUrl = `https://compute.1var.com${reqPath}`;
            const response = await axios.post(computeUrl, { 
                withCredentials: true,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Original-Host': originalHost,
                    'X-accessToken': accessToken
                },
                body: requestBody
            });
            console.log("response",response)
            if (type === "url") {
                res.json(response.data);
            } else if (type === "cookies") {
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
        } else {
            res.send("")
        }

    } catch (error) {
        console.error('Error calling compute.1var.com:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;