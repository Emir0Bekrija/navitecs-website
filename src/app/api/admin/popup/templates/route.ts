import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/proxy";
import { listPopupTemplates, createPopupTemplate } from "@/lib/popup";

const TemplateSchema = z.object({
  name:        z.string().min(1).max(100),
  badge:       z.string().max(50).default("INSIGHT"),
  category:    z.string().max(100).default(""),
  title:       z.string().max(255).default(""),
  description: z.string().default(""),
  buttonText:  z.string().max(100).default(""),
  linkUrl:     z.string().max(500).default(""),
  linkType:    z.enum(["internal", "external"]).default("external"),
  openInNewTab: z.coerce.boolean().default(true),
});

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  const templates = await listPopupTemplates();
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await request.json();
  const parsed = TemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const template = await createPopupTemplate(parsed.data);
  return NextResponse.json(template, { status: 201 });
}
