"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { getAccessToken } = require("../lib/accessTokenTransport");

test("browser cookie remains the preferred access-token transport", () => {
  assert.equal(getAccessToken({ cookies: { accessToken: "cookie-token" }, get: () => "header-token", headers: {} }), "cookie-token");
});

test("headless clients may use the already allow-listed access-token header", () => {
  assert.equal(getAccessToken({ cookies: {}, get: (name) => name === "X-accessToken" ? "header-token" : undefined, headers: {} }), "header-token");
  assert.equal(getAccessToken({ cookies: {}, headers: { "x-accesstoken": "lower-token" } }), "lower-token");
});
