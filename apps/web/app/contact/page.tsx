import React from 'react';
import { Mail, Phone, MapPin, Clock, Info } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, PageHeader, Card, Button, Input, Select } from '@/components/ui';

export const metadata = {
  title: 'Contact Us — PitStop Support',
  description: 'Get in touch with the PitStop team for support, merchant partnerships, or platform feedback.',
};

export default function ContactPage() {
  return (
    <PublicLayout>
      <PageHeader
        title="Contact PitStop Support"
        description="Have questions, feedback, or need merchant partnership assistance? Get in touch with our support team."
        badge="Support Portal"
      />

      <section className="py-12 sm:py-16">
        <Container size="xl">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Col: Support Channels & Info */}
            <div className="lg:col-span-5 space-y-6">
              <Card variant="default">
                <h3 className="text-lg font-bold text-pitstop-charcoal mb-4">Support Channels</h3>
                <div className="space-y-4 text-sm text-pitstop-muted">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-pitstop-charcoal text-xs">Rider &amp; Merchant Support Line</strong>
                      <span className="text-xs">+91 (1800) PIT-STOP / +91 98765 43210</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-pitstop-charcoal text-xs">Email Inquiries</strong>
                      <span className="text-xs">support@pitstop-app.in / partners@pitstop-app.in</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-pitstop-charcoal text-xs">Headquarters</strong>
                      <span className="text-xs">PitStop Technologies Pvt. Ltd., Tech Hub Sector 5, Bengaluru, Karnataka, India</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-pitstop-charcoal text-xs">Operating Hours</strong>
                      <span className="text-xs">Monday – Saturday: 08:00 AM – 08:00 PM IST</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card variant="flat" className="border-pitstop-border bg-white p-4">
                <h4 className="text-xs font-bold text-pitstop-charcoal mb-2">Frequently Asked Questions</h4>
                <ul className="space-y-2 text-xs text-pitstop-muted">
                  <li>• <strong>Riders:</strong> Is PitStop free to use? Yes, discovering rest stops and claiming water/charging is 100% free for riders.</li>
                  <li>• <strong>Merchants:</strong> How long does facility approval take? Admin verification usually completes within 24 business hours.</li>
                </ul>
              </Card>
            </div>

            {/* Right Col: Contact Form */}
            <div className="lg:col-span-7">
              <Card variant="default">
                <h3 className="text-lg font-bold text-pitstop-charcoal mb-1">Send Us a Message</h3>
                <p className="text-xs text-pitstop-muted mb-6">Fill out the form below and our team will get back to you promptly.</p>

                {/* API Integration Notice */}
                <div className="mb-6 rounded-lg border border-pitstop-border bg-pitstop-bg p-3.5 text-xs text-pitstop-muted flex items-start gap-2">
                  <Info className="h-4 w-4 text-pitstop-charcoal shrink-0 mt-0.5" />
                  <span>
                    <strong>Note:</strong> Contact form submissions will connect to the server API endpoint in a future phase. This layout demonstrates input validation standards.
                  </span>
                </div>

                <form className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Your Name" placeholder="e.g. Ramesh Kumar" required />
                    <Input label="Phone Number" placeholder="10-digit mobile number" required />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Email Address" type="email" placeholder="name@example.com" />
                    <Select
                      label="Inquiry Topic"
                      required
                      options={[
                        { label: 'General Inquiry', value: 'general' },
                        { label: 'Rider Rest Stop Feedback', value: 'rider_feedback' },
                        { label: 'Merchant Partnership Inquiry', value: 'merchant' },
                        { label: 'Report a Listing Issue', value: 'report' },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-message" className="text-xs font-semibold text-pitstop-charcoal">
                      Your Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      placeholder="Describe your question or feedback in detail..."
                      className="w-full rounded-lg border border-pitstop-border bg-white p-3 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow focus:ring-offset-1"
                    ></textarea>
                  </div>

                  <Button variant="primary" fullWidth className="mt-2">
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
}
