import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as pageViewRepo from "@/lib/db/repositories/pageView";

const Schema = z.object({
  path: z.string().max(255).startsWith("/"),
  referrer: z.string().max(500).optional(),
});

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? null;
}

function resolveCountry(ip: string | null): string | null {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null; // local/private IP
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const geoip = require("geoip-lite") as { lookup: (ip: string) => { country?: string } | null };
    return geoip.lookup(ip)?.country ?? null;
  } catch {
    return null;
  }
}

// POST /api/track — public, no auth, fire-and-forget page view logging
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json(null, { status: 204 });

    const ip = getClientIp(request);
    const country = resolveCountry(ip);

    const record = await pageViewRepo.create({
      path: parsed.data.path,
      referrer: parsed.data.referrer ?? null,
      country,
    });

    return NextResponse.json({ id: record.id });
  } catch {
    // silently ignore — tracking must never break the page
    return new Response(null, { status: 204 });
  }
}
