import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env';
import { createCorsMiddleware } from './middleware/cors';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';
import { v1Router } from './routes';

export function createApp(customRouter?: express.Router): Express {
  const app = express();

  // 0. Trust one reverse-proxy hop (Nginx, Vercel, Railway, Render, AWS ALB)
  //    so req.ip resolves to the real client IP instead of the load-balancer IP.
  //    Without this, per-IP rate limiting is ineffective behind a proxy.
  app.set('trust proxy', 1);

  // Response compression (gzip/deflate) to dramatically decrease payload transfer size
  app.use(compression());

  // 1. Basic Security Headers with Helmet
  app.use(
    helmet({
      // Strict-Transport-Security: force HTTPS for 1 year in production
      hsts: config.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
      // Prevent browsers from MIME-sniffing a response away from the declared content-type
      noSniff: true,
      // Block site from being put in an iframe (clickjacking defense)
      frameguard: { action: 'deny' },
      // Disable X-Powered-By: Express (fingerprint reduction)
      hidePoweredBy: true,
    })
  );

  // 2. Cross-Origin Resource Sharing (CORS) with origin validation
  app.use(createCorsMiddleware());

  // 3. Body Parsing Middleware with 1MB limit
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Legacy / Top-level Health Check (preserved for backward compatibility)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'PitStop REST API',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // 5. Versioned API Namespace (/api/v1)
  app.use(config.API_PREFIX, v1Router);

  // Optional custom router (e.g. for isolated test fixtures)
  if (customRouter) {
    app.use(customRouter);
  }

  // 6. Unknown Route / 404 Handler
  app.use(notFoundHandler);

  // 7. Centralized Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
