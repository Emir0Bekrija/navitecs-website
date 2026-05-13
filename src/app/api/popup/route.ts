import { NextResponse } from "next/server";
import { getPopupConfig } from "@/lib/popup";

// GET /api/popup — public; returns popup config if enabled
export async function GET() {
  const cfg = await getPopupConfig();

  if (!cfg.enabled) {
    return NextResponse.json({ enabled: false }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
}
