// frontend/lib/mongo.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || "";
const dbName = process.env.MONGO_DB || "gsos";

type GlobalWithMongo = typeof global & {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoClient?: MongoClient;
};

const g = global as GlobalWithMongo;

let clientPromise: Promise<MongoClient>;

// Reuse a single client across hot reloads in dev
if (!g._mongoClientPromise) {
  if (!uri) {
    // Create a rejected promise that we will handle gracefully via getDbOrNull()
    g._mongoClientPromise = Promise.reject(
      new Error("MONGO_URI is not set in environment")
    );
  } else {
    g._mongoClient = new MongoClient(uri, {});
    g._mongoClientPromise = g._mongoClient.connect();
  }
}

clientPromise = g._mongoClientPromise;

// ---- Legacy default export (for routes expecting `clientPromise`) ----
export default clientPromise;

// ---- Helpers (preferred) ----
export async function getDb() {
  if (!uri) throw new Error("Missing MONGO_URI");
  const client = await clientPromise;
  return client.db(dbName);
}

/**
 * Returns a DB instance or `null` if not configured/failed.
 * Use this in dev to avoid API routes crashing when Mongo isn’t set locally.
 */
export async function getDbOrNull() {
  try {
    return await getDb();
  } catch {
    return null;
  }
}
