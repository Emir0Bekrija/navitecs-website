import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as projectRepo from "@/lib/db/repositories/project";
import { requireAdmin } from "@/lib/proxy";
import { invalidatePrefix } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import type { Project, MediaItem } from "@/types/index";
import type { ContentBlock } from "@/lib/blocks";

// ── Zod schema ─────────────────────────────────────────────────────────────────

const ProjectSchema = z.object({
  title:          z.string().min(1).max(255),
  category:       z.string().min(1).max(100),
  location:       z.string().max(255).optional().default("").transform(v => v || null),
  projectSize:    z.string().max(100).optional().default("").transform(v => v || null),
  timeline:       z.string().max(100).optional().default("").transform(v => v || null),
  numberOfUnits:  z.string().max(100).optional().default("").transform(v => v || null),
  clientType:     z.string().max(100).optional().default("").transform(v => v || null),
  description:    z.string().min(1),
  featuredImage:  z.string().max(500).optional().default("").transform(v => v || null),
  scopeOfWork:    z.array(z.string()).default([]),
  toolsAndTech:   z.array(z.string()).default([]),
  challenge:      z.string().optional().default("").transform(v => v || null),
  solution:       z.string().optional().default("").transform(v => v || null),
  results:        z.array(z.string()).default([]),
  valueDelivered: z.array(z.string()).default([]),
  media:          z.array(z.object({
                    url:     z.string(),
                    caption: z.string().optional(),
                    type:    z.enum(["image", "video"]).optional(),
                  })).default([]),
  contentBlocks:  z.array(z.object({
                    id:    z.string(),
                    type:  z.string(),
                    order: z.number(),
                    data:  z.record(z.string(), z.unknown()),
                  })).default([]),
  status:         z.enum(["draft", "published"]).default("published"),
  featured:       z.coerce.boolean().default(false),
  seoTitle:       z.string().max(255).optional().default("").transform(v => v || null),
  seoDescription: z.string().optional().default("").transform(v => v || null),
});

// ── DB row → frontend Project ──────────────────────────────────────────────────

function toResponse(p: {
  id: string; title: string; category: string; location: string | null;
  projectSize: string | null; timeline: string | null; numberOfUnits: string | null;
  clientType: string | null; description: string; featuredImage: string | null;
  scopeOfWork: unknown; toolsAndTech: unknown; challenge: string | null;
  solution: string | null; results: unknown; valueDelivered: unknown;
  media: unknown; contentBlocks: unknown; status: string; featured: boolean;
  seoTitle: string | null; seoDescription: string | null;
  order: number; createdAt: Date; updatedAt: Date;
}): Project {
  return {
    id:             p.id,
    title:          p.title,
    category:       p.category,
    location:       p.location,
    projectSize:    p.projectSize,
    timeline:       p.timeline,
    numberOfUnits:  p.numberOfUnits,
    clientType:     p.clientType,
    description:    p.description,
    featuredImage:  p.featuredImage,
    scopeOfWork:    Array.isArray(p.scopeOfWork)    ? (p.scopeOfWork as string[])      : [],
    toolsAndTech:   Array.isArray(p.toolsAndTech)   ? (p.toolsAndTech as string[])     : [],
    challenge:      p.challenge,
    solution:       p.solution,
    results:        Array.isArray(p.results)        ? (p.results as string[])          : [],
    valueDelivered: Array.isArray(p.valueDelivered) ? (p.valueDelivered as string[])   : [],
    media:          Array.isArray(p.media)          ? (p.media as MediaItem[])         : [],
    contentBlocks:  Array.isArray(p.contentBlocks)  ? (p.contentBlocks as ContentBlock[]) : [],
    status:         (p.status === "draft" || p.status === "published") ? p.status : "published",
    featured:       p.featured,
    seoTitle:       p.seoTitle,
    seoDescription: p.seoDescription,
    order:          p.order,
    createdAt:      p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt:      p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

// ── GET /api/admin/projects ────────────────────────────────────────────────────

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const projects = await projectRepo.findMany(undefined, { field: "order", dir: "ASC" });
  return NextResponse.json(projects.map(toResponse));
}

// ── POST /api/admin/projects ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await request.json();
  const parsed = ProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const maxOrder = await projectRepo.aggregateMaxOrder();
  const nextOrder = (maxOrder ?? -1) + 1;

  // Generate slug from title, ensure uniqueness with a suffix if needed
  const base = d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 190);
  const existing = await projectRepo.count({ id: { startsWith: base } });
  const id = existing > 0 ? `${base}-${existing}` : base;

  const project = await projectRepo.create({
    id,
    title:          d.title,
    category:       d.category,
    location:       d.location,
    projectSize:    d.projectSize,
    timeline:       d.timeline,
    numberOfUnits:  d.numberOfUnits,
    clientType:     d.clientType,
    description:    d.description,
    featuredImage:  d.featuredImage,
    scopeOfWork:    JSON.parse(JSON.stringify(d.scopeOfWork)),
    toolsAndTech:   JSON.parse(JSON.stringify(d.toolsAndTech)),
    challenge:      d.challenge,
    solution:       d.solution,
    results:        JSON.parse(JSON.stringify(d.results)),
    valueDelivered: JSON.parse(JSON.stringify(d.valueDelivered)),
    media:          JSON.parse(JSON.stringify(d.media)),
    contentBlocks:  JSON.parse(JSON.stringify(d.contentBlocks)),
    status:         d.status,
    featured:       d.featured,
    seoTitle:       d.seoTitle,
    seoDescription: d.seoDescription,
    order:          nextOrder,
  });

  invalidatePrefix("project");
  revalidatePath("/projects");
  return NextResponse.json(toResponse(project), { status: 201 });
}
