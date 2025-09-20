import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
const dbName = process.env.MONGO_DB || "gsos";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

function ensureClientPromise(): Promise<MongoClient> {
  if (!uri) throw new Error("Mongo URI missing (set MONGODB_URI or MONGO_URI)");
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise!;
  }
  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise!;
}

/** Legacy default export kept for compatibility */
const defaultClientPromise = ensureClientPromise();
export default defaultClientPromise;

/** Explicit helpers used across routes/libraries */
export async function getClient(): Promise<MongoClient> {
  return ensureClientPromise();
}

export async function getDb(): Promise<Db> {
  const c = await getClient();
  return c.db(dbName);
}

/** Fail-soft version used by admin/health, summaries, etc. */
export async function getDbOrNull(): Promise<Db | null> {
  try {
    if (!uri) return null;
    const c = await getClient();
    return c.db(dbName);
  } catch {
    return null;
  }
}
