/**
 * CSRF Token Rotation Service
 * Implements automatic token rotation strategy for enhanced security
 */

import crypto from 'crypto';

// Simple logger utility
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};

interface TokenRotationConfig {
  rotationInterval: number; // milliseconds
  maxTokenAge: number; // milliseconds
  tokensPerSession: number; // max tokens to keep
}

interface TokenMetadata {
  token: string;
  createdAt: number;
  lastUsed: number;
  usageCount: number;
  isActive: boolean;
}

interface SessionTokens {
  tokens: Map<string, TokenMetadata>;
  sessionId: string;
  createdAt: number;
}

class CSRFTokenRotationService {
  private sessionTokens: Map<string, SessionTokens> = new Map();
  private config: TokenRotationConfig;
  private rotationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<TokenRotationConfig> = {}) {
    this.config = {
      rotationInterval: config.rotationInterval || 15 * 60 * 1000, // 15 minutes
      maxTokenAge: config.maxTokenAge || 60 * 60 * 1000, // 1 hour
      tokensPerSession: config.tokensPerSession || 3,
    };
  }

  /**
   * Generate a new CSRF token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Initialize token rotation for a session
   */
  initializeSession(sessionId: string): string {
    // Clean up old session if exists
    this.cleanupSession(sessionId);

    const token = this.generateToken();
    const now = Date.now();

    const sessionTokens: SessionTokens = {
      tokens: new Map(),
      sessionId,
      createdAt: now,
    };

    sessionTokens.tokens.set(token, {
      token,
      createdAt: now,
      lastUsed: now,
      usageCount: 0,
      isActive: true,
    });

    this.sessionTokens.set(sessionId, sessionTokens);

    // Start rotation timer
    this.startRotationTimer(sessionId);

    logger.info(`CSRF session initialized: ${sessionId}`);
    return token;
  }

  /**
   * Validate and refresh token if needed
   */
  validateAndRefresh(
    sessionId: string,
    token: string
  ): { valid: boolean; newToken?: string; shouldRotate: boolean } {
    const sessionTokens = this.sessionTokens.get(sessionId);

    if (!sessionTokens) {
      logger.warn(`Session not found for validation: ${sessionId}`);
      return { valid: false, shouldRotate: false };
    }

    const tokenMetadata = sessionTokens.tokens.get(token);

    if (!tokenMetadata) {
      logger.warn(`Token not found in session: ${sessionId}`);
      return { valid: false, shouldRotate: false };
    }

    if (!tokenMetadata.isActive) {
      logger.warn(`Token is inactive: ${sessionId}`);
      return { valid: false, shouldRotate: false };
    }

    const now = Date.now();
    const tokenAge = now - tokenMetadata.createdAt;

    // Check if token has expired
    if (tokenAge > this.config.maxTokenAge) {
      logger.warn(`Token expired: ${sessionId}`);
      tokenMetadata.isActive = false;
      return { valid: false, shouldRotate: true };
    }

    // Update usage
    tokenMetadata.lastUsed = now;
    tokenMetadata.usageCount++;

    // Check if rotation is needed (token is getting old)
    const shouldRotate = tokenAge > this.config.rotationInterval;

    let newToken: string | undefined;
    if (shouldRotate) {
      newToken = this.rotateToken(sessionId, token);
    }

    return { valid: true, newToken, shouldRotate };
  }

  /**
   * Rotate token (mark old as inactive, generate new)
   */
  private rotateToken(sessionId: string, oldToken: string): string {
    const sessionTokens = this.sessionTokens.get(sessionId);

    if (!sessionTokens) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Mark old token as inactive
    const oldMetadata = sessionTokens.tokens.get(oldToken);
    if (oldMetadata) {
      oldMetadata.isActive = false;
    }

    // Generate new token
    const newToken = this.generateToken();
    const now = Date.now();

    sessionTokens.tokens.set(newToken, {
      token: newToken,
      createdAt: now,
      lastUsed: now,
      usageCount: 0,
      isActive: true,
    });

    // Clean up old tokens if exceeding limit
    this.cleanupOldTokens(sessionId);

    logger.info(`Token rotated for session: ${sessionId}`);
    return newToken;
  }

  /**
   * Get active token for session
   */
  getActiveToken(sessionId: string): string | null {
    const sessionTokens = this.sessionTokens.get(sessionId);

    if (!sessionTokens) {
      return null;
    }

    // Return the most recently created active token
    let activeToken: TokenMetadata | null = null;
    let maxCreatedAt = 0;

    for (const metadata of sessionTokens.tokens.values()) {
      if (metadata.isActive && metadata.createdAt > maxCreatedAt) {
        activeToken = metadata;
        maxCreatedAt = metadata.createdAt;
      }
    }

    return activeToken ? activeToken.token : null;
  }

  /**
   * Get all active tokens for session
   */
  getActiveTokens(sessionId: string): string[] {
    const sessionTokens = this.sessionTokens.get(sessionId);

    if (!sessionTokens) {
      return [];
    }

    return Array.from(sessionTokens.tokens.values())
      .filter((metadata) => metadata.isActive)
      .map((metadata) => metadata.token);
  }

  /**
   * Clean up old tokens exceeding the limit
   */
  private cleanupOldTokens(sessionId: string): void {
    const sessionTokens = this.sessionTokens.get(sessionId);

    if (!sessionTokens) {
      return;
    }

    const activeTokens = Array.from(sessionTokens.tokens.values())
      .filter((metadata) => metadata.isActive)
      .sort((a, b) => b.createdAt - a.createdAt);

    // Keep only the configured number of tokens
    for (let i = this.config.tokensPerSession; i < activeTokens.length; i++) {
      activeTokens[i].isActive = false;
    }
  }

  /**
   * Start automatic rotation timer for session
   */
  private startRotationTimer(sessionId: string): void {
    // Clear existing timer if any
    const existingTimer = this.rotationTimers.get(sessionId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Set up new timer
    const timer = setInterval(() => {
      const sessionTokens = this.sessionTokens.get(sessionId);

      if (!sessionTokens) {
        clearInterval(timer);
        this.rotationTimers.delete(sessionId);
        return;
      }

      const activeToken = this.getActiveToken(sessionId);
      if (activeToken) {
        this.rotateToken(sessionId, activeToken);
      }
    }, this.config.rotationInterval);

    this.rotationTimers.set(sessionId, timer);
  }

  /**
   * Clean up session and its tokens
   */
  cleanupSession(sessionId: string): void {
    // Clear rotation timer
    const timer = this.rotationTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.rotationTimers.delete(sessionId);
    }

    // Remove session tokens
    this.sessionTokens.delete(sessionId);

    logger.info(`CSRF session cleaned up: ${sessionId}`);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    activeTokens: number;
    totalTokens: number;
    oldestToken: number | null;
    newestToken: number | null;
  } | null {
    const sessionTokens = this.sessionTokens.get(sessionId);

    if (!sessionTokens) {
      return null;
    }

    const tokens = Array.from(sessionTokens.tokens.values());
    const activeTokens = tokens.filter((t) => t.isActive);
    const createdAts = tokens.map((t) => t.createdAt);

    return {
      activeTokens: activeTokens.length,
      totalTokens: tokens.length,
      oldestToken: createdAts.length > 0 ? Math.min(...createdAts) : null,
      newestToken: createdAts.length > 0 ? Math.max(...createdAts) : null,
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const sessionsToCleanup: string[] = [];

    for (const [sessionId, sessionTokens] of this.sessionTokens.entries()) {
      const sessionAge = now - sessionTokens.createdAt;

      // Clean up sessions older than max token age
      if (sessionAge > this.config.maxTokenAge) {
        sessionsToCleanup.push(sessionId);
      }
    }

    for (const sessionId of sessionsToCleanup) {
      this.cleanupSession(sessionId);
    }

    if (sessionsToCleanup.length > 0) {
      logger.info(`Cleaned up ${sessionsToCleanup.length} expired CSRF sessions`);
    }
  }
}

// Export singleton instance
export const csrfTokenRotationService = new CSRFTokenRotationService();

export default CSRFTokenRotationService;
