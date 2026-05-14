import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as aboutTeamFeatureRepo from "@/lib/db/repositories/aboutTeamFeature";
import { requireAdmin } from "@/lib/proxy";
import { invalidate } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

const IMAGE_DIR = path.resolve(process.cwd(), "uploads", "images");

function extractImageFilename(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/^\/api\/images\/([0-9a-f-]+\.webp)$/i);
  return match ? match[1] : null;
}

const Schema = z.object({
  title: z.string().max(255).default(""),
  text: z.string().max(5000).default(""),
  imageUrl: z.string().max(500).optional().default(""),
  enabled: z.coerce.boolean().optional(),
});

// GET /api/admin/about-featured — returns the single record (or null)
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const record = await aboutTeamFeatureRepo.findFirst();
  return NextResponse.json(record);
}

// PUT /api/admin/about-featured — upsert the single record
export async function PUT(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await aboutTeamFeatureRepo.findFirst();

  const record = existing
    ? await aboutTeamFeatureRepo.update(existing.id, parsed.data)
    : await aboutTeamFeatureRepo.create(parsed.data);

  // Delete old image file if it was replaced or cleared
  if (existing && existing.imageUrl !== record.imageUrl) {
    const oldFile = extractImageFilename(existing.imageUrl);
    if (oldFile) {
      await fs.unlink(path.join(IMAGE_DIR, oldFile)).catch(() => {});
    }
  }

  invalidate("about:teamFeature");
  revalidatePath("/about");
  return NextResponse.json(record);
}
