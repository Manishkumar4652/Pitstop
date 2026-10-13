import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './env';

export type DatabaseConnectionState = 'connected' | 'connecting' | 'disconnecting' | 'disconnected';

/**
 * Sanitizes a MongoDB URI string to mask user credentials for safe logging.
 */
export function maskMongoUri(uri: string): string {
  try {
    return uri.replace(/\/\/(.*?)@/, '//***:***@');
  } catch {
    return '[Protected Mongo URI]';
  }
}

/**
 * Returns current Mongoose connection state as a clean string.
 */
export function getDatabaseState(): DatabaseConnectionState {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    case 0:
    default:
      return 'disconnected';
  }
}

/**
 * Returns true if Mongoose is actively connected to MongoDB.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Connects to MongoDB Atlas / Local MongoDB instance using config.MONGODB_URI.
 * If MONGODB_URI is absent, safely bypasses connection without crashing (Phase 3A/3B local dev compatibility).
 */
export async function connectDatabase(): Promise<boolean> {
  // If already connected, return immediately
  if (isDatabaseConnected()) {
    return true;
  }

  const uri = config.MONGODB_URI;

  // If no URI is configured, report truthful status and continue without DB
  if (!uri || uri.trim() === '') {
    if (config.NODE_ENV === 'production') {
      throw new Error('Fatal: MONGODB_URI is required in production environment.');
    }
    console.log('[Database] MONGODB_URI is not configured. Running in API-only mode (database: disconnected).');
    return false;
  }

  const safeLogUri = maskMongoUri(uri);

  // Configure public DNS resolvers for SRV lookups if local system DNS refuses SRV queries
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
    } catch {
      // Ignore if setServers is not supported in environment
    }
  }

  try {
    console.log(`[Database] Attempting connection to MongoDB at ${safeLogUri}...`);
    
    // Connect to MongoDB
    await mongoose.connect(uri, {
      autoIndex: config.NODE_ENV !== 'production', // Build indexes in development/test
      serverSelectionTimeoutMS: 5000,              // 5 second connection timeout
    });

    console.log(`[Database] ✅ Connected to MongoDB successfully [${safeLogUri}]`);
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Database] ❌ Failed to connect to MongoDB [${safeLogUri}]:`, errorMsg);
    throw new Error(`MongoDB connection failed: ${errorMsg}`);
  }
}

/**
 * Gracefully disconnects from MongoDB if active.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      console.log('[Database] Disconnected from MongoDB.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[Database] Error while disconnecting from MongoDB:', errorMsg);
    }
  }
}

// Setup connection lifecycle listeners
mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('[Database] MongoDB connection closed.');
});
