var express = require('express');
var router = express.Router();
const axios = require('axios');
console.log("vsRouter1")

router.all('/*', async function(req, res, next) {

    console.log("vsRouter2")
    console.log("req",req)
    try {
        const accessToken = req.cookies['accessToken'];
        res.header('Access-Control-Allow-Origin', 'https://1var.com');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'Content-Type, X-Original-Host');
        console.log("vsRouter3")
        const type = req.type; 
        console.log("req.path ==> ",req.apiGateway.event.path)
        reqPath = req.apiGateway.event.path
        console.log("req.headers", req.headers)
        console.log("req.apiGateway.event",req.apiGateway.event)
        const requestBody = req.body;
        console.log("requestBody",requestBody)
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
            console.log("response.headers",response.headers)
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
                console.log("response.data",response.data)
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