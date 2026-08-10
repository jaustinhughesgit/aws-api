const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const {
  COMPUTE_PROXY_TIMEOUT_MS,
  isComputeTimeout,
  isComputePayloadTooLarge,
  boundedTimeout,
} = require("../lib/computeProxyPolicy");

test("Compute proxy timeout leaves headroom for a CORS-enabled API response", () => {
  assert.equal(COMPUTE_PROXY_TIMEOUT_MS, 24_000);
  assert.equal(boundedTimeout("invalid"), 24_000);
  assert.equal(boundedTimeout(99_000), 25_000);
  assert.equal(isComputeTimeout({ code: "ECONNABORTED" }), true);
  assert.equal(isComputeTimeout({ code: "ETIMEDOUT" }), true);
  assert.equal(isComputeTimeout({ message: "timeout of 24000ms exceeded" }), true);
  assert.equal(isComputeTimeout({ code: "ECONNRESET" }), false);
  assert.equal(isComputePayloadTooLarge({ response: { status: 413 } }), true);
  assert.equal(isComputePayloadTooLarge({ response: { status: 500 } }), false);

  const source = fs.readFileSync(path.join(__dirname, "../routes/v2.js"), "utf8");
  assert.match(source, /timeout:\s*COMPUTE_PROXY_TIMEOUT_MS/);
  assert.match(source, /status\(504\)\.json/);
  assert.match(source, /COMPUTE_TIMEOUT/);
  assert.match(source, /status\(413\)\.json/);
  assert.match(source, /PAYLOAD_TOO_LARGE/);
  assert.doesNotMatch(source, /console\.log\((?:["'](?:req|requestBody|response)|req\b|response\b)/);
});
