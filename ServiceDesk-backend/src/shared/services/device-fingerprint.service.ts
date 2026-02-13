/**
 * Device Fingerprinting Service
 * Creates and validates device fingerprints for enhanced CSRF protection
 */

import crypto from 'crypto';

interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  acceptLanguage: string;
  acceptEncoding: string;
}

interface DeviceFingerprint {
  fingerprint: string;
  createdAt: number;
  lastSeen: number;
  isVerified: boolean;
  usageCount: number;
}

interface SessionDeviceMap {
  sessionId: string;
  fingerprints: Map<string, DeviceFingerprint>;
  primaryFingerprint: string | null;
}

class DeviceFingerprintService {
  private sessionDevices: Map<string, SessionDeviceMap> = new Map();
  private fingerprintCache: Map<string, DeviceFingerprint> = new Map();

  /**
   * Generate device fingerprint from request headers
   */
  generateFingerprint(deviceInfo: DeviceInfo): string {
    const data = `${deviceInfo.userAgent}|${deviceInfo.ipAddress}|${deviceInfo.acceptLanguage}|${deviceInfo.acceptEncoding}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Extract device info from request
   */
  extractDeviceInfo(req: any): DeviceInfo {
    const userAgent = req.get('user-agent') || 'unknown';
    const ipAddress = this.getClientIp(req);
    const acceptLanguage = req.get('accept-language') || 'unknown';
    const acceptEncoding = req.get('accept-encoding') || 'unknown';

    return {
      userAgent,
      ipAddress,
      acceptLanguage,
      acceptEncoding,
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(req: any): string {
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * Register device for session
   */
  registerDevice(sessionId: string, deviceInfo: DeviceInfo): string {
    const fingerprint = this.generateFingerprint(deviceInfo);
    const now = Date.now();

    // Get or create session device map
    let sessionDevice = this.sessionDevices.get(sessionId);
    if (!sessionDevice) {
      sessionDevice = {
        sessionId,
        fingerprints: new Map(),
        primaryFingerprint: null,
      };
      this.sessionDevices.set(sessionId, sessionDevice);
    }

    // Check if fingerprint already exists
    let deviceFingerprint = sessionDevice.fingerprints.get(fingerprint);
    if (!deviceFingerprint) {
      deviceFingerprint = {
        fingerprint,
        createdAt: now,
        lastSeen: now,
        isVerified: false,
        usageCount: 0,
      };
      sessionDevice.fingerprints.set(fingerprint, deviceFingerprint);
    }

    // Update last seen
    deviceFingerprint.lastSeen = now;
    deviceFingerprint.usageCount++;

    // Set as primary if first device
    if (!sessionDevice.primaryFingerprint) {
      sessionDevice.primaryFingerprint = fingerprint;
      deviceFingerprint.isVerified = true;
    }

    // Cache fingerprint
    this.fingerprintCache.set(fingerprint, deviceFingerprint);

    return fingerprint;
  }

  /**
   * Verify device fingerprint for session
   */
  verifyDevice(
    sessionId: string,
    fingerprint: string
  ): { valid: boolean; isTrusted: boolean; isNew: boolean } {
    const sessionDevice = this.sessionDevices.get(sessionId);

    if (!sessionDevice) {
      return { valid: false, isTrusted: false, isNew: true };
    }

    const deviceFingerprint = sessionDevice.fingerprints.get(fingerprint);

    if (!deviceFingerprint) {
      return { valid: false, isTrusted: false, isNew: true };
    }

    const isTrusted = deviceFingerprint.isVerified;
    const isNew = deviceFingerprint.usageCount === 1;

    return { valid: true, isTrusted, isNew };
  }

  /**
   * Trust device for session
   */
  trustDevice(sessionId: string, fingerprint: string): boolean {
    const sessionDevice = this.sessionDevices.get(sessionId);

    if (!sessionDevice) {
      return false;
    }

    const deviceFingerprint = sessionDevice.fingerprints.get(fingerprint);

    if (!deviceFingerprint) {
      return false;
    }

    deviceFingerprint.isVerified = true;
    return true;
  }

  /**
   * Get all trusted devices for session
   */
  getTrustedDevices(sessionId: string): string[] {
    const sessionDevice = this.sessionDevices.get(sessionId);

    if (!sessionDevice) {
      return [];
    }

    return Array.from(sessionDevice.fingerprints.values())
      .filter((device) => device.isVerified)
      .map((device) => device.fingerprint);
  }

  /**
   * Get all devices for session
   */
  getAllDevices(sessionId: string): string[] {
    const sessionDevice = this.sessionDevices.get(sessionId);

    if (!sessionDevice) {
      return [];
    }

    return Array.from(sessionDevice.fingerprints.keys());
  }

  /**
   * Remove device from session
   */
  removeDevice(sessionId: string, fingerprint: string): boolean {
    const sessionDevice = this.sessionDevices.get(sessionId);

    if (!sessionDevice) {
      return false;
    }

    const removed = sessionDevice.fingerprints.delete(fingerprint);

    // If primary fingerprint was removed, set new primary
    if (removed && sessionDevice.primaryFingerprint === fingerprint) {
      const remaining = Array.from(sessionDevice.fingerprints.values());
      if (remaining.length > 0) {
        sessionDevice.primaryFingerprint = remaining[0].fingerprint;
      } else {
        sessionDevice.primaryFingerprint = null;
      }
    }

    return removed;
  }

  /**
   * Check if device is suspicious (different from primary)
   */
  isSuspiciousDevice(sessionId: string, fingerprint: string): boolean {
    const sessionDevice = this.sessionDevices.get(sessionId);

    if (!sessionDevice || !sessionDevice.primaryFingerprint) {
      return false;
    }

    // Device is suspicious if it's different from primary and not verified
    if (fingerprint !== sessionDevice.primaryFingerprint) {
      const deviceFingerprint = sessionDevice.fingerprints.get(fingerprint);
      return !deviceFingerprint || !deviceFingerprint.isVerified;
    }

    return false;
  }

  /**
   * Get device statistics
   */
  getDeviceStats(sessionId: string): {
    totalDevices: number;
    trustedDevices: number;
    primaryDevice: string | null;
    lastActivity: number | null;
  } | null {
    const sessionDevice = this.sessionDevices.get(sessionId);

    if (!sessionDevice) {
      return null;
    }

    const devices = Array.from(sessionDevice.fingerprints.values());
    const trustedDevices = devices.filter((d) => d.isVerified).length;
    const lastActivity = devices.length > 0 ? Math.max(...devices.map((d) => d.lastSeen)) : null;

    return {
      totalDevices: devices.length,
      trustedDevices,
      primaryDevice: sessionDevice.primaryFingerprint,
      lastActivity,
    };
  }

  /**
   * Clean up session devices
   */
  cleanupSession(sessionId: string): void {
    const sessionDevice = this.sessionDevices.get(sessionId);

    if (sessionDevice) {
      // Remove from cache
      for (const fingerprint of sessionDevice.fingerprints.keys()) {
        this.fingerprintCache.delete(fingerprint);
      }

      // Remove session
      this.sessionDevices.delete(sessionId);
    }
  }

  /**
   * Clean up old fingerprints
   */
  cleanupOldFingerprints(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const fingerprintsToRemove: string[] = [];

    for (const [fingerprint, device] of this.fingerprintCache.entries()) {
      if (now - device.lastSeen > maxAge) {
        fingerprintsToRemove.push(fingerprint);
      }
    }

    for (const fingerprint of fingerprintsToRemove) {
      this.fingerprintCache.delete(fingerprint);
    }
  }
}

// Export singleton instance
export const deviceFingerprintService = new DeviceFingerprintService();

export default DeviceFingerprintService;
