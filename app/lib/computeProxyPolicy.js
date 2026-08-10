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

module.exports = {
  COMPUTE_PROXY_TIMEOUT_MS,
  isComputeTimeout,
  isComputePayloadTooLarge,
  boundedTimeout,
};
