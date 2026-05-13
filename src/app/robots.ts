import type { MetadataRoute } from "next";
import { BASE_URL as BASE } from "@/lib/baseUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/navitecs-control-admin/", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
