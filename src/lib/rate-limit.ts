import "server-only";

import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    limiter = null;
    return limiter;
  }

  limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "codemixed:api",
    analytics: false,
    enableTelemetry: false,
  });
  return limiter;
}

function unavailableResponse(): Response {
  return Response.json(
    { error: "Request protection is temporarily unavailable. Please try again later." },
    { status: 503 },
  );
}

export async function checkApiRateLimit(request: Request): Promise<Response | null> {
  const isProduction = process.env.NODE_ENV === "production";
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const rateLimiter = getLimiter();

  if (!rateLimiter) return isProduction ? unavailableResponse() : null;

  const clientIp = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!clientIp) return isProduction ? unavailableResponse() : null;

  const identifier = createHmac("sha256", redisToken!).update(clientIp).digest("hex");

  try {
    const result = await rateLimiter.limit(identifier);
    if (result.success) return null;

    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return Response.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  } catch {
    console.error("Distributed rate limiter unavailable");
    return isProduction ? unavailableResponse() : null;
  }
}