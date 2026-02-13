/**
 * Prometheus Metrics Collection
 * Tracks application performance and business metrics
 */

class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  /**
   * Get all metrics in Prometheus format
   */
  getMetrics(): string {
    let output = '';

    // Counters
    this.counters.forEach((value, key) => {
      output += `# HELP ${key} Counter metric\n`;
      output += `# TYPE ${key} counter\n`;
      output += `${key} ${value}\n\n`;
    });

    // Gauges
    this.gauges.forEach((value, key) => {
      output += `# HELP ${key} Gauge metric\n`;
      output += `# TYPE ${key} gauge\n`;
      output += `${key} ${value}\n\n`;
    });

    // Histograms
    this.histograms.forEach((values, key) => {
      output += `# HELP ${key} Histogram metric\n`;
      output += `# TYPE ${key} histogram\n`;
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const p95 = this.percentile(values, 95);
      const p99 = this.percentile(values, 99);
      output += `${key}_sum ${sum}\n`;
      output += `${key}_count ${values.length}\n`;
      output += `${key}_avg ${avg}\n`;
      output += `${key}_p95 ${p95}\n`;
      output += `${key}_p99 ${p99}\n\n`;
    });

    return output;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

export const metricsCollector = new MetricsCollector();

/**
 * Application Metrics
 */
export const appMetrics = {
  // HTTP Metrics
  httpRequestsTotal: (method: string, path: string, status: number) => {
    metricsCollector.incrementCounter('http_requests_total', 1, { method, path, status: String(status) });
  },

  httpRequestDuration: (method: string, path: string, duration: number) => {
    metricsCollector.recordHistogram('http_request_duration_ms', duration, { method, path });
  },

  // Database Metrics
  dbQueryDuration: (operation: string, duration: number) => {
    metricsCollector.recordHistogram('db_query_duration_ms', duration, { operation });
  },

  dbConnectionPoolSize: (size: number) => {
    metricsCollector.setGauge('db_connection_pool_size', size);
  },

  dbConnectionErrors: () => {
    metricsCollector.incrementCounter('db_connection_errors');
  },

  // Authentication Metrics
  authAttempts: (status: 'success' | 'failure') => {
    metricsCollector.incrementCounter('auth_attempts_total', 1, { status });
  },

  // Business Metrics
  tasksCreated: () => {
    metricsCollector.incrementCounter('tasks_created_total');
  },

  tasksCompleted: () => {
    metricsCollector.incrementCounter('tasks_completed_total');
  },

  workflowTransitions: (fromStatus: string, toStatus: string) => {
    metricsCollector.incrementCounter('workflow_transitions_total', 1, { from: fromStatus, to: toStatus });
  },

  invalidTransitionAttempts: () => {
    metricsCollector.incrementCounter('invalid_transition_attempts_total');
  },

  // Error Metrics
  errorsTotal: (type: string) => {
    metricsCollector.incrementCounter('errors_total', 1, { type });
  },

  validationErrors: () => {
    metricsCollector.incrementCounter('validation_errors_total');
  },

  // Cache Metrics
  cacheHits: () => {
    metricsCollector.incrementCounter('cache_hits_total');
  },

  cacheMisses: () => {
    metricsCollector.incrementCounter('cache_misses_total');
  },

  // WebSocket Metrics
  websocketConnections: (count: number) => {
    metricsCollector.setGauge('websocket_connections', count);
  },

  websocketAuthFailures: () => {
    metricsCollector.incrementCounter('websocket_auth_failures_total');
  },
};

/**
 * Get all metrics in Prometheus format
 */
export const getPrometheusMetrics = (): string => {
  return metricsCollector.getMetrics();
};
