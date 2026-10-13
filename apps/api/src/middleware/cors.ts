import cors, { CorsOptions } from 'cors';
import { config } from '../config/env';

export function createCorsMiddleware() {
  const allowedOrigins = [
    config.CLIENT_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile native, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (config.NODE_ENV === 'production') {
        // Strict origin check in production
        if (origin === config.CLIENT_URL) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked: Origin ${origin} is not allowed.`));
      }

      // Development/test origin check
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: Origin ${origin} is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 hours preflight cache
  };

  return cors(corsOptions);
}
