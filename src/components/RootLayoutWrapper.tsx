"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor";
import PromoPopup from "@/components/PromoPopup";
import CookieConsent from "@/components/CookieConsent";

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Admin panel gets no public chrome (nav, footer, analytics, consent banner)
  const isAdmin = pathname.startsWith("/navitecs-control-admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:border focus:border-white/20 focus:rounded-lg"
      >
        Skip to content
      </a>
      <CustomCursor />
      <Navigation />
      <main id="main-content" className="pt-20">{children}</main>
      <Footer />
      <PromoPopup />
      {/* Cookie consent banner — shown on first visit, manages GA4 loading */}
      <CookieConsent />
    </>
  );
}
