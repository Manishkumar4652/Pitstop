'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Container, PageHeader, Card, Badge } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

export function TermsContent() {
  const { isHindi } = useLanguage();

  return (
    <>
      <PageHeader
        title={isHindi ? 'सेवा की शर्तें' : 'Terms of Service'}
        description={
          isHindi
            ? 'पिटस्टॉप रेस्ट-स्टॉप खोज प्लेटफॉर्म, मर्चेंट ऑफर्स और माइक्रो-जॉब्स के उपयोग के नियम व शर्तें।'
            : 'Draft rules governing the use of the PitStop rest-stop discovery platform, merchant deals, and micro-jobs marketplace.'
        }
        badge={isHindi ? 'प्रारूप (ड्राफ्ट संस्करण)' : 'Draft MVP Version'}
      />

      <section className="py-12 sm:py-16">
        <Container size="lg">
          {/* Legal Draft Notice */}
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>{isHindi ? 'दस्तावेज़ सूचना:' : 'Draft Document Notice:'}</strong>{' '}
              {isHindi
                ? 'यह सेवा की शर्तें पिटस्टॉप वेब प्लेटफॉर्म के उपयोगकर्ता आचरण और दिशानिर्देशों को परिभाषित करती हैं।'
                : 'These terms of service represent the functional user conduct guidelines for the PitStop web platform MVP. It is clearly labeled as a draft and has not undergone formal legal audit.'}
            </div>
          </div>

          <Card variant="default" className="space-y-8 p-6 sm:p-10">
            <div>
              <Badge variant="neutral" className="mb-2">
                {isHindi ? '1. खाता शर्तें' : '1. Account Terms'}
              </Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">
                {isHindi ? '1. उपयोगकर्ता पात्रता और खाते' : '1. User Eligibility & Accounts'}
              </h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                {isHindi
                  ? 'पिटस्टॉप पूरे भारत में डिलीवरी राइडर्स, कैब/ऑटो ड्राइवर्स और स्थानीय दुकानदारों को जोड़ता है। खाता पंजीकृत करके, उपयोगकर्ता सटीक विवरण प्रदान करने और अपने पासवर्ड की गोपनीयता बनाए रखने के लिए सहमत होते हैं।'
                  : 'PitStop connects delivery riders, ride-hailing drivers, and local merchant partners across India. By registering an account, users agree to provide accurate phone numbers and profile details, and maintain the confidentiality of their credentials.'}
              </p>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">
                {isHindi ? '2. राइडर दिशानिर्देश' : '2. Rider Guidelines'}
              </Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">
                {isHindi ? '2. रेस्ट स्टॉप उपयोग और आचार संहिता' : '2. Rest Stop Usage & Code of Conduct'}
              </h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                {isHindi
                  ? 'मर्चेंट सुविधाओं का उपयोग करने वाले राइडर्स परिसर और कर्मचारियों के साथ सम्मानपूर्वक व्यवहार करने के लिए सहमत होते हैं:'
                  : 'Riders accessing merchant facilities agree to treat merchant premises, staff, and amenities with respect:'}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>
                  {isHindi
                    ? 'चेक-इन अनिवार्यता: विशेष छूट और सुविधाओं का उपयोग करने से पहले काउंटर पर वैध क्यूआर या ओटीपी चेक-इन पूरा करें।'
                    : 'Check-In Requirement: Complete a valid QR or OTP check-in at the merchant counter before accessing exclusive deals.'}
                </li>
                <li>
                  {isHindi
                    ? 'सम्मानजनक आचरण: बैठने की जगह साफ रखें, मुख्य प्रवेश द्वार बाधित न करें और दुकान के काम के घंटों का सम्मान करें।'
                    : 'Respectful Conduct: Maintain clean seating areas, avoid blocking merchant customer entrances, and follow merchant operating hours.'}
                </li>
              </ul>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">
                {isHindi ? '3. मर्चेंट दिशानिर्देश' : '3. Merchant Guidelines'}
              </Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">
                {isHindi ? '3. मर्चेंट प्रतिबद्धता और डील्स' : '3. Merchant Commitments & Deals'}
              </h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                {isHindi
                  ? 'पिटस्टॉप पर सूचीबद्ध पार्टनर व्यापारी निम्नलिखित के लिए प्रतिबद्ध हैं:'
                  : 'Partner merchants agreeing to list on PitStop undertake to:'}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>
                  {isHindi
                    ? 'सूचीबद्ध सुविधाएं (जैसे पीने का पानी, बैठने की जगह, फोन चार्जिंग) स्वच्छ और सुरक्षित स्थिति में उपलब्ध कराना।'
                    : 'Provide listed amenities (e.g. drinking water, seating, phone charging) in a clean, safe state.'}
                </li>
                <li>
                  {isHindi
                    ? 'पिटस्टॉप के माध्यम से सक्रिय छूट और कूपन का बिना किसी अतिरिक्त शुल्क के सम्मान करना।'
                    : 'Honor active deals and coupons generated through the PitStop platform without unexpected surcharges.'}
                </li>
              </ul>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">
                {isHindi ? '4. माइक्रो-जॉब्स मार्केटप्लेस' : '4. Micro-Jobs Marketplace'}
              </Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">
                {isHindi ? '4. खाली समय में माइक्रो-जॉब के नियम' : '4. Off-Peak Micro-Job Guidelines'}
              </h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                {isHindi
                  ? 'पिटस्टॉप पर प्रकाशित माइक्रो-जॉब्स अल्पकालिक और स्वैच्छिक सहायता कार्य (जैसे पार्सल छंटाई, दुकान की तैयारी) का प्रतिनिधित्व करते हैं। मर्चेंट को स्पष्ट भुगतान दर और कार्य निर्देश देने होंगे।'
                  : 'Micro-jobs published on PitStop represent short-term, voluntary helper tasks (e.g., parcel sorting, store prep). Merchants must specify clear pay rates and task instructions. Tasks involving illegal activities, hazardous conditions, or unpaid labor are strictly prohibited.'}
              </p>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <h2 className="text-lg font-bold text-pitstop-charcoal">
                {isHindi ? '5. पूछताछ और संपर्क' : '5. Moderation & Inquiries'}
              </h2>
              <p className="mt-1 text-sm text-pitstop-muted">
                {isHindi
                  ? 'कानूनी या शर्तों से संबंधित पूछताछ के लिए, संपर्क करें:'
                  : 'PitStop reserves the right to suspend accounts violating community guidelines. For legal or terms inquiries, contact'}{' '}
                <span className="font-semibold text-pitstop-charcoal">legal@pitstop-app.in</span>
                {isHindi ? '।' : '.'}
              </p>
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}

