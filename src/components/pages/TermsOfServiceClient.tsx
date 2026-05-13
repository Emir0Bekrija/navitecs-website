"use client";

import { usePageView } from "@/hooks/usePageView";
import Link from "next/link";

export default function TermsOfServiceClient() {
  usePageView();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-semibold tracking-widest text-[#00FF9C] uppercase mb-4">
            Legal
          </p>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-400 text-sm">Last updated: May 2026</p>
        </div>

        <div className="space-y-12 text-[15px] leading-relaxed text-gray-300">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using{" "}
              <span className="text-white">navitecs.ba / navitecs.com</span>{" "}
              (the &ldquo;Site&rdquo;), you agree to be bound by these Terms of
              Service (&ldquo;Terms&rdquo;) and our{" "}
              <Link
                href="/privacy-policy"
                className="text-[#00AEEF] hover:underline"
              >
                Privacy Policy
              </Link>
              . If you do not agree with any part of these Terms, you must not
              use the Site.
            </p>
            <p className="mt-3">
              These Terms apply to all visitors, users, and anyone who accesses
              or uses the Site. NAVITECS d.o.o. reserves the right to update
              these Terms at any time. Continued use of the Site after changes
              are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              2. About NAVITECS
            </h2>
            <p>
              NAVITECS d.o.o. is a BIM-focused engineering and architecture
              consulting company headquartered in Sarajevo, Bosnia and
              Herzegovina. The Site serves as an informational platform for our
              services, portfolio, and career opportunities. Nothing on this
              Site constitutes a binding offer to provide services unless
              confirmed in a separate written agreement.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              3. Intellectual Property
            </h2>
            <p>
              All content on the Site — including but not limited to text,
              graphics, logos, images, project visuals, and software — is the
              property of NAVITECS d.o.o. or its content suppliers and is
              protected by applicable copyright, trademark, and intellectual
              property laws.
            </p>
            <p className="mt-3">
              You may view and print pages from the Site for your own personal,
              non-commercial use only. You may not reproduce, distribute,
              publicly display, modify, or create derivative works from any
              content without our prior written consent.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              4. Permitted Use
            </h2>
            <p className="mb-3">
              You may use the Site for lawful purposes only. You agree not to:
            </p>
            <ul className="space-y-2 pl-4 border-l border-white/10">
              <li>
                Use the Site in any way that violates applicable local,
                national, or international laws or regulations
              </li>
              <li>
                Submit false, misleading, or fraudulent information through any
                form on the Site
              </li>
              <li>
                Impersonate any person or organisation, or misrepresent your
                affiliation with any person or organisation
              </li>
              <li>
                Attempt to gain unauthorised access to any part of the Site or
                its infrastructure
              </li>
              <li>
                Use automated tools (bots, scrapers, crawlers) to extract
                content from the Site without our written permission
              </li>
              <li>
                Transmit any unsolicited commercial communications or spam
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Site
              </li>
              <li>
                Upload or transmit viruses, malware, or any other malicious code
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              5. Contact Form Inquiries
            </h2>
            <p>
              When you submit a message through our Contact page, you confirm
              that the information provided is accurate and that you are
              authorised to represent any company or organisation mentioned.
              Submitting an inquiry does not create a contractual obligation on
              the part of NAVITECS to respond or to provide any service.
            </p>
            <p className="mt-3">
              We will make reasonable efforts to respond to genuine business
              inquiries within a reasonable timeframe. We reserve the right not
              to respond to inquiries that are irrelevant, abusive, or made in
              bad faith.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              6. Job Applications
            </h2>
            <p>
              By submitting a job application through our Careers page, you
              confirm that:
            </p>
            <ul className="mt-3 space-y-2 pl-4 border-l border-white/10">
              <li>
                All information and documents you provide are truthful,
                accurate, and not misleading
              </li>
              <li>
                You have the right to share any content included in your
                application (including your CV)
              </li>
              <li>
                You consent to NAVITECS storing and processing your personal
                data for the purposes of evaluating your application and
                potentially contacting you about future suitable positions, in
                accordance with our Privacy Policy
              </li>
            </ul>
            <p className="mt-4">
              Submission of an application does not guarantee an interview or
              employment. NAVITECS reserves the right to reject any application
              without providing a reason. If you wish to withdraw your
              application or have your data deleted, please contact us at{" "}
              <a
                href="mailto:info@navitecs.com"
                className="text-[#00AEEF] hover:underline"
              >
                info@navitecs.com
              </a>
              .
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              7. Accuracy of Information
            </h2>
            <p>
              We strive to keep the information on the Site accurate and up to
              date. However, we make no warranties or representations — express
              or implied — as to the completeness, accuracy, reliability,
              suitability, or availability of any information, products,
              services, or related graphics on the Site for any purpose. Project
              descriptions, service offerings, and other content may be updated
              periodically and may not always reflect the current state of our
              work.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              8. Third-Party Links
            </h2>
            <p>
              The Site may contain links to third-party websites. These links
              are provided for your convenience only. NAVITECS has no control
              over the content of those sites and accepts no responsibility for
              them or for any loss or damage that may arise from your use of
              them. A link does not imply endorsement.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              9. Cookies &amp; Analytics
            </h2>
            <p>
              The Site uses a cookie consent banner that appears on your first
              visit. You may accept or reject non-essential (analytics) cookies
              at any time. Your consent preference is stored in your
              browser&apos;s localStorage.
            </p>
            <p className="mt-3">
              If you grant analytics consent, the Site loads Google Analytics 4
              and records page views, referrer data, time on page, and your
              approximate country (derived from your IP address, which is not
              stored). No advertising cookies or tracking pixels are used. You
              can change your preference at any time via the &ldquo;Cookie
              Settings&rdquo; link in the footer.
            </p>
            <p className="mt-3">
              For full details on what data is collected and how it is used,
              please refer to our{" "}
              <Link
                href="/privacy-policy"
                className="text-[#00AEEF] hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              10. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, NAVITECS
              d.o.o., its directors, employees, and agents shall not be liable
              for any indirect, incidental, special, consequential, or punitive
              damages arising from:
            </p>
            <ul className="mt-3 space-y-1.5 pl-4 border-l border-white/10">
              <li>Your use of, or inability to use, the Site</li>
              <li>Any errors or omissions in the Site&apos;s content</li>
              <li>Unauthorised access to or alteration of your data</li>
              <li>Any other matter relating to the Site</li>
            </ul>
            <p className="mt-4">
              In any event, our total liability shall not exceed the amount you
              have paid to NAVITECS in the twelve months preceding the claim, or
              €100 — whichever is greater.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              11. Governing Law &amp; Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of Bosnia and Herzegovina, without regard to its conflict
              of law provisions.
            </p>
            <p className="mt-3">
              Any dispute arising out of or relating to these Terms or the Site
              shall be subject to the exclusive jurisdiction of the competent
              courts of Sarajevo, Bosnia and Herzegovina. If you are a consumer
              in the European Union, you also have the right to use the EU
              Online Dispute Resolution platform at ec.europa.eu/odr.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              12. Severability
            </h2>
            <p>
              If any provision of these Terms is found to be unenforceable or
              invalid under applicable law, that provision will be limited or
              eliminated to the minimum extent necessary, and the remaining
              provisions will continue in full force and effect.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              13. Contact Us
            </h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-1 text-sm">
              <p className="text-white font-semibold">NAVITECS d.o.o.</p>
              <p>Sarajevo, Bosnia and Herzegovina</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:info@navitecs.com"
                  className="text-[#00AEEF] hover:underline"
                >
                  info@navitecs.com
                </a>
              </p>
              <p>
                Or use our{" "}
                <Link
                  href="/contact"
                  className="text-[#00AEEF] hover:underline"
                >
                  Contact page
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
