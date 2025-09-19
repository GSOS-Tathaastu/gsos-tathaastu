 frontend/lib/mongo.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI!;
if (!uri) throw new Error("Missing MONGO_URI in env");
const dbName = process.env.MONGO_DB || "gsos";

let client: MongoClient | null = null;

export async function getDb() {
  if (!client) {
    client = new MongoClient(uri, { });
    await client.connect();
  }
  return client.db(dbName);
}
