import type { Metadata } from "next";
import * as aboutTeamFeatureRepo from "@/lib/db/repositories/aboutTeamFeature";
import { BASE_URL } from "@/lib/baseUrl";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";
import AboutClient from "../../components/pages/AboutClient";
import type { AboutTeamFeature } from "@/types/index";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about NAVITECS — a BIM-focused engineering consultancy delivering precision coordination and technical solutions. Meet our team of experts in architectural, structural, and MEP engineering.",
  alternates: {
    canonical: `${BASE_URL}/about`,
  },
  openGraph: {
    title: "About Us | NAVITECS",
    description:
      "Learn about NAVITECS — a BIM-focused engineering consultancy delivering precision coordination and technical solutions in architectural, structural, and MEP engineering.",
    url: `${BASE_URL}/about`,
  },
};

export default async function Page() {
  let aboutFeature: AboutTeamFeature | null = null;

  try {
    aboutFeature = (await cached("about:teamFeature", () =>
      aboutTeamFeatureRepo.findFirst({ enabled: true }),
    )) as AboutTeamFeature | null;
  } catch {
    // DB may be unavailable during build — page will regenerate on first request
  }

  return <AboutClient aboutFeature={aboutFeature} />;
}
