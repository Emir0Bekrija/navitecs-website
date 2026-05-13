import { NextRequest } from "next/server";
import { z } from "zod";
import * as popupClickRepo from "@/lib/db/repositories/popupClick";

const Schema = z.object({
  linkUrl: z.string().max(500),
  linkTitle: z.string().max(255).optional(),
});

// POST /api/track/popup-click — public, no auth, logs popup CTA click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return new Response(null, { status: 204 });

    await popupClickRepo.create({
      linkUrl: parsed.data.linkUrl,
      linkTitle: parsed.data.linkTitle ?? null,
    });
  } catch {
    // fire-and-forget
  }
  return new Response(null, { status: 204 });
}
