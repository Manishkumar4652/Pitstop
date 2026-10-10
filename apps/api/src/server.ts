import { createApp } from './app';

const PORT = parseInt(process.env.PORT || process.env.API_PORT || '5000', 10);

if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
  console.error(`Invalid PORT configuration: "${process.env.PORT || process.env.API_PORT}". Port must be a number between 1 and 65535.`);
  process.exit(1);
}

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`🚀 PitStop API Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
