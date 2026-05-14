import type { Metadata } from "next";
import * as teamMemberRepo from "@/lib/db/repositories/teamMember";
import { BASE_URL } from "@/lib/baseUrl";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";
import TeamPageClient from "@/components/pages/TeamPageClient";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Meet the NAVITECS team — experienced BIM coordinators, engineers, and architects based in Sarajevo, Bosnia and Herzegovina, delivering projects across Europe.",
  alternates: {
    canonical: `${BASE_URL}/team`,
  },
  openGraph: {
    title: "Our Team | NAVITECS",
    description:
      "Meet the NAVITECS team — experienced BIM coordinators, engineers, and architects delivering projects across Europe.",
    url: `${BASE_URL}/team`,
  },
};

export default async function TeamPage() {
  let rows: Awaited<ReturnType<typeof teamMemberRepo.findMany>> = [];

  try {
    rows = await cached("team:active", () =>
      teamMemberRepo.findMany({ active: true }, { field: "order", dir: "ASC" }),
    );
  } catch {
    // DB may be unavailable during build — page will regenerate on first request
  }

  const members = rows.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return <TeamPageClient members={members} />;
}
