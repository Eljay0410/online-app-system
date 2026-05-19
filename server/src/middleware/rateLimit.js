import { createHash } from "crypto";
import pool from "../config/db.js";

const fallbackBuckets = new Map();
let lastFallbackCleanupAt = 0;
let lastDbCleanupAt = 0;

function envInt(name, fallback) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function hashKey(value) {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function getBodyIdentity(req) {
  return (
    normalize(req.body?.email) ||
    normalize(req.body?.username) ||
    normalize(req.body?.uan) ||
    normalize(req.query?.email) ||
    normalize(req.query?.token)
  );
}

function buildClientKey(
  req,
  { includeBodyIdentity = true, includePath = false } = {}
) {
  const parts = [`ip:${getClientIp(req)}`];

  if (req.user?.id) {
    parts.push(`user:${req.user.id}`);
  } else if (includeBodyIdentity) {
    const identity = getBodyIdentity(req);
    if (identity) parts.push(`identity:${identity}`);
  }

  if (includePath) {
    parts.push(`path:${req.baseUrl || ""}${req.route?.path || req.path}`);
  }

  return parts.join("|");
}

function setRateLimitHeaders(res, { count, max, resetAt }) {
  const resetSeconds = Math.max(
    0,
    Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000)
  );
  const remaining = Math.max(max - count, 0);

  res.set("RateLimit-Limit", String(max));
  res.set("RateLimit-Remaining", String(remaining));
  res.set("RateLimit-Reset", String(resetSeconds));
  res.set("X-RateLimit-Limit", String(max));
  res.set("X-RateLimit-Remaining", String(remaining));
  res.set("X-RateLimit-Reset", String(resetSeconds));

  return resetSeconds;
}

function cleanupFallbackBuckets(now) {
  if (now - lastFallbackCleanupAt < 60 * 1000) return;

  for (const [key, bucket] of fallbackBuckets.entries()) {
    if (bucket.resetAt <= now) {
      fallbackBuckets.delete(key);
    }
  }

  lastFallbackCleanupAt = now;
}

function consumeFallbackBucket(key, windowMs) {
  const now = Date.now();
  cleanupFallbackBuckets(now);

  const bucket = fallbackBuckets.get(key) || {
    count: 0,
    resetAt: now + windowMs,
  };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  fallbackBuckets.set(key, bucket);

  return {
    count: bucket.count,
    resetAt: new Date(bucket.resetAt).toISOString(),
  };
}

async function cleanupDbBuckets() {
  const now = Date.now();
  if (now - lastDbCleanupAt < 60 * 60 * 1000) return;

  lastDbCleanupAt = now;
  await pool
    .query(
      "DELETE FROM rate_limit_buckets WHERE reset_at < NOW() - INTERVAL '1 day'"
    )
    .catch((error) => {
      console.error("Rate limit cleanup failed:", error?.message || error);
    });
}

async function consumeDbBucket({ keyPrefix, keyHash, windowMs }) {
  await cleanupDbBuckets();

  const result = await pool.query(
    `INSERT INTO rate_limit_buckets (
       key_prefix,
       key_hash,
       count,
       reset_at,
       first_seen_at,
       updated_at
     )
     VALUES (
       $1,
       $2,
       1,
       NOW() + ($3::int * INTERVAL '1 millisecond'),
       NOW(),
       NOW()
     )
     ON CONFLICT (key_prefix, key_hash)
     DO UPDATE SET
       count = CASE
         WHEN rate_limit_buckets.reset_at <= NOW() THEN 1
         ELSE rate_limit_buckets.count + 1
       END,
       reset_at = CASE
         WHEN rate_limit_buckets.reset_at <= NOW()
           THEN NOW() + ($3::int * INTERVAL '1 millisecond')
         ELSE rate_limit_buckets.reset_at
       END,
       first_seen_at = CASE
         WHEN rate_limit_buckets.reset_at <= NOW() THEN NOW()
         ELSE rate_limit_buckets.first_seen_at
       END,
       updated_at = NOW()
     RETURNING count, reset_at`,
    [keyPrefix, keyHash, windowMs]
  );

  return result.rows[0];
}

export function rateLimit({
  windowMs,
  max,
  message = "Too many attempts. Please try again later.",
  keyPrefix = "default",
  keyGenerator,
  includeBodyIdentity = true,
  includePath = false,
}) {
  return async (req, res, next) => {
    const rawKey = keyGenerator
      ? keyGenerator(req)
      : buildClientKey(req, { includeBodyIdentity, includePath });
    const keyHash = hashKey(`${keyPrefix}:${rawKey}`);
    let bucket;

    try {
      bucket = await consumeDbBucket({ keyPrefix, keyHash, windowMs });
    } catch (error) {
      console.error("Rate limit store unavailable:", error?.message || error);
      bucket = consumeFallbackBucket(`${keyPrefix}:${keyHash}`, windowMs);
    }

    const resetSeconds = setRateLimitHeaders(res, {
      count: bucket.count,
      max,
      resetAt: bucket.reset_at || bucket.resetAt,
    });

    if (bucket.count > max) {
      res.set("Retry-After", String(resetSeconds));
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: resetSeconds,
      });
    }

    return next();
  };
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envInt("RATE_LIMIT_API_MAX", 600),
  keyPrefix: "api",
  includeBodyIdentity: false,
  message: "Too many requests. Please slow down and try again later.",
});

export const authLimiters = {
  register: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: envInt("RATE_LIMIT_REGISTER_MAX", 8),
    keyPrefix: "auth:register",
    message: "Too many registration attempts. Please try again in 1 hour.",
  }),
  login: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: envInt("RATE_LIMIT_LOGIN_MAX", 5),
    keyPrefix: "auth:login",
    message: "Too many login attempts. Please try again in 15 minutes.",
  }),
  emailLookup: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: envInt("RATE_LIMIT_EMAIL_LOOKUP_MAX", 12),
    keyPrefix: "auth:email-lookup",
    message: "Too many login attempts. Please try again in 15 minutes.",
  }),
  emailAction: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: envInt("RATE_LIMIT_EMAIL_ACTION_MAX", 5),
    keyPrefix: "auth:email-action",
    message: "Too many email requests. Please try again in 1 hour.",
  }),
  activation: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: envInt("RATE_LIMIT_ACTIVATION_MAX", 20),
    keyPrefix: "auth:activation",
    message: "Too many verification attempts. Please try again in 15 minutes.",
  }),
};

export const authenticatedWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envInt("RATE_LIMIT_AUTH_WRITE_MAX", 120),
  keyPrefix: "auth-write",
  includeBodyIdentity: false,
  includePath: true,
  message: "Too many changes submitted. Please try again later.",
});
