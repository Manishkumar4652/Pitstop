'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  QrCode, 
  Coffee, 
  Briefcase, 
  Store, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import { Container, PageHeader, Card, Button, Badge, SectionHeading } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

export function HowItWorksContent() {
  const { isHindi } = useLanguage();

  return (
    <>
      <PageHeader
        title={isHindi ? 'पिटस्टॉप कैसे काम करता है' : 'How PitStop Works'}
        description={
          isHindi
            ? 'गिग वर्कर्स और स्थानीय मर्चेंट्स को परस्पर लाभ के लिए जोड़ने वाला एक सरल और पारदर्शी प्लेटफॉर्म।'
            : 'A simple, transparent platform bringing gig workers and local merchants together for mutual benefit.'
        }
        badge={isHindi ? 'प्लेटफॉर्म गाइड' : 'Platform Guide'}
      />

      <section className="py-12 sm:py-16">
        <Container size="xl">
          {/* Rider Workflow Section */}
          <SectionHeading
            title={isHindi ? 'डिलीवरी राइडर्स एवं गिग ड्राइवर्स के लिए' : 'For Delivery Riders & Gig Drivers'}
            subtitle={
              isHindi
                ? 'आराम करने, फोन चार्ज करने, भोजन पर बचत करने और अतिरिक्त कमाई के 4 आसान स्टेप्स।'
                : 'Four easy steps to find rest, recharge your phone, save on food, and earn extra income.'
            }
            badge={isHindi ? 'राइडर यात्रा' : 'Rider Journey'}
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <Badge variant="yellow" size="sm" className="mb-2">
                  {isHindi ? 'स्टेप 1' : 'Step 1'}
                </Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'रेस्ट स्टॉप्स खोजें' : 'Discover Rest Stops'}
                </h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  {isHindi
                    ? 'मुफ्त पीने का पानी, बैठने की जगह, चार्जिंग और वॉशरूम वाले पास के स्टॉप्स खोजने के लिए मैप या लिस्ट सर्च का उपयोग करें।'
                    : 'Use the PitStop map or list search to find nearby rest stops with free drinking water, seating, charging, and restrooms.'}
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                  <QrCode className="h-6 w-6" />
                </div>
                <Badge variant="yellow" size="sm" className="mb-2">
                  {isHindi ? 'स्टेप 2' : 'Step 2'}
                </Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'त्वरित चेक-इन' : 'Quick Check-In'}
                </h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  {isHindi
                    ? 'मर्चेंट रेस्ट स्टॉप पर पहुंचें, काउंटर पर लगे अनोखे QR कोड को स्कैन करें या 4-अंकों का OTP शेयर करके अपनी विजिट वेरिफाई करें।'
                    : 'Arrive at the merchant rest stop, scan the unique QR code or share your 4-digit OTP at the desk to verify your visit.'}
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                  <Coffee className="h-6 w-6" />
                </div>
                <Badge variant="yellow" size="sm" className="mb-2">
                  {isHindi ? 'स्टेप 3' : 'Step 3'}
                </Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'आराम करें और डील्स पाएं' : 'Rest & Redeem Deals'}
                </h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  {isHindi
                    ? 'साफ सुविधाओं का आनंद लें और चाय, नाश्ते और भोजन पर राइडर्स के लिए विशेष छूट का लाभ उठाएं।'
                    : 'Enjoy clean amenities and unlock rider-exclusive discounts on chai, snacks, and lunch deals offered by the merchant.'}
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                  <Briefcase className="h-6 w-6" />
                </div>
                <Badge variant="yellow" size="sm" className="mb-2">
                  {isHindi ? 'स्टेप 4' : 'Step 4'}
                </Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'माइक्रो-जॉब्स के लिए अप्लाई करें' : 'Apply for Micro-Jobs'}
                </h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  {isHindi
                    ? 'दोपहर के शांत समय (2 PM – 5 PM) में ऑर्डर्स का इंतजार करते समय अतिरिक्त पैसे कमाने के लिए छोटे हेल्पर टास्क के लिए अप्लाई करें।'
                    : 'During quiet afternoon hours (2 PM – 5 PM), apply for short-term helper tasks to earn extra cash while waiting for orders.'}
                </p>
              </div>
            </Card>
          </div>

          {/* Merchant Workflow Section */}
          <SectionHeading
            title={isHindi ? 'पार्टनर मर्चेंट्स एवं स्थानीय व्यापारियों के लिए' : 'For Partner Merchants & Local Businesses'}
            subtitle={
              isHindi
                ? 'शांत घंटों में स्थिर ग्राहक फुटफॉल लाएं और छोटे कार्यों के लिए वेरिफाइड स्थानीय गिग वर्कर्स को काम पर रखें।'
                : 'Drive steady footfall during slow hours and hire verified local gig workers for short tasks.'
            }
            badge={isHindi ? 'मर्चेंट यात्रा' : 'Merchant Journey'}
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-bg text-pitstop-charcoal mb-4 border border-pitstop-border">
                  <Store className="h-6 w-6" />
                </div>
                <Badge variant="neutral" size="sm" className="mb-2">
                  {isHindi ? 'स्टेप 1' : 'Step 1'}
                </Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'सुविधाएं रजिस्टर करें' : 'Register Facility'}
                </h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  {isHindi
                    ? 'अपनी मर्चेंट प्रोफाइल बनाएं, उपलब्ध सुविधाएं (पानी, सीटिंग, चार्जिंग, शौचालय) लिस्ट करें और समय सेट करें।'
                    : 'Create your merchant profile, list available rider amenities (water, seating, charging, WC), and set operating hours.'}
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-bg text-pitstop-charcoal mb-4 border border-pitstop-border">
                  <UserCheck className="h-6 w-6" />
                </div>
                <Badge variant="neutral" size="sm" className="mb-2">
                  {isHindi ? 'स्टेप 2' : 'Step 2'}
                </Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'QR स्टैंडी लगाएं' : 'Display QR Standee'}
                </h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  {isHindi
                    ? 'अपने काउंटर पर अपना पिटस्टॉप QR कोड रखें। राइडर्स आने पर चेक-इन वेरिफाई करने के लिए स्कैन करते हैं।'
                    : 'Place your PitStop QR code at your counter. Riders scan or share an OTP upon arrival to verify check-ins.'}
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-bg text-pitstop-charcoal mb-4 border border-pitstop-border">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <Badge variant="neutral" size="sm" className="mb-2">
                  {isHindi ? 'स्टेप 3' : 'Step 3'}
                </Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'राइडर डील्स पब्लिश करें' : 'Publish Rider Deals'}
                </h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  {isHindi
                    ? 'गैर-पीक घंटों में डिलीवरी पार्टनर्स को अपनी दुकान पर आकर्षित करने के लिए चाय, नाश्ते या ड्रिंक्स पर विशेष छूट दें।'
                    : 'Offer special discounts on snacks or beverages to attract delivery drivers to your business during non-peak hours.'}
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-bg text-pitstop-charcoal mb-4 border border-pitstop-border">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <Badge variant="neutral" size="sm" className="mb-2">
                  {isHindi ? 'स्टेप 4' : 'Step 4'}
                </Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'ऑफ-पीक टास्क पोस्ट करें' : 'Post Off-Peak Tasks'}
                </h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  {isHindi
                    ? 'पार्सल लोडिंग, इन्वेंट्री छंटाई या पैम्पलेट बांटने में मदद चाहिए? आसपास आराम कर रहे वेरिफाइड राइडर्स के लिए जॉब्स पोस्ट करें।'
                    : 'Need help with parcel loading, inventory sorting, or flyer delivery? Post short jobs for verified riders resting nearby.'}
                </p>
              </div>
            </Card>
          </div>

          {/* CTA Banner */}
          <div className="rounded-2xl border border-pitstop-border bg-white p-8 text-center shadow-subtle sm:p-12">
            <h3 className="text-2xl font-bold text-pitstop-charcoal sm:text-3xl">
              {isHindi ? 'पिटस्टॉप नेटवर्क से जुड़ने के लिए तैयार हैं?' : 'Ready to join the PitStop network?'}
            </h3>
            <p className="mt-3 text-sm text-pitstop-muted max-w-xl mx-auto">
              {isHindi
                ? '2 मिनट से भी कम समय में रेस्ट स्टॉप्स खोजना शुरू करें या अपनी दुकान रजिस्टर करें।'
                : 'Start discovering rest stops or register your business in under 2 minutes.'}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/explore" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
                  {isHindi ? 'रेस्ट स्टॉप्स खोजें' : 'Explore Rest Stops'}
                </Button>
              </Link>
              <Link href="/for-merchants" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" fullWidth>
                  {isHindi ? 'मर्चेंट्स के लिए' : 'For Merchants'}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

