import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import env from '../config/env';

const isTest = env.NODE_ENV === 'test';

const noopLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

export const apiLimiter = isTest
  ? noopLimiter
  : rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes
      max: env.RATE_LIMIT_MAX_REQUESTS, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

export const authLimiter = isTest
  ? noopLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 login requests per windowMs
      message: 'Too many login attempts, please try again later.',
      skipSuccessfulRequests: true,
    });
