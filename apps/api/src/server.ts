import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

async function startServer() {
  const app = createApp();

  // Connect to MongoDB if MONGODB_URI is configured
  try {
    await connectDatabase();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Server] Fatal startup error connecting to database:', message);
    process.exit(1);
  }

  const server = app.listen(config.PORT, () => {
    console.log(`🚀 PitStop API Server running on port ${config.PORT} [${config.NODE_ENV}]`);
    console.log(`👉 Health check: http://localhost:${config.PORT}/health`);
    console.log(`👉 Versioned API: http://localhost:${config.PORT}${config.API_PREFIX}/health`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`\n${signal} received. Initiating graceful shutdown...`);
    
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDatabase();
      console.log('Shutdown complete.');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[Server] Uncaught error during startup:', err);
  process.exit(1);
});
