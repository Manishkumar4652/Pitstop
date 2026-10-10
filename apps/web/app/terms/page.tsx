import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, PageHeader, Card, Badge } from '@/components/ui';

export const metadata = {
  title: 'Terms of Service (Draft) — PitStop',
  description: 'Draft terms of service specifying user conduct, merchant rules, and platform guidelines for PitStop.',
};

export default function TermsPage() {
  return (
    <PublicLayout>
      <PageHeader
        title="Terms of Service"
        description="Draft rules governing the use of the PitStop rest-stop discovery platform, merchant deals, and micro-jobs marketplace."
        badge="Draft MVP Version"
      />

      <section className="py-12 sm:py-16">
        <Container size="lg">
          {/* Legal Draft Notice */}
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Draft Document Notice:</strong> These terms of service represent the functional user conduct guidelines for the PitStop web platform MVP. It is clearly labeled as a draft and has not undergone formal legal audit.
            </div>
          </div>

          <Card variant="default" className="space-y-8 p-6 sm:p-10">
            <div>
              <Badge variant="neutral" className="mb-2">1. Account Terms</Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">1. User Eligibility &amp; Accounts</h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                PitStop connects delivery riders, ride-hailing drivers, and local merchant partners across India. By registering an account, users agree to provide accurate phone numbers and profile details, and maintain the confidentiality of their credentials.
              </p>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">2. Rider Guidelines</Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">2. Rest Stop Usage &amp; Code of Conduct</h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                Riders accessing merchant facilities agree to treat merchant premises, staff, and amenities with respect:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>Check-In Requirement: Complete a valid QR or OTP check-in at the merchant counter before accessing exclusive deals.</li>
                <li>Respectful Conduct: Maintain clean seating areas, avoid blocking merchant customer entrances, and follow merchant operating hours.</li>
              </ul>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">3. Merchant Guidelines</Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">3. Merchant Commitments &amp; Deals</h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                Partner merchants agreeing to list on PitStop undertake to:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>Provide listed amenities (e.g. drinking water, seating, phone charging) in a clean, safe state.</li>
                <li>Honor active deals and coupons generated through the PitStop platform without unexpected surcharges.</li>
              </ul>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">4. Micro-Jobs Marketplace</Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">4. Off-Peak Micro-Job Guidelines</h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                Micro-jobs published on PitStop represent short-term, voluntary helper tasks (e.g., parcel sorting, store prep). Merchants must specify clear pay rates and task instructions. Tasks involving illegal activities, hazardous conditions, or unpaid labor are strictly prohibited.
              </p>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <h2 className="text-lg font-bold text-pitstop-charcoal">5. Moderation &amp; Inquiries</h2>
              <p className="mt-1 text-sm text-pitstop-muted">
                PitStop reserves the right to suspend accounts violating community guidelines. For legal or terms inquiries, contact <span className="font-semibold text-pitstop-charcoal">legal@pitstop-app.in</span>.
              </p>
            </div>
          </Card>
        </Container>
      </section>
    </PublicLayout>
  );
}
