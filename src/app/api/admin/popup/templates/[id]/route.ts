import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/proxy";
import { updatePopupTemplate, deletePopupTemplate } from "@/lib/popup";

const UpdateSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  badge:       z.string().max(50).optional(),
  category:    z.string().max(100).optional(),
  title:       z.string().max(255).optional(),
  description: z.string().optional(),
  buttonText:  z.string().max(100).optional(),
  linkUrl:     z.string().max(500).optional(),
  linkType:    z.enum(["internal", "external"]).optional(),
  openInNewTab: z.coerce.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const template = await updatePopupTemplate(id, parsed.data);
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deletePopupTemplate(id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
}
