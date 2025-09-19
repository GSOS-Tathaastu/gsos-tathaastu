// frontend/lib/mongo.ts
import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;

/** Connects to MongoDB or returns null (never throws on import) */
export async function getClientOrNull(): Promise<MongoClient | null> {
  const uri = process.env.MONGO_URI;
  if (!uri) return null;
  if (cachedClient) return cachedClient;
  try {
    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    return cachedClient;
  } catch {
    return null;
  }
}

/** Returns Db or null (db name from MONGO_DB, default 'gsos') */
export async function getDbOrNull(): Promise<Db | null> {
  const client = await getClientOrNull();
  if (!client) return null;
  return client.db(process.env.MONGO_DB || "gsos");
}
