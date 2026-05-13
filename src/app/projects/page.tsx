import type { Metadata } from "next";
import ProjectsClient from "../../components/pages/ProjectsClient";
import * as projectRepo from "@/lib/db/repositories/project";
import { getSiteSettings } from "@/lib/siteSettings";
import { BASE_URL } from "@/lib/baseUrl";
import { cached } from "@/lib/cache";
import type { Project, MediaItem } from "@/types/index";
import type { ContentBlock } from "@/lib/blocks";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "View our portfolio of successfully delivered BIM coordination and engineering projects across residential, commercial, and infrastructure sectors.",
  alternates: { canonical: `${BASE_URL}/projects` },
  openGraph: {
    title: "Projects | NAVITECS",
    description: "View our portfolio of successfully delivered BIM coordination and engineering projects.",
    url: `${BASE_URL}/projects`,
  },
};

export default async function Page() {
  let rows: Awaited<ReturnType<typeof projectRepo.findMany>> = [];
  let settings = { projectsComingSoon: false };

  try {
    [rows, settings] = await Promise.all([
      cached("project:published", () =>
        projectRepo.findMany({ status: "published" }, { field: "order", dir: "ASC" }),
      ),
      getSiteSettings(),
    ]);
  } catch {
    // DB may be unavailable during build — page will regenerate on first request
  }

  const projects: Project[] = rows.map((p) => ({
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
    scopeOfWork:    Array.isArray(p.scopeOfWork)    ? (p.scopeOfWork as string[])         : [],
    toolsAndTech:   Array.isArray(p.toolsAndTech)   ? (p.toolsAndTech as string[])        : [],
    challenge:      p.challenge,
    solution:       p.solution,
    results:        Array.isArray(p.results)        ? (p.results as string[])             : [],
    valueDelivered: Array.isArray(p.valueDelivered) ? (p.valueDelivered as string[])      : [],
    media:          Array.isArray(p.media)          ? (p.media as MediaItem[])            : [],
    contentBlocks:  Array.isArray(p.contentBlocks)  ? (p.contentBlocks as ContentBlock[]) : [],
    status:         (p.status === "draft" || p.status === "published") ? p.status : "published",
    featured:       p.featured,
    seoTitle:       p.seoTitle,
    seoDescription: p.seoDescription,
    order:          p.order,
  }));

  return <ProjectsClient initialProjects={projects} comingSoon={settings.projectsComingSoon} />;
}
