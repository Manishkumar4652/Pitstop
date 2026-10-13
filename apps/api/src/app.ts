import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import { config } from './config/env';
import { createCorsMiddleware } from './middleware/cors';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';
import { v1Router } from './routes';

export function createApp(customRouter?: express.Router): Express {
  const app = express();

  // 1. Basic Security Headers with Helmet
  app.use(helmet());

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
