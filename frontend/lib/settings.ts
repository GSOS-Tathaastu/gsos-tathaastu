// frontend/lib/settings.ts
import type { Db } from "mongodb";

export type AdminSettings = {
  _id?: string;                 // "global"
  forceLocalChunks?: boolean;   // when true, use /data/*.json instead of DB
  updatedAt?: Date;
};

export const DEFAULT_SETTINGS: AdminSettings = {
  forceLocalChunks: false,
};

export async function readSettings(db: Db | null): Promise<AdminSettings> {
  if (!db) return { ...DEFAULT_SETTINGS };
  const doc = await db.collection("settings").findOne<AdminSettings>({ _id: "global" });
  return { ...DEFAULT_SETTINGS, ...(doc || {}) };
}

export async function writeSettings(db: Db, patch: Partial<AdminSettings>) {
  const next: AdminSettings = {
    ...(await readSettings(db)),
    ...patch,
    _id: "global",
    updatedAt: new Date(),
  };
  await db.collection("settings").updateOne(
    { _id: "global" },
    { $set: next },
    { upsert: true }
  );
  return next;
}
