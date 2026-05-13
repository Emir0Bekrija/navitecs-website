import type { Metadata } from "next";
import ServicesClient from "../../components/pages/ServicesClient";
import { BASE_URL } from "@/lib/baseUrl";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Explore NAVITECS services: BIM consulting, MEP design, architectural and structural engineering, and project coordination. International BIM services based in Bosnia and Herzegovina, serving Europe and beyond.",
  alternates: {
    canonical: `${BASE_URL}/services`,
  },
  openGraph: {
    title: "Our Services | NAVITECS",
    description:
      "Explore NAVITECS services: BIM consulting, MEP design, architectural and structural engineering, and project coordination. International BIM services from Bosnia and Herzegovina.",
    url: `${BASE_URL}/services`,
  },
};

export default function Page() {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "What Does a BIM Project Look Like?",
    description:
      "A six-step overview of how NAVITECS delivers a BIM project, from initial consultation through delivery and construction-phase support.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Initial Consultation",
        text: "We start every BIM project by meeting with stakeholders to understand the building's purpose, design intent, and technical constraints. This includes defining the scope of BIM coordination, identifying key disciplines involved, and establishing project timelines.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Analysis & Planning",
        text: "Our team develops a detailed BIM Execution Plan (BEP) outlining modeling standards, Level of Development (LOD) requirements, coordination workflows, and deliverable milestones — ensuring all parties are aligned from day one.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Design Development",
        text: "We create detailed 3D models for all disciplines — architectural, structural, and MEP — complete with technical documentation, system layouts, and specifications ready for coordination.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "BIM Coordination",
        text: "Using multidisciplinary clash detection, we identify and resolve conflicts between architectural, structural, mechanical, electrical, and plumbing systems before they become costly issues on site.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Quality Review",
        text: "Every model undergoes rigorous quality assurance — checking for code compliance, constructability, data integrity, and adherence to international BIM standards such as ISO 19650.",
      },
      {
        "@type": "HowToStep",
        position: 6,
        name: "Delivery & Support",
        text: "We deliver construction-ready documentation including coordinated drawings, quantity takeoffs, and 3D models. Our support continues through the construction phase to resolve on-site queries and model updates.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <ServicesClient />
    </>
  );
}
