/**
 * Webhook Service Implementation
 *
 * Implements IWFWebhookService from ActionExecutor so workflow actions
 * can call external APIs via the integration layer.
 */

import { IWFWebhookService } from '../../modules/workflow-engine/engine/ActionExecutor';
import logger from '../../utils/logger';

export const webhookService: IWFWebhookService = {
  async call(params: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body: any;
    timeout?: number;
  }): Promise<any> {
    const { url, method, headers, body, timeout } = params;
    const controller = new AbortController();
    const timeoutId = timeout
      ? setTimeout(() => controller.abort(), timeout)
      : null;

    try {
      logger.debug('Webhook call', { url, method });

      const res = await fetch(url, {
        method: method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(headers || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const responseBody = await res.text();
      let parsed: any;
      try {
        parsed = JSON.parse(responseBody);
      } catch {
        parsed = responseBody;
      }

      if (!res.ok) {
        logger.warn('Webhook call returned non-OK status', {
          url,
          status: res.status,
          body: responseBody.substring(0, 500),
        });
      }

      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body: parsed,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        logger.error('Webhook call timed out', { url, timeout });
        throw new Error(`Webhook call to ${url} timed out after ${timeout}ms`);
      }
      logger.error('Webhook call failed', { url, error: err.message });
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  },
};

export default webhookService;
