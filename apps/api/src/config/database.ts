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

import https from 'https';

/**
 * Fallback resolver using DNS over HTTPS (DoH) when local system UDP port 53 blocks SRV lookups.
 */
async function resolveMongoSrvViaDoH(srvUri: string): Promise<string> {
  const match = srvUri.match(/^mongodb\+srv:\/\/([^/]+)\/([^?]*)(?:\?(.*))?$/);
  if (!match) return srvUri;

  const [, authAndHost, dbName, queryParams] = match;
  let userPass = '';
  let host = authAndHost;
  if (authAndHost.includes('@')) {
    const parts = authAndHost.split('@');
    userPass = parts[0] + '@';
    host = parts[1];
  }

  const fetchDns = (name: string, type: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      https.get(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  };

  try {
    const srvRecord = await fetchDns(`_mongodb._tcp.${host}`, 'SRV');
    if (!srvRecord.Answer || !Array.isArray(srvRecord.Answer) || srvRecord.Answer.length === 0) {
      return srvUri;
    }

    const shardHosts = srvRecord.Answer.map((ans: any) => {
      const parts = ans.data.trim().split(/\s+/);
      const port = parts[2] || '27017';
      const target = (parts[3] || '').replace(/\.$/, '');
      return `${target}:${port}`;
    }).join(',');

    const txtRecord = await fetchDns(host, 'TXT');
    let extraParams = '';
    if (txtRecord.Answer && Array.isArray(txtRecord.Answer) && txtRecord.Answer.length > 0) {
      extraParams = txtRecord.Answer[0].data.replace(/^"|"$/g, '');
    }

    const allParams = [
      'ssl=true',
      extraParams,
      queryParams,
    ]
      .filter(Boolean)
      .join('&');

    return `mongodb://${userPass}${shardHosts}/${dbName}?${allParams}`;
  } catch {
    return srvUri;
  }
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

  let uri = config.MONGODB_URI;

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

    // Connect to MongoDB with generous 15s timeout for Atlas multi-region TLS handshakes
    await mongoose.connect(uri, {
      autoIndex: config.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`[Database] ✅ Connected to MongoDB successfully [${safeLogUri}]`);
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // If SRV DNS failure occurred on mongodb+srv://, attempt DoH fallback
    if (uri.startsWith('mongodb+srv://') && (errorMsg.includes('querySrv') || errorMsg.includes('ETIMEOUT') || errorMsg.includes('ECONNREFUSED'))) {
      console.warn('[Database] ⚠️ SRV DNS resolution failed. Attempting DNS-over-HTTPS (DoH) resolution fallback...');
      try {
        const fallbackUri = await resolveMongoSrvViaDoH(uri);
        if (fallbackUri !== uri) {
          console.log('[Database] Connecting via resolved standard replica set URI...');
          await mongoose.connect(fallbackUri, {
            autoIndex: config.NODE_ENV !== 'production',
            serverSelectionTimeoutMS: 15000,
          });
          console.log(`[Database] ✅ Connected to MongoDB successfully via DoH fallback!`);
          return true;
        }
      } catch (fallbackErr: any) {
        console.error('[Database] DoH fallback failed:', fallbackErr?.message || fallbackErr);
      }
    }

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
