import { MongoClient } from "mongodb";

const URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||           // common Atlas var
  "";                                  // do NOT use NEXT_PUBLIC_* here

const DB_NAME = process.env.MONGODB_DB || "gsos";

let cachedClient: MongoClient | null = null;

export async function getDbOrNull() {
  if (!URI) return null;
  try {
    if (cachedClient) return cachedClient.db(DB_NAME);
    const client = new MongoClient(URI);
    await client.connect();
    cachedClient = client;
    return client.db(DB_NAME);
  } catch {
    return null;
  }
}
