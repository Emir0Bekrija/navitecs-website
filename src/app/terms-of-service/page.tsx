import type { Metadata } from "next";
import TermsOfServiceClient from "@/components/pages/TermsOfServiceClient";
import { BASE_URL } from "@/lib/baseUrl";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms and conditions governing the use of the NAVITECS website and services. Understand your rights, responsibilities, and our policies for site usage.",
  alternates: { canonical: `${BASE_URL}/terms-of-service` },
  openGraph: {
    title: "Terms of Service | NAVITECS",
    description: "Terms and conditions governing the use of the NAVITECS website and services.",
    url: `${BASE_URL}/terms-of-service`,
  },
  robots: { index: true, follow: false },
};

export default function Page() {
  return <TermsOfServiceClient />;
}
