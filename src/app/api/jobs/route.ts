import { NextResponse } from "next/server";
import * as jobRepo from "@/lib/db/repositories/job";

// GET /api/jobs — public: returns only active jobs, ordered
export async function GET() {
  const jobs = await jobRepo.findMany({ active: true }, { field: "order", dir: "ASC" }, ["id", "title", "department", "location", "type", "description", "active", "createdAt"]);
  return NextResponse.json(jobs);
}
