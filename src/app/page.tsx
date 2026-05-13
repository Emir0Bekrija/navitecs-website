import type { Metadata } from "next";
import HomeClient from "@/components/pages/HomeClient";
import { BASE_URL } from "@/lib/baseUrl";

export const metadata: Metadata = {
  title: { absolute: "Home | NAVITECS" },
  description:
    "NAVITECS delivers precision-engineered BIM consulting and engineering solutions from Sarajevo, Bosnia and Herzegovina. Serving clients across Europe with coordination, MEP design, and architectural engineering for residential and commercial projects.",
  alternates: {
    canonical: `${BASE_URL}/`,
  },
  openGraph: {
    title: "Home | NAVITECS",
    description:
      "NAVITECS delivers precision-engineered BIM consulting and engineering solutions from Sarajevo, Bosnia and Herzegovina. Serving clients across Europe with coordination, MEP design, and architectural engineering.",
    url: `${BASE_URL}/`,
  },
};

export default function Page() {
  return <HomeClient />;
}
