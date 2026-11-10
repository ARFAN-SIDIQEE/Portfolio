import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface Bucket { count: number; resetAt: number }

/** Small in-memory fixed-window counter. Fine for a single API instance; use Redis if you scale out. */
export class WindowCounter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly limit: number, private readonly windowMs: number) {
    setInterval(() => this.prune(), Math.max(windowMs, 60_000)).unref();
  }

  private bucket(key: string, now = Date.now()): Bucket | undefined {
    const bucket = this.buckets.get(key);
    if (bucket && bucket.resetAt <= now) {
      this.buckets.delete(key);
      return undefined;
    }
    return bucket;
  }

  /** Seconds to wait if `key` is over the limit, otherwise 0. */
  retryAfter(key: string): number {
    const bucket = this.bucket(key);
    return bucket && bucket.count >= this.limit ? Math.ceil((bucket.resetAt - Date.now()) / 1000) : 0;
  }

  hit(key: string) {
    const now = Date.now();
    const bucket = this.bucket(key, now) ?? { count: 0, resetAt: now + this.windowMs };
    bucket.count += 1;
    this.buckets.set(key, bucket);
  }

  reset(key: string) {
    this.buckets.delete(key);
  }

  private prune() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) if (bucket.resetAt <= now) this.buckets.delete(key);
  }
}

export function tooManyRequests(retryAfterSeconds: number, message: string) {
  return new HttpException({ statusCode: 429, message, retryAfter: retryAfterSeconds }, HttpStatus.TOO_MANY_REQUESTS);
}

/**
 * Throttles failed admin logins: per client IP, per username, and globally
 * (the global cap slows distributed guessing). A successful login clears that IP/username.
 */
@Injectable()
export class LoginThrottle {
  private readonly perIp = new WindowCounter(Number(process.env.LOGIN_MAX_ATTEMPTS) || 5, 15 * 60_000);
  private readonly perUser = new WindowCounter(10, 15 * 60_000);
  private readonly global = new WindowCounter(50, 15 * 60_000);

  assertAllowed(ip: string, username: string) {
    const wait = Math.max(this.perIp.retryAfter(ip), this.perUser.retryAfter(username.toLowerCase()), this.global.retryAfter('*'));
    if (wait > 0) throw tooManyRequests(wait, `Too many failed login attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`);
  }

  recordFailure(ip: string, username: string) {
    this.perIp.hit(ip);
    this.perUser.hit(username.toLowerCase());
    this.global.hit('*');
  }

  recordSuccess(ip: string, username: string) {
    this.perIp.reset(ip);
    this.perUser.reset(username.toLowerCase());
  }
}

/** Express middleware: coarse per-IP request cap for the whole API. */
export function apiRateLimiter(limit = Number(process.env.API_RATE_LIMIT) || 300, windowMs = 60_000) {
  const counter = new WindowCounter(limit, windowMs);
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const wait = counter.retryAfter(key);
    if (wait > 0) {
      res.setHeader('Retry-After', String(wait));
      return res.status(429).json({ statusCode: 429, message: 'Too many requests. Please slow down.', retryAfter: wait });
    }
    counter.hit(key);
    next();
  };
}
