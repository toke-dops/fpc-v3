import { Metadata } from "next";
import { getStaticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "terms-of-service",
  "Terms of Service - Find Padel Clubs",
  "Terms of Service for Find Padel Clubs. Read our terms and conditions for using our padel club directory, listing services, and booking platform."
);

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By accessing or using Find Padel Clubs (&quot;Service&quot;), you agree to be bound by these Terms of Service. 
                If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Use of Service</h2>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Eligibility</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You must be at least 13 years old to use this Service. By using the Service, you represent and warrant 
                that you meet this age requirement.
              </p>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">User Accounts</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you create an account with us, you must provide accurate, complete, and current information. You are 
                responsible for safeguarding your account credentials and for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Club Listings</h2>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Club Owners</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Club owners who list their clubs on our Service agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Provide accurate and truthful information about their club</li>
                <li>Maintain and update their listing information regularly</li>
                <li>Respond to enquiries in a timely manner</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not use the Service for fraudulent or misleading purposes</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">Listing Accuracy</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                While we strive to ensure accuracy, we do not guarantee the accuracy, completeness, or timeliness of 
                club listings. Club owners are responsible for the accuracy of their information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Subscriptions and Payments</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our Service offers both free and paid subscription plans. By subscribing to a paid plan, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Pay all fees associated with your subscription plan</li>
                <li>Automatic renewal unless cancelled before the renewal date</li>
                <li>No refunds for partial subscription periods, except as required by law</li>
                <li>Price changes will be communicated with 30 days notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Service and its original content, features, and functionality are owned by Find Padel Clubs and are 
                protected by UK and international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. User Content</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You retain ownership of any content you submit to the Service. By submitting content, you grant us a 
                worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content 
                for the purpose of operating and promoting the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use the Service:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
                <li>To collect or track the personal information of others</li>
                <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                <li>For any obscene or immoral purpose</li>
                <li>To interfere with or circumvent the security features of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our Service may contain links to third-party websites or services that are not owned or controlled by 
                Find Padel Clubs. We have no control over, and assume no responsibility for, the content, privacy policies, 
                or practices of any third-party sites or services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no warranties, 
                expressed or implied, and hereby disclaim all warranties including, without limitation, implied warranties 
                of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In no event shall Find Padel Clubs, its directors, employees, partners, agents, suppliers, or affiliates, 
                be liable for any indirect, incidental, special, consequential, or punitive damages, including without 
                limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use 
                of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice 
                or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon 
                termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without 
                regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision 
                is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us at:
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

