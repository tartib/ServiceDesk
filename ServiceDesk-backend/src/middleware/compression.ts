import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';

/**
 * Response Compression Middleware
 * Compresses responses using gzip for better performance
 */

export const compressionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const acceptEncoding = req.headers['accept-encoding'] || '';

  // Check if client accepts gzip
  if (!acceptEncoding.includes('gzip')) {
    return next();
  }

  // Store original send function
  const originalSend = res.send;

  // Override send function
  res.send = function (data: string | Record<string, unknown>): Response {
    // Convert data to string if it's an object
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);

    // Don't compress small responses (< 1KB)
    if (stringData.length < 1024) {
      return originalSend.call(this, data);
    }

    // Set compression headers
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');

    // Compress and send
    zlib.gzip(stringData, (err, compressed) => {
      if (err) {
        // If compression fails, send uncompressed
        return originalSend.call(this, data);
      }
      res.setHeader('Content-Length', compressed.length);
      res.end(compressed);
    });

    return res;
  };

  next();
};
