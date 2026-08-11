/**
 * Platform: Gives browsers and the headless test client one Compute identity transport contract.
 * Technical: Reads `accessToken` from the cookie first, then accepted `X-accessToken` header spellings; returns `null` when absent.
 */
"use strict";

function getAccessToken(req) {
    return req?.cookies?.accessToken
        || req?.get?.('X-accessToken')
        || req?.headers?.['x-accesstoken']
        || null;
}

module.exports = { getAccessToken };
