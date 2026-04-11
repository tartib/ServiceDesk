import jwt from 'jsonwebtoken';
import env from '../config/env';

// ── Canonical token payload ──────────────────────────────
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
}

function getRefreshSecret(): string {
  return env.JWT_REFRESH_SECRET || env.JWT_SECRET;
}

// ── Access token ─────────────────────────────────────────
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new Error('Invalid token');
  }
};

// ── Refresh token ────────────────────────────────────────
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: env.JWT_REFRESH_EXPIRE,
  } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, getRefreshSecret()) as TokenPayload;
  } catch {
    throw new Error('Invalid refresh token');
  }
};
