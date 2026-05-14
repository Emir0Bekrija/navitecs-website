import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as pageViewRepo from "@/lib/db/repositories/pageView";

const Schema = z.object({
  path: z.string().max(255).startsWith("/"),
  referrer: z.string().max(500).optional(),
});

// POST /api/track — public, no auth, fire-and-forget page view logging
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json(null, { status: 204 });

    await pageViewRepo.create({
      path: parsed.data.path,
      referrer: parsed.data.referrer ?? null,
    });

    return new Response(null, { status: 204 });
  } catch {
    // silently ignore — tracking must never break the page
    return new Response(null, { status: 204 });
  }
}
