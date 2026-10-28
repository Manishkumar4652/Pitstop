'use client';

import React from 'react';
import Link from 'next/link';
import { 
  HeartHandshake, 
  Target, 
  ShieldCheck, 
  MapPin, 
  Coffee, 
  Briefcase,
  Navigation
} from 'lucide-react';
import { Container, PageHeader, Card, Button } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

export function AboutContent() {
  const { isHindi } = useLanguage();

  return (
    <>
      <PageHeader
        title={isHindi ? 'पिटस्टॉप के बारे में' : 'About PitStop'}
        description={
          isHindi
            ? 'हम डिलीवरी राइडर्स, कैब ड्राइवर्स और स्थानीय व्यापारियों के लिए भारत का पहला समर्पित विश्राम स्थल एवं स्थानीय अवसर प्लेटफॉर्म बना रहे हैं।'
            : 'We are building India\'s dedicated rest-stop discovery and local opportunity platform for delivery riders, ride drivers, and local merchants.'
        }
        badge={isHindi ? 'हमारा मिशन' : 'Our Mission'}
      />

      <section className="py-12 sm:py-16">
        <Container size="xl">
          {/* Mission Quote Banner */}
          <div className="mb-16 rounded-2xl border border-pitstop-yellow/50 bg-pitstop-yellow-light p-8 text-center sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-pitstop-yellow text-pitstop-charcoal mb-4 shadow-subtle">
              <Navigation className="h-7 w-7 fill-pitstop-charcoal stroke-pitstop-charcoal" />
            </div>
            <h2 className="text-2xl font-extrabold text-pitstop-charcoal sm:text-4xl">
              {isHindi ? '“हर राइडर का हक है एक सुरक्षित विश्राम स्थल”' : '“Every rider deserves a place to stop.”'}
            </h2>
            <p className="mt-4 text-sm text-pitstop-muted sm:text-base max-w-2xl mx-auto">
              {isHindi
                ? 'भारत की गिग इकोनॉमी जोमैटो, स्विगी, ब्लिंकिट, ज़ेप्टो, अमेज़न, उबर, ओला और रैपिडो के लाखों दैनिक ऑर्डर्स पूरा करती है। लेकिन गिग वर्कर्स को प्रतिकूल मौसम, बुनियादी सुविधाओं की कमी और दोपहर के खाली समय का सामना करना पड़ता है। पिटस्टॉप इसे बदलने के लिए प्रतिबद्ध है।'
                : 'India\'s gig economy powers millions of daily doorstep deliveries for Zomato, Swiggy, Blinkit, Zepto, Amazon, Uber, Ola, and Rapido. Yet, gig workers endure harsh weather, lack of clean amenities, and unpaid afternoon downtime. PitStop exists to change that.'}
            </p>
          </div>

          {/* Problem & Solution Grid */}
          <div className="grid gap-8 md:grid-cols-2 mb-16">
            <Card variant="default" className="border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'गिग वर्कर्स के सामने चुनौतियाँ' : 'The Challenge Facing Gig Workers'}
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-pitstop-muted">
                <li>
                  • <strong>{isHindi ? 'अत्यधिक थकान और गर्मी:' : 'Severe Fatigue & Heat:'}</strong>{' '}
                  {isHindi
                    ? 'डिलीवरी राइडर्स 10+ घंटे 2-व्हीलर पर बिताते हैं, बिना छांव, साफ पानी या शौचालय की सुविधा के।'
                    : 'Delivery riders spend 10+ hours on 2-wheelers without access to shade, clean water, or restrooms.'}
                </li>
                <li>
                  • <strong>{isHindi ? 'खाली समय का नुकसान:' : 'Unproductive Downtime:'}</strong>{' '}
                  {isHindi
                    ? 'दोपहर के घंटों (2 PM – 5 PM) में ऑर्डर्स की संख्या कम होती है, जिससे राइडर्स को सड़कों के किनारे इंतजार करना पड़ता है।'
                    : 'Afternoon hours (2 PM – 5 PM) suffer from low order volumes, forcing riders to wait uncomfortably on street corners.'}
                </li>
                <li>
                  • <strong>{isHindi ? 'दैनिक खर्च:' : 'High Daily Costs:'}</strong>{' '}
                  {isHindi
                    ? 'शिफ्ट के दौरान पानी, चाय और भोजन खरीदना उनकी मेहनत की कमाई का बड़ा हिस्सा ले जाता है।'
                    : 'Buying water, chai, and meals on shift significantly cuts into gig earnings.'}
                </li>
              </ul>
            </Card>

            <Card variant="default" className="border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-pitstop-charcoal">
                  {isHindi ? 'पिटस्टॉप का समाधान' : 'The PitStop Solution'}
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-pitstop-muted">
                <li>
                  • <strong>{isHindi ? 'वेरिफाइड रेस्ट स्टॉप्स:' : 'Verified Rest Stops:'}</strong>{' '}
                  {isHindi
                    ? 'मर्चेंट पार्टनर्स का सर्च योग्य मैप जहां मुफ्त पीने का पानी, बैठने की जगह, चार्जिंग और साफ वॉशरूम उपलब्ध हैं।'
                    : 'A searchable map of merchant partners offering free drinking water, seating, charging, and clean washrooms.'}
                </li>
                <li>
                  • <strong>{isHindi ? 'राइडर डिस्काउंट्स:' : 'Rider Discounts:'}</strong>{' '}
                  {isHindi
                    ? 'मर्चेंट-प्रायोजित भोजन और चाय पर विशेष छूट जो राइडर्स के दैनिक खर्च को बचाती है।'
                    : 'Merchant-sponsored food & beverage deals that save riders money every single shift.'}
                </li>
                <li>
                  • <strong>{isHindi ? 'ऑफ-पीक माइक्रो-जॉब्स:' : 'Off-Peak Micro-Jobs:'}</strong>{' '}
                  {isHindi
                    ? 'शांत घंटों के दौरान स्थानीय दुकानदारों द्वारा पोस्ट किए गए छोटे हेल्पर कार्य।'
                    : 'Verified short-term helper tasks (parcel sorting, store prep) published by local merchants during quiet hours.'}
                </li>
              </ul>
            </Card>
          </div>

          {/* Core Pillars */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-pitstop-charcoal text-center mb-8">
              {isHindi ? 'हमारे चार मुख्य स्तंभ' : 'Our Four Core Pillars'}
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card variant="flat" className="bg-white border-pitstop-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-3">
                  <MapPin className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-pitstop-charcoal text-sm">
                  {isHindi ? '1. गरिमा और बुनियादी सुविधाएं' : '1. Physical Dignity'}
                </h4>
                <p className="mt-1 text-xs text-pitstop-muted">
                  {isHindi
                    ? 'सभी वेरिफाइड राइडर्स के लिए स्वच्छ पेयजल, आरामदायक बैठक, फोन चार्जिंग और शौचालय।'
                    : 'Clean drinking water, seating, phone charging, and restrooms accessible to all verified riders.'}
                </p>
              </Card>

              <Card variant="flat" className="bg-white border-pitstop-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-3">
                  <Coffee className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-pitstop-charcoal text-sm">
                  {isHindi ? '2. दैनिक बचत' : '2. Everyday Savings'}
                </h4>
                <p className="mt-1 text-xs text-pitstop-muted">
                  {isHindi
                    ? 'चाय, नाश्ते और दोपहर के भोजन पर विशेष मर्चेंट डिस्काउंट कूपन।'
                    : 'Single-use merchant coupons providing discounts on daily chai, refreshments, and meals.'}
                </p>
              </Card>

              <Card variant="flat" className="bg-white border-pitstop-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-3">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-pitstop-charcoal text-sm">
                  {isHindi ? '3. अतिरिक्त आमदनी' : '3. Income Enhancement'}
                </h4>
                <p className="mt-1 text-xs text-pitstop-muted">
                  {isHindi
                    ? 'दोपहर के खाली समय में अतिरिक्त कमाई के लिए छोटे हेल्पर टास्क।'
                    : 'Short-term helper tasks enabling riders to earn income during quiet afternoon order windows.'}
                </p>
              </Card>

              <Card variant="flat" className="bg-white border-pitstop-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-3">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-pitstop-charcoal text-sm">
                  {isHindi ? '4. समुदाय का भरोसा' : '4. Community Trust'}
                </h4>
                <p className="mt-1 text-xs text-pitstop-muted">
                  {isHindi
                    ? 'सर्वर-वेरिफाइड QR चेक-इन्स, पारदर्शी रेटिंग्स और सम्मानजनक मर्चेंट पार्टनरशिप।'
                    : 'Server-verified QR check-ins, transparent ratings, and respectful merchant partnerships.'}
                </p>
              </Card>
            </div>
          </div>

          {/* Action Footer */}
          <div className="text-center bg-white rounded-xl border border-pitstop-border p-8">
            <h3 className="text-lg font-bold text-pitstop-charcoal">
              {isHindi ? 'पिटस्टॉप मिशन का हिस्सा बनना चाहते हैं?' : 'Want to support the PitStop mission?'}
            </h3>
            <p className="text-xs text-pitstop-muted mt-1">
              {isHindi
                ? 'चाहे आप डिलीवरी राइडर हों या स्थानीय व्यापारी, आज ही शुरुआत करें।'
                : 'Whether you ride or run a local business, get started today.'}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/explore">
                <Button variant="primary" size="sm">
                  {isHindi ? 'रेस्ट स्टॉप्स खोजें' : 'Explore Rest Stops'}
                </Button>
              </Link>
              <Link href="/for-merchants">
                <Button variant="outline" size="sm">
                  {isHindi ? 'मर्चेंट पार्टनर जानकारी' : 'Merchant Partner Info'}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

