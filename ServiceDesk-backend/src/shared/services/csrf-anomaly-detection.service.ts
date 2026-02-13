/**
 * CSRF Anomaly Detection Service
 * Detects suspicious patterns in CSRF token usage
 */

interface AnomalyMetrics {
  sessionId: string;
  tokenValidationAttempts: number;
  failedValidations: number;
  successfulValidations: number;
  averageTimePerRequest: number;
  requestsPerMinute: number;
  lastValidationTime: number;
  suspiciousPatterns: string[];
}

interface RequestMetrics {
  timestamp: number;
  success: boolean;
  duration: number;
  deviceFingerprint?: string;
  ipAddress?: string;
}

interface SessionAnomalies {
  sessionId: string;
  metrics: AnomalyMetrics;
  requestHistory: RequestMetrics[];
  suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAnalyzed: number;
}

class CSRFAnomalyDetectionService {
  private sessionAnomalies: Map<string, SessionAnomalies> = new Map();
  private readonly MAX_HISTORY_SIZE = 100;
  private readonly FAILURE_THRESHOLD = 0.3; // 30% failure rate
  private readonly REQUEST_RATE_THRESHOLD = 100; // requests per minute
  private readonly ANALYSIS_INTERVAL = 60 * 1000; // 1 minute

  /**
   * Record a CSRF validation attempt
   */
  recordValidationAttempt(
    sessionId: string,
    success: boolean,
    duration: number,
    deviceFingerprint?: string,
    ipAddress?: string
  ): void {
    let sessionAnomaly = this.sessionAnomalies.get(sessionId);

    if (!sessionAnomaly) {
      sessionAnomaly = {
        sessionId,
        metrics: {
          sessionId,
          tokenValidationAttempts: 0,
          failedValidations: 0,
          successfulValidations: 0,
          averageTimePerRequest: 0,
          requestsPerMinute: 0,
          lastValidationTime: Date.now(),
          suspiciousPatterns: [],
        },
        requestHistory: [],
        suspicionLevel: 'low',
        lastAnalyzed: Date.now(),
      };
      this.sessionAnomalies.set(sessionId, sessionAnomaly);
    }

    const metrics = sessionAnomaly.metrics;
    const now = Date.now();

    // Update metrics
    metrics.tokenValidationAttempts++;
    if (success) {
      metrics.successfulValidations++;
    } else {
      metrics.failedValidations++;
    }

    // Update average time
    const totalTime = metrics.averageTimePerRequest * (metrics.tokenValidationAttempts - 1) + duration;
    metrics.averageTimePerRequest = totalTime / metrics.tokenValidationAttempts;
    metrics.lastValidationTime = now;

    // Add to request history
    sessionAnomaly.requestHistory.push({
      timestamp: now,
      success,
      duration,
      deviceFingerprint,
      ipAddress,
    });

    // Keep history size manageable
    if (sessionAnomaly.requestHistory.length > this.MAX_HISTORY_SIZE) {
      sessionAnomaly.requestHistory.shift();
    }

    // Analyze for anomalies
    this.analyzeAnomalies(sessionId);
  }

  /**
   * Analyze session for anomalies
   */
  private analyzeAnomalies(sessionId: string): void {
    const sessionAnomaly = this.sessionAnomalies.get(sessionId);

    if (!sessionAnomaly) {
      return;
    }

    const now = Date.now();
    const metrics = sessionAnomaly.metrics;
    const history = sessionAnomaly.requestHistory;

    // Only analyze at intervals
    if (now - sessionAnomaly.lastAnalyzed < this.ANALYSIS_INTERVAL) {
      return;
    }

    sessionAnomaly.lastAnalyzed = now;
    metrics.suspiciousPatterns = [];

    // Check failure rate
    if (metrics.tokenValidationAttempts > 0) {
      const failureRate = metrics.failedValidations / metrics.tokenValidationAttempts;
      if (failureRate > this.FAILURE_THRESHOLD) {
        metrics.suspiciousPatterns.push(`High failure rate: ${(failureRate * 100).toFixed(2)}%`);
      }
    }

    // Check request rate
    const recentRequests = history.filter((r) => now - r.timestamp < 60 * 1000);
    metrics.requestsPerMinute = recentRequests.length;

    if (metrics.requestsPerMinute > this.REQUEST_RATE_THRESHOLD) {
      metrics.suspiciousPatterns.push(
        `Excessive request rate: ${metrics.requestsPerMinute} requests/minute`
      );
    }

    // Check for rapid repeated failures
    const recentFailures = recentRequests.filter((r) => !r.success);
    if (recentFailures.length >= 5) {
      metrics.suspiciousPatterns.push(`Rapid repeated failures: ${recentFailures.length} in last minute`);
    }

    // Check for unusual timing patterns
    if (history.length >= 3) {
      const timingPatterns = this.detectTimingPatterns(history);
      if (timingPatterns.length > 0) {
        metrics.suspiciousPatterns.push(...timingPatterns);
      }
    }

    // Check for device switching
    const uniqueDevices = new Set(history.map((r) => r.deviceFingerprint).filter(Boolean));
    if (uniqueDevices.size > 3) {
      metrics.suspiciousPatterns.push(`Multiple device switches: ${uniqueDevices.size} devices`);
    }

    // Check for IP switching
    const uniqueIPs = new Set(history.map((r) => r.ipAddress).filter(Boolean));
    if (uniqueIPs.size > 2) {
      metrics.suspiciousPatterns.push(`Multiple IP addresses: ${uniqueIPs.size} IPs`);
    }

    // Determine suspicion level
    this.updateSuspicionLevel(sessionAnomaly);
  }

