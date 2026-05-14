import { NextResponse } from "next/server";
import * as pageViewRepo from "@/lib/db/repositories/pageView";
import * as popupClickRepo from "@/lib/db/repositories/popupClick";
import { requireAdmin } from "@/lib/proxy";
import { tzStartOfDay } from "@/lib/dateUtils";

const BUSINESS_TZ = "Europe/Sarajevo";

// GET /api/admin/dashboard/quick — fast mini-stats for dashboard header
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const nowInSarajevo = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const todayStart = tzStartOfDay(nowInSarajevo);

  const weekAgoDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const weekAgoStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(weekAgoDate);
  const weekStart = tzStartOfDay(weekAgoStr);

  try {
    const [pageViewsToday, pageViewsThisWeek, popupClicksTotal, popupClicksToday] =
      await Promise.all([
        pageViewRepo.count({ createdAt: { gte: todayStart } }),
        pageViewRepo.count({ createdAt: { gte: weekStart } }),
        popupClickRepo.count(),
        popupClickRepo.count({ createdAt: { gte: todayStart } }),
      ]);

    return NextResponse.json({
      pageViewsToday,
      pageViewsThisWeek,
      popupClicksTotal,
      popupClicksToday,
    });
  } catch (err) {
    console.error("[GET /api/admin/dashboard/quick]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
