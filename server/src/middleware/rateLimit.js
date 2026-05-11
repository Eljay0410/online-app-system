const buckets = new Map();

function getClientKey(req, keyPrefix) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  const ip = forwardedFor || req.ip || req.socket?.remoteAddress || "unknown";
  const email = String(req.body?.email || "").trim().toLowerCase();

  return `${keyPrefix}:${ip}:${email}`;
}

export function rateLimit({
  windowMs,
  max,
  message = "Too many attempts. Please try again later.",
  keyPrefix = "default",
}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req, keyPrefix);
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);

      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
    }

    return next();
  };
}
