import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

// Simple in-memory rate limiters
const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const store: RateLimitStore = {};

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[key]) {
      store[key] = { count: 0, resetTime: now + windowMs };
    }

    if (now > store[key].resetTime) {
      store[key] = { count: 0, resetTime: now + windowMs };
    }

    store[key].count++;

    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', Math.max(0, maxRequests - store[key].count));
    res.setHeader('RateLimit-Reset', store[key].resetTime);

    if (store[key].count > maxRequests) {
      res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
      return;
    }

    next();
  };
};

// General API rate limiter - 100 requests per 15 minutes
export const generalLimiter = createRateLimiter(100, 15 * 60 * 1000);

// Authentication rate limiter - 5 attempts per 15 minutes per IP
export const authLimiter = createRateLimiter(5, 15 * 60 * 1000);

// Signup rate limiter - 3 new accounts per hour per IP
export const signupLimiter = createRateLimiter(3, 60 * 60 * 1000);

// Payment rate limiter - 10 payment attempts per 5 minutes
export const paymentLimiter = createRateLimiter(10, 5 * 60 * 1000);

// Order creation rate limiter - 20 orders per hour per user
export const orderLimiter = createRateLimiter(20, 60 * 60 * 1000);

// Review rate limiter - 10 reviews per 24 hours
export const reviewLimiter = createRateLimiter(10, 24 * 60 * 60 * 1000);

// Product search rate limiter - 50 searches per minute
export const searchLimiter = createRateLimiter(50, 60 * 1000);

