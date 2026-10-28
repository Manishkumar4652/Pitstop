'use client';

import React from 'react';
import { Mail, Phone, MapPin, Clock, Info } from 'lucide-react';
import { Container, PageHeader, Card, Button, Input, Select } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

export function ContactContent() {
  const { isHindi } = useLanguage();

  return (
    <>
      <PageHeader
        title={isHindi ? 'पिटस्टॉप सपोर्ट से संपर्क करें' : 'Contact PitStop Support'}
        description={
          isHindi
            ? 'कोई सवाल, फीडबैक या मर्चेंट पार्टनरशिप में सहायता चाहिए? हमारी सपोर्ट टीम से संपर्क करें।'
            : 'Have questions, feedback, or need merchant partnership assistance? Get in touch with our support team.'
        }
        badge={isHindi ? 'सपोर्ट पोर्टल' : 'Support Portal'}
      />

      <section className="py-12 sm:py-16">
        <Container size="xl">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Col: Support Channels & Info */}
            <div className="lg:col-span-5 space-y-6">
              <Card variant="default">
                <h3 className="text-lg font-bold text-pitstop-charcoal mb-4">
                  {isHindi ? 'सपोर्ट माध्यम' : 'Support Channels'}
                </h3>
                <div className="space-y-4 text-sm text-pitstop-muted">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-pitstop-charcoal text-xs">
                        {isHindi ? 'राइडर एवं मर्चेंट सपोर्ट हेल्पलाइन' : 'Rider & Merchant Support Line'}
                      </strong>
                      <span className="text-xs">+91 (1800) PIT-STOP / +91 98765 43210</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-pitstop-charcoal text-xs">
                        {isHindi ? 'ईमेल पूछताछ' : 'Email Inquiries'}
                      </strong>
                      <span className="text-xs">support@pitstop-app.in / partners@pitstop-app.in</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-pitstop-charcoal text-xs">
                        {isHindi ? 'मुख्यालय' : 'Headquarters'}
                      </strong>
                      <span className="text-xs">
                        {isHindi
                          ? 'पिटस्टॉप टेक्नोलॉजीज प्रा. लि., टेक हब सेक्टर 5, बेंगलुरु, कर्नाटक, भारत'
                          : 'PitStop Technologies Pvt. Ltd., Tech Hub Sector 5, Bengaluru, Karnataka, India'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-pitstop-charcoal text-xs">
                        {isHindi ? 'कार्य समय' : 'Operating Hours'}
                      </strong>
                      <span className="text-xs">
                        {isHindi ? 'सोमवार – शनिवार: सुबह 08:00 – रात 08:00 IST' : 'Monday – Saturday: 08:00 AM – 08:00 PM IST'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card variant="flat" className="border-pitstop-border bg-white p-4">
                <h4 className="text-xs font-bold text-pitstop-charcoal mb-2">
                  {isHindi ? 'अक्सर पूछे जाने वाले सवाल' : 'Frequently Asked Questions'}
                </h4>
                <ul className="space-y-2 text-xs text-pitstop-muted">
                  <li>
                    • <strong>{isHindi ? 'राइडर्स:' : 'Riders:'}</strong>{' '}
                    {isHindi
                      ? 'क्या पिटस्टॉप मुफ्त है? हां, रेस्ट स्टॉप खोजना और पानी/चार्जिंग का उपयोग राइडर्स के लिए 100% मुफ्त है।'
                      : 'Is PitStop free to use? Yes, discovering rest stops and claiming water/charging is 100% free for riders.'}
                  </li>
                  <li>
                    • <strong>{isHindi ? 'मर्चेंट्स:' : 'Merchants:'}</strong>{' '}
                    {isHindi
                      ? 'रेस्ट स्टॉप वेरिफिकेशन में कितना समय लगता है? सामान्यतः 24 व्यावसायिक घंटों में एडमिन वेरिफिकेशन पूरा हो जाता है।'
                      : 'How long does facility approval take? Admin verification usually completes within 24 business hours.'}
                  </li>
                </ul>
              </Card>
            </div>

            {/* Right Col: Contact Form */}
            <div className="lg:col-span-7">
              <Card variant="default">
                <h3 className="text-lg font-bold text-pitstop-charcoal mb-1">
                  {isHindi ? 'हमें संदेश भेजें' : 'Send Us a Message'}
                </h3>
                <p className="text-xs text-pitstop-muted mb-6">
                  {isHindi
                    ? 'नीचे दिया गया फॉर्म भरें, हमारी टीम आपसे शीघ्र संपर्क करेगी।'
                    : 'Fill out the form below and our team will get back to you promptly.'}
                </p>

                {/* API Integration Notice */}
                <div className="mb-6 rounded-lg border border-pitstop-border bg-pitstop-bg p-3.5 text-xs text-pitstop-muted flex items-start gap-2">
                  <Info className="h-4 w-4 text-pitstop-charcoal shrink-0 mt-0.5" />
                  <span>
                    <strong>{isHindi ? 'नोट:' : 'Note:'}</strong>{' '}
                    {isHindi
                      ? 'संपर्क फॉर्म सबमिशन आगामी चरण में लाइव API एंडपॉइंट से जुड़ेगा। यह लेआउट इनपुट सत्यापन मानकों को प्रदर्शित करता है।'
                      : 'Contact form submissions will connect to the server API endpoint in a future phase. This layout demonstrates input validation standards.'}
                  </span>
                </div>

                <form className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input 
                      label={isHindi ? 'आपका नाम' : 'Your Name'} 
                      placeholder={isHindi ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'} 
                      required 
                    />
                    <Input 
                      label={isHindi ? 'मोबाइल नंबर' : 'Phone Number'} 
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder={isHindi ? '10-अंकों का मोबाइल नंबर' : '10-digit mobile number'} 
                      required 
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input 
                      label={isHindi ? 'ईमेल पता' : 'Email Address'} 
                      type="email" 
                      placeholder="name@example.com" 
                    />
                    <Select
                      label={isHindi ? 'पूछताछ का विषय' : 'Inquiry Topic'}
                      required
                      options={[
                        { label: isHindi ? 'सामान्य पूछताछ' : 'General Inquiry', value: 'general' },
                        { label: isHindi ? 'राइडर रेस्ट स्टॉप फीडबैक' : 'Rider Rest Stop Feedback', value: 'rider_feedback' },
                        { label: isHindi ? 'मर्चेंट पार्टनरशिप पूछताछ' : 'Merchant Partnership Inquiry', value: 'merchant' },
                        { label: isHindi ? 'लिस्टिंग संबंधी समस्या रिपोर्ट करें' : 'Report a Listing Issue', value: 'report' },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-message" className="text-xs font-semibold text-pitstop-charcoal">
                      {isHindi ? 'आपका संदेश' : 'Your Message'} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      placeholder={
                        isHindi
                          ? 'अपना प्रश्न या फीडबैक विस्तार से लिखें...'
                          : 'Describe your question or feedback in detail...'
                      }
                      className="w-full rounded-lg border border-pitstop-border bg-white p-3 text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow focus:ring-offset-1"
                    ></textarea>
                  </div>

                  <Button variant="primary" fullWidth className="mt-2">
                    {isHindi ? 'संदेश भेजें' : 'Send Message'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

