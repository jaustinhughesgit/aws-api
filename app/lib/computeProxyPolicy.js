/**
 * Platform: Keeps upstream failures typed so clients can retry jobs or split Path batches safely.
 * Technical: Bounds Compute timeouts and preserves only sanitized, intentional 4xx error envelopes from Compute.
 */
"use strict";

function boundedTimeout(value, fallback = 24_000) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(1_000, Math.min(25_000, Math.trunc(number)))
    : fallback;
}

const COMPUTE_PROXY_TIMEOUT_MS = boundedTimeout(
  process.env.COMPUTE_PROXY_TIMEOUT_MS
);

function isComputeTimeout(error) {
  return error?.code === "ECONNABORTED"
    || error?.code === "ETIMEDOUT"
    || /timeout/i.test(String(error?.message || ""));
}

function isComputePayloadTooLarge(error) {
  return Number(error?.response?.status || 0) === 413;
}

function boundedErrorText(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sanitizedComputeClientError(error) {
  const status = Number(error?.response?.status || 0);
  if (status < 400 || status > 499 || status === 413) return null;
  const data = error?.response?.data;
  if (!data || typeof data !== "object" || data.ok !== false) return null;
  const source = data.error;
  const message = boundedErrorText(
    typeof source === "string" ? source : source?.message
  );
  if (!message) return null;
  const requestedCode = boundedErrorText(source?.code, 64);
  const code = /^[A-Z][A-Z0-9_]{1,63}$/.test(requestedCode)
    ? requestedCode
    : "COMPUTE_REQUEST_REJECTED";
  return {
    status,
    body: { ok: false, error: { code, message } },
  };
}

module.exports = {
  COMPUTE_PROXY_TIMEOUT_MS,
  isComputeTimeout,
  isComputePayloadTooLarge,
  sanitizedComputeClientError,
  boundedTimeout,
};
