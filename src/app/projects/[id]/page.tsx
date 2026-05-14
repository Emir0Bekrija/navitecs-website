import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ProjectDetailsClient from "../../../components/pages/ProjectDetailsClient";
import * as projectRepo from "@/lib/db/repositories/project";
import { getSiteSettings } from "@/lib/siteSettings";
import { BASE_URL } from "@/lib/baseUrl";
import { cached } from "@/lib/cache";
import type { Project, MediaItem } from "@/types/index";
import type { ContentBlock } from "@/lib/blocks";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await cached(`project:meta:${id}`, () =>
      projectRepo.findUnique(id, [
        "title",
        "seoTitle",
        "seoDescription",
        "description",
      ]),
    );
    if (!p) return { title: "Project Not Found" };
    return {
      title: p.seoTitle ?? p.title,
      description: p.seoDescription ?? p.description.slice(0, 160),
      alternates: { canonical: `${BASE_URL}/projects/${id}` },
      openGraph: {
        title: `${p.seoTitle ?? p.title} | NAVITECS`,
        description: p.seoDescription ?? p.description.slice(0, 160),
        url: `${BASE_URL}/projects/${id}`,
      },
    };
  } catch {
    return { title: "Project Not Found" };
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  let settings = { projectsComingSoon: false };
  try {
    settings = await getSiteSettings();
  } catch {
    console.log(
      "Error fetching site settings, defaulting to no coming soon message",
    );
  }
  if (settings.projectsComingSoon) redirect("/projects");

  let p;
  try {
    p = await cached(`project:${id}`, () => projectRepo.findUnique(id));
  } catch {
    notFound();
  }
  if (!p || p.status === "draft") notFound();

  const project: Project = {
    id: p.id,
    title: p.title,
    category: p.category,
    location: p.location,
    projectSize: p.projectSize,
    timeline: p.timeline,
    numberOfUnits: p.numberOfUnits,
    clientType: p.clientType,
    description: p.description,
    featuredImage: p.featuredImage,
    scopeOfWork: Array.isArray(p.scopeOfWork)
      ? (p.scopeOfWork as string[])
      : [],
    toolsAndTech: Array.isArray(p.toolsAndTech)
      ? (p.toolsAndTech as string[])
      : [],
    challenge: p.challenge,
    solution: p.solution,
    results: Array.isArray(p.results) ? (p.results as string[]) : [],
    valueDelivered: Array.isArray(p.valueDelivered)
      ? (p.valueDelivered as string[])
      : [],
    media: Array.isArray(p.media) ? (p.media as MediaItem[]) : [],
    contentBlocks: Array.isArray(p.contentBlocks)
      ? (p.contentBlocks as ContentBlock[])
      : [],
    status: p.status === "draft" ? "draft" : "published",
    featured: p.featured,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    order: p.order,
  };

  const projectSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.seoTitle ?? p.title,
    description: p.seoDescription ?? p.description.slice(0, 160),
    url: `${BASE_URL}/projects/${id}`,
    creator: { "@type": "Organization", name: "NAVITECS" },
    ...(p.featuredImage ? { image: p.featuredImage } : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: `${BASE_URL}/projects`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: p.seoTitle ?? p.title,
        item: `${BASE_URL}/projects/${id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProjectDetailsClient project={project} />
    </>
  );
}
