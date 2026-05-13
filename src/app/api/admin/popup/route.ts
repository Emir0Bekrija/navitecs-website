import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/proxy";
import { getPopupConfig, savePopupConfig } from "@/lib/popup";

const PopupSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  badge: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  buttonText: z.string().max(100).optional(),
  linkUrl: z.string().max(500).optional(),
  linkType: z.enum(["internal", "external"]).optional(),
  openInNewTab: z.coerce.boolean().optional(),
});

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  const cfg = await getPopupConfig();
  return NextResponse.json(cfg);
}

export async function PUT(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await request.json();
  const parsed = PopupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await savePopupConfig(parsed.data);
  return NextResponse.json(updated);
}
