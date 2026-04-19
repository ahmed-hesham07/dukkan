import pinoHttp from 'pino-http';
import { logger } from '../lib/logger.js';

export const requestLogger = pinoHttp({
  logger,
  // Assign a unique request ID for tracing
  genReqId(req, res) {
    const existing = req.headers['x-request-id'];
    if (typeof existing === 'string') return existing;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader('x-request-id', id);
    return id;
  },
  // Customise what gets logged
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
  // Skip health checks from logs
  autoLogging: {
    ignore(req) {
      return req.url === '/health';
    },
  },
  // Colour-code status in dev
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} → ${res.statusCode}`;
  },
  customErrorMessage(req, res) {
    return `${req.method} ${req.url} → ${res.statusCode} ERROR`;
  },
});
