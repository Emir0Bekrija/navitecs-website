import type { Metadata } from "next";
import { Inter } from "next/font/google";
import RootLayoutWrapper from "@/components/RootLayoutWrapper";
import { BASE_URL } from "@/lib/baseUrl";
import "@/styles/index.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "NAVITECS | BIM-Focused Engineering & Architecture",
    template: "%s | NAVITECS",
  },
  description:
    "BIM-focused engineering and architecture consulting company. Delivering precision coordination and technical solutions for building development.",
  openGraph: {
    title: "NAVITECS | BIM-Focused Engineering & Architecture",
    description:
      "BIM-focused engineering and architecture consulting company. Delivering precision coordination and technical solutions for building development.",
    url: BASE_URL,
    siteName: "NAVITECS",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "NAVITECS Cover",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NAVITECS | BIM-Focused Engineering & Architecture",
    description:
      "BIM-focused engineering and architecture consulting company. Delivering precision coordination and technical solutions for building development.",
    images: [`${BASE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NAVITECS",
    url: BASE_URL,
    logo: `${BASE_URL}/icon.png`,
    sameAs: ["https://navitecs.com"],
    description:
      "BIM-focused engineering and architecture consulting company. Delivering precision coordination and technical solutions for building development.",
    email: "info@navitecs.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Džemala Bijedića 131",
      addressLocality: "Sarajevo",
      postalCode: "71000",
      addressCountry: "BA",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${BASE_URL}/contact`,
    },
  };

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <RootLayoutWrapper>{children}</RootLayoutWrapper>
      </body>
    </html>
  );
}
