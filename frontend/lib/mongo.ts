// frontend/lib/mongo.ts
import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;

/**
 * Returns a connected MongoClient or null if MONGO_URI is not set or connection fails.
 * Never throws during import; keeps the app booting even without Mongo.
 */
export async function getClientOrNull(): Promise<MongoClient | null> {
  const uri = process.env.MONGO_URI;
  if (!uri) return null;

  if (cachedClient) return cachedClient;

  try {
    const client = new MongoClient(uri, {
      // Add options as needed
      // serverSelectionTimeoutMS: 3000,
    });
    await client.connect();
    cachedClient = client;
    return cachedClient;
  } catch {
    return null;
  }
}

/**
 * Returns a Db instance or null if not configured/connected.
 */
export async function getDbOrNull(): Promise<Db | null> {
  const client = await getClientOrNull();
  if (!client) return null;
  const dbName = process.env.MONGO_DB || "gsos";
  return client.db(dbName);
}

/**
 * Backward compatibility: some code may import `clientPromise`.
 * This version NEVER throws on import. It resolves to a client or null.
 */
export const clientPromise: Promise<MongoClient | null> = (async () => {
  return await getClientOrNull();
})();
