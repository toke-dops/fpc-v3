import { Metadata } from "next";
import { getStaticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "privacy-policy",
  "Privacy Policy - Find Padel Clubs",
  "Find Padel Clubs privacy policy. Learn how we collect, use, and protect your personal information when using our padel club directory and booking platform."
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Find Padel Clubs (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit 
                our website findpadelclubs.co.uk (the &quot;Service&quot;).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Information We Collect</h2>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may collect personal information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Name and contact information (email address, phone number)</li>
                <li>Account credentials and profile information</li>
                <li>Payment and billing information (processed securely through third-party providers)</li>
                <li>Club information if you are a club owner</li>
                <li>Messages and communications sent through our contact forms</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Automatically Collected Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you use our Service, we automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Usage data and interaction patterns</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process transactions and manage your account</li>
                <li>Send you updates, newsletters, and marketing communications (with your consent)</li>
                <li>Respond to your enquiries and provide customer support</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect and prevent fraud, abuse, or security threats</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar tracking technologies to track activity on our Service and hold certain information. 
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
                if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may use third-party advertising services (such as Google AdSense) that use cookies to serve ads based on 
                your prior visits to our Service. You can opt out of personalized advertising by visiting your Google Ads Settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>With service providers who assist in operating our Service (hosting, payment processing, analytics)</li>
                <li>When required by law or to protect our rights and safety</li>
                <li>In connection with a business transfer (merger, acquisition, or sale of assets)</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the 
                Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Under UK GDPR and applicable data protection laws, you have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Access your personal information</li>
                <li>Rectify inaccurate or incomplete information</li>
                <li>Request erasure of your personal information</li>
                <li>Object to processing of your personal information</li>
                <li>Request restriction of processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To exercise these rights, please contact us at findpadelclubs@gmail.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our Service may contain links to third-party websites or services. We are not responsible for the privacy 
                practices of these external sites. We encourage you to read the privacy policies of any third-party sites 
                you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Children&apos;s Privacy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If you believe we have collected information from a child under 13, 
                please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
                Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Email: findpadelclubs@gmail.com<br />
                Website: findpadelclubs.co.uk
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

