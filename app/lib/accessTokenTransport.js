"use strict";

function getAccessToken(req) {
    return req?.cookies?.accessToken
        || req?.get?.('X-accessToken')
        || req?.headers?.['x-accesstoken']
        || null;
}

module.exports = { getAccessToken };
