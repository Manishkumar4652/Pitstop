import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, PageHeader, Card, Badge } from '@/components/ui';

export const metadata = {
  title: 'Privacy Policy (Draft) — PitStop',
  description: 'Draft privacy policy detailing data handling, opt-in location rules, and user protections for PitStop.',
};

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <PageHeader
        title="Privacy Policy"
        description="Draft specification outlining how PitStop handles user accounts, opt-in location access, and merchant check-in data."
        badge="Draft MVP Version"
      />

      <section className="py-12 sm:py-16">
        <Container size="lg">
          {/* Legal Draft Notice */}
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Draft Document Notice:</strong> This privacy policy represents the functional specification for the PitStop web application MVP. It is clearly labeled as a draft and has not undergone formal legal audit.
            </div>
          </div>

          <Card variant="default" className="space-y-8 p-6 sm:p-10">
            <div>
              <Badge variant="neutral" className="mb-2">1. Overview &amp; Commitment</Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">1. Information We Collect</h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                PitStop (&quot;we&quot;, &quot;our&quot;, or &quot;platform&quot;) respects the privacy of gig workers, delivery riders, and merchant partners. We collect only the minimal personal information required to deliver verified rest-stop discovery, QR check-ins, and micro-job matching across India.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>Account Details: Name, mobile phone number, email address, user role (Rider, Merchant, Admin).</li>
                <li>Rider Profile Details: Delivery platform affiliation (e.g. Zomato, Swiggy, Rapido) and vehicle category.</li>
                <li>Merchant Business Details: Business name, category, address, operating hours, and facility checklist.</li>
              </ul>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">2. Strict Location Privacy</Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">2. How Location Data Is Handled</h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                Location access on PitStop is strictly <strong>opt-in</strong>. Device GPS coordinates are used exclusively for:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>Sorting rest stops by proximity when you open the explore map or list view.</li>
                <li>Validating that a rider is physically present within range of a merchant rest stop during check-in.</li>
              </ul>
              <p className="mt-3 text-sm text-pitstop-muted font-medium">
                🔒 We do NOT continuously track rider locations in the background, nor do we store persistent GPS route histories.
              </p>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">3. Data Sharing Boundaries</Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">3. Information Sharing &amp; Third Parties</h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                PitStop never sells personal user data to third-party advertisers or data brokers. Information is shared strictly in the following operational contexts:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>With Merchants: When a rider checks in or applies for a micro-job, the merchant receives rider name, check-in time, and job application note.</li>
                <li>For System Security: Necessary server logs and rate-limiting safeguards to prevent abuse.</li>
              </ul>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">4. Security Measures</Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">4. Data Protection &amp; Retention</h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                Passwords are saved using salted bcrypt hashing. API authentication is secured via JSON Web Tokens (JWT) and enforced via server-side Role-Based Access Control (RBAC). Data is stored in secure MongoDB database clusters.
              </p>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <h2 className="text-lg font-bold text-pitstop-charcoal">5. Contact Regarding Privacy</h2>
              <p className="mt-1 text-sm text-pitstop-muted">
                If you have questions regarding data privacy on PitStop, please contact us at <span className="font-semibold text-pitstop-charcoal">privacy@pitstop-app.in</span>.
              </p>
            </div>
          </Card>
        </Container>
      </section>
    </PublicLayout>
  );
}