  /**
   * Detect unusual timing patterns
   */
  private detectTimingPatterns(history: RequestMetrics[]): string[] {
    const patterns: string[] = [];

    if (history.length < 3) {
      return patterns;
    }

    // Calculate intervals between requests
    const intervals: number[] = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i].timestamp - history[i - 1].timestamp);
    }

    // Check for suspiciously fast requests
    const veryFastRequests = intervals.filter((i) => i < 100); // less than 100ms
    if (veryFastRequests.length >= 3) {
      patterns.push(`Suspiciously fast requests: ${veryFastRequests.length} requests < 100ms apart`);
    }

    // Check for unusual consistency (bot-like behavior)
    if (intervals.length >= 5) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // Very low variance suggests bot-like behavior
      if (stdDev < avgInterval * 0.1) {
        patterns.push(`Suspicious timing consistency: stdDev=${stdDev.toFixed(2)}ms`);
      }
    }

    return patterns;
  }

  /**
   * Update suspicion level based on patterns
   */
  private updateSuspicionLevel(sessionAnomaly: SessionAnomalies): void {
    const patterns = sessionAnomaly.metrics.suspiciousPatterns.length;

    if (patterns === 0) {
      sessionAnomaly.suspicionLevel = 'low';
    } else if (patterns === 1) {
      sessionAnomaly.suspicionLevel = 'medium';
    } else if (patterns <= 3) {
      sessionAnomaly.suspicionLevel = 'high';
    } else {
      sessionAnomaly.suspicionLevel = 'critical';
    }
  }

  /**
   * Get anomaly report for session
   */
  getAnomalyReport(sessionId: string): SessionAnomalies | null {
    return this.sessionAnomalies.get(sessionId) || null;
  }

  /**
   * Check if session is suspicious
   */
  isSuspicious(sessionId: string): boolean {
    const sessionAnomaly = this.sessionAnomalies.get(sessionId);

    if (!sessionAnomaly) {
      return false;
    }

    return sessionAnomaly.suspicionLevel === 'high' || sessionAnomaly.suspicionLevel === 'critical';
  }

  /**
   * Get suspicion level
   */
  getSuspicionLevel(sessionId: string): 'low' | 'medium' | 'high' | 'critical' | null {
    const sessionAnomaly = this.sessionAnomalies.get(sessionId);

    if (!sessionAnomaly) {
      return null;
    }

    return sessionAnomaly.suspicionLevel;
  }

  /**
   * Get all suspicious sessions
   */
  getSuspiciousSessions(): SessionAnomalies[] {
    return Array.from(this.sessionAnomalies.values()).filter(
      (s) => s.suspicionLevel === 'high' || s.suspicionLevel === 'critical'
    );
  }

  /**
   * Clear session anomaly data
   */
  clearSession(sessionId: string): void {
    this.sessionAnomalies.delete(sessionId);
  }

  /**
   * Get statistics for all sessions
   */
  getGlobalStatistics(): {
    totalSessions: number;
    suspiciousSessions: number;
    averageFailureRate: number;
    averageRequestRate: number;
  } {
    const sessions = Array.from(this.sessionAnomalies.values());
    const suspiciousSessions = sessions.filter(
      (s) => s.suspicionLevel === 'high' || s.suspicionLevel === 'critical'
    ).length;

    const avgFailureRate =
      sessions.length > 0
        ? sessions.reduce((sum, s) => {
            const rate = s.metrics.tokenValidationAttempts > 0
              ? s.metrics.failedValidations / s.metrics.tokenValidationAttempts
              : 0;
            return sum + rate;
          }, 0) / sessions.length
        : 0;

    const avgRequestRate =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.metrics.requestsPerMinute, 0) / sessions.length
        : 0;

    return {
      totalSessions: sessions.length,
      suspiciousSessions,
      averageFailureRate: avgFailureRate,
      averageRequestRate: avgRequestRate,
    };
  }
}

// Export singleton instance
export const csrfAnomalyDetectionService = new CSRFAnomalyDetectionService();

export default CSRFAnomalyDetectionService;
