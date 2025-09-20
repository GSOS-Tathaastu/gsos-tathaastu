import { Db } from "mongodb";

export interface AdminSettings {
  theme?: string;
  features?: {
    surveys?: boolean;
    ai?: boolean;
  };
  [key: string]: any;
}

export const DEFAULT_SETTINGS: AdminSettings = {
  theme: "light",
  features: { surveys: true, ai: true },
};

/**
 * Read settings from the "settings" collection.
 * Uses a fixed string _id = "global".
 */
export async function readSettings(db: Db | null): Promise<AdminSettings> {
  if (!db) return { ...DEFAULT_SETTINGS };

  // explicitly cast _id as string so TS is happy
  const doc = await db
    .collection<AdminSettings & { _id: string }>("settings")
    .findOne({ _id: "global" });

  return { ...DEFAULT_SETTINGS, ...(doc || {}) };
}

/**
 * Save settings back to DB with _id = "global".
 */
export async function writeSettings(db: Db | null, settings: AdminSettings) {
  if (!db) return;

  await db
    .collection<AdminSettings & { _id: string }>("settings")
    .updateOne(
      { _id: "global" },
      { $set: settings },
      { upsert: true }
    );
}
