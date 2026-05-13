import type { Metadata } from "next";
import PrivacyPolicyClient from "@/components/pages/PrivacyPolicyClient";
import { BASE_URL } from "@/lib/baseUrl";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how NAVITECS collects, uses, and protects your personal information. Read our privacy policy covering data handling, cookies, and your rights under applicable regulations.",
  alternates: { canonical: `${BASE_URL}/privacy-policy` },
  openGraph: {
    title: "Privacy Policy | NAVITECS",
    description: "Learn how NAVITECS collects, uses, and protects your personal information.",
    url: `${BASE_URL}/privacy-policy`,
  },
  robots: { index: true, follow: false },
};

export default function Page() {
  return <PrivacyPolicyClient />;
}
