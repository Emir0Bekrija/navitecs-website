import { NextRequest, NextResponse } from "next/server";
import * as applicationRepo from "@/lib/db/repositories/application";
import * as contactRepo from "@/lib/db/repositories/contact";
import * as pageViewRepo from "@/lib/db/repositories/pageView";
import * as popupClickRepo from "@/lib/db/repositories/popupClick";
import { requireAdmin } from "@/lib/proxy";
import { tzStartOfDay, tzEndOfDay } from "@/lib/dateUtils";

const BUSINESS_TZ = "Europe/Sarajevo";

function toDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function groupByDay(dates: Date[]): { day: string; count: number }[] {
  const map = new Map<string, number>();
  for (const d of dates) {
    const key = toDayKey(d);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function groupByField(values: (string | null | undefined)[], topN = 8): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

function groupByHour(dates: Date[]): { hour: number; count: number }[] {
  const map = new Map<number, number>();
  for (let h = 0; h < 24; h++) map.set(h, 0);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    hour: "numeric",
    hour12: false,
  });
  for (const d of dates) {
    const h = parseInt(fmt.format(d)) % 24; // Intl may return 24 for midnight
    map.set(h, (map.get(h) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);
}

// GET /api/admin/dashboard/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { searchParams } = request.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam ? tzStartOfDay(fromParam) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const to = toParam ? tzEndOfDay(toParam) : new Date();

  try {
    const dateWhere = { gte: from, lte: to };

    const [applications, contacts, pageViews, popupClicks, avgDuration] = await Promise.all([
      applicationRepo.findManyWithJob({ submittedAt: dateWhere }),
      contactRepo.findMany({ where: { submittedAt: dateWhere } }),
      pageViewRepo.findMany({ createdAt: dateWhere }),
      popupClickRepo.findMany({ createdAt: dateWhere }),
      pageViewRepo.aggregateAvgDuration({ createdAt: dateWhere }),
    ]);

    const applicationsByDay = groupByDay(applications.map((a) => a.submittedAt));
    const contactsByDay = groupByDay(contacts.map((c) => c.submittedAt));

    const applicationsByRole = groupByField(
      applications.map((a) => a.job?.title ?? a.role)
    );
    const contactsByProjectType = groupByField(
      contacts.map((c) => c.projectType)
    );

    // Project views: paths that match /projects/<id> (not /projects itself)
    const projectPageViews = pageViews.filter(
      (p) => p.path.startsWith("/projects/")
    );
    const projectViews = groupByField(
      projectPageViews.map((p) => p.path.replace("/projects/", "")),
      20
    );

    // Page views: exclude /projects/<id> sub-pages (shown in project views above)
    const normalizedPaths = pageViews
      .filter((p) => !p.path.startsWith("/projects/") || p.path === "/projects")
      .map((p) => (p.path === "/" ? "/home" : p.path));
    const pageViewsByPath = groupByField(normalizedPaths, 15);

    // Traffic by hour (0–23)
    const trafficByHour = groupByHour(pageViews.map((p) => p.createdAt));

    // Country breakdown
    const countryBreakdown = groupByField(
      pageViews.map((p) => p.country),
      20
    );

    // Popup clicks
    const popupClicksByDay = groupByDay(popupClicks.map((c) => c.createdAt));
    const popupClicksByTitle = groupByField(
      popupClicks.map((c) => c.linkTitle ?? c.linkUrl),
      10
    );

    // Average session duration (seconds)
    const avgSessionDuration = avgDuration
      ? Math.round(avgDuration)
      : null;

    return NextResponse.json({
      totals: {
        applications: applications.length,
        contacts: contacts.length,
        pageViews: pageViews.length,
      },
      applicationsByDay,
      contactsByDay,
      applicationsByRole,
      contactsByProjectType,
      projectViews,
      pageViewsByPath,
      trafficByHour,
      countryBreakdown,
      avgSessionDuration,
      popupClicks: {
        total: popupClicks.length,
        byDay: popupClicksByDay,
        byTitle: popupClicksByTitle,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/dashboard/stats]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
