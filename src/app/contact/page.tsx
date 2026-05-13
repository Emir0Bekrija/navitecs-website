import type { Metadata } from "next";
import ContactClient from "../../components/pages/ContactClient";
import { BASE_URL } from "@/lib/baseUrl";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with NAVITECS for your next BIM, engineering, or architecture project. Contact our team in Sarajevo for a consultation on coordination, design, and technical solutions.",
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
  openGraph: {
    title: "Contact Us | NAVITECS",
    description:
      "Get in touch with NAVITECS for your next BIM, engineering, or architecture project. Contact our team for a consultation on coordination and design.",
    url: `${BASE_URL}/contact`,
  },
};

export default function Page() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "NAVITECS d.o.o.",
    url: BASE_URL,
    email: "info@navitecs.com",
    image: `${BASE_URL}/icon.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Džemala Bijedića 131",
      addressLocality: "Sarajevo",
      postalCode: "71000",
      addressCountry: "BA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.85046,
      longitude: 18.36181,
    },
    priceRange: "$$",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <ContactClient />
    </>
  );
}
