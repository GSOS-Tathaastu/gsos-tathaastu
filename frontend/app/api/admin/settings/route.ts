// frontend/app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";
import { readSettings, writeSettings } from "@/lib/settings";

// Accept either of these admin cookies:
function isAdmin(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  return /(?:^|;\s*)(gsos_admin_session|admin_session)=/.test(cookie);
}

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDbOrNull();
  const settings = await readSettings(db);
  return NextResponse.json({ ok: true, settings });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDbOrNull();
  if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 500 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const forceLocalChunks = Boolean(body?.forceLocalChunks);
  const saved = await writeSettings(db, { forceLocalChunks });

  return NextResponse.json({ ok: true, settings: saved });
}
