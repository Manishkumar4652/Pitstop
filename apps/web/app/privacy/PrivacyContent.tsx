'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Container, PageHeader, Card, Badge } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

export function PrivacyContent() {
  const { isHindi } = useLanguage();

  return (
    <>
      <PageHeader
        title={isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}
        description={
          isHindi
            ? 'पिटस्टॉप पर उपयोगकर्ता खातों, स्थान अनुमति और चेक-इन डेटा की सुरक्षा और उपयोग के नियम।'
            : 'Draft specification outlining how PitStop handles user accounts, opt-in location access, and merchant check-in data.'
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
                ? 'यह गोपनीयता नीति पिटस्टॉप वेब एप्लिकेशन के कार्यात्मक विनिर्देशों को दर्शाती है। यह एक ड्राफ्ट संस्करण है।'
                : 'This privacy policy represents the functional specification for the PitStop web application MVP. It is clearly labeled as a draft and has not undergone formal legal audit.'}
            </div>
          </div>

          <Card variant="default" className="space-y-8 p-6 sm:p-10">
            <div>
              <Badge variant="neutral" className="mb-2">
                {isHindi ? '1. अवलोकन और प्रतिबद्धता' : '1. Overview & Commitment'}
              </Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">
                {isHindi ? '1. हम कौन सी जानकारी एकत्र करते हैं' : '1. Information We Collect'}
              </h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                {isHindi
                  ? 'पिटस्टॉप डिलीवरी राइडर्स, गिग वर्कर्स और मर्चेंट पार्टनर्स की गोपनीयता का सम्मान करता है। हम केवल वही न्यूनतम जानकारी एकत्र करते हैं जो रेस्ट स्टॉप खोज, क्यूआर चेक-इन और माइक्रो-जॉब्स के लिए आवश्यक है।'
                  : 'PitStop ("we", "our", or "platform") respects the privacy of gig workers, delivery riders, and merchant partners. We collect only the minimal personal information required to deliver verified rest-stop discovery, QR check-ins, and micro-job matching across India.'}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>
                  {isHindi
                    ? 'खाता विवरण: नाम, मोबाइल फोन नंबर, ईमेल पता, उपयोगकर्ता भूमिका (राइडर, मर्चेंट, एडमिन)।'
                    : 'Account Details: Name, mobile phone number, email address, user role (Rider, Merchant, Admin).'}
                </li>
                <li>
                  {isHindi
                    ? 'राइडर प्रोफ़ाइल विवरण: डिलीवरी प्लेटफॉर्म संबद्धता (उदा. जोमैटो, स्विगी, रैपिडो) और वाहन श्रेणी।'
                    : 'Rider Profile Details: Delivery platform affiliation (e.g. Zomato, Swiggy, Rapido) and vehicle category.'}
                </li>
                <li>
                  {isHindi
                    ? 'मर्चेंट व्यवसाय विवरण: व्यवसाय का नाम, श्रेणी, पता, संचालन का समय और उपलब्ध सुविधाएं।'
                    : 'Merchant Business Details: Business name, category, address, operating hours, and facility checklist.'}
                </li>
              </ul>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">
                {isHindi ? '2. सख्त लोकेशन गोपनीयता' : '2. Strict Location Privacy'}
              </Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">
                {isHindi ? '2. स्थान (लोकेशन) डेटा का प्रबंधन' : '2. How Location Data Is Handled'}
              </h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                {isHindi
                  ? 'पिटस्टॉप पर लोकेशन अनुमति पूरी तरह से वैकल्पिक (ऑप्ट-इन) है। डिवाइस जीपीएस निर्देशांक का उपयोग केवल निम्नलिखित के लिए किया जाता है:'
                  : 'Location access on PitStop is strictly opt-in. Device GPS coordinates are used exclusively for:'}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>
                  {isHindi
                    ? 'जब आप नक्शा या सूची खोलते हैं तो निकटतम रेस्ट स्टॉप्स को क्रमबद्ध करना।'
                    : 'Sorting rest stops by proximity when you open the explore map or list view.'}
                </li>
                <li>
                  {isHindi
                    ? 'चेक-इन के दौरान यह सत्यापित करना कि राइडर भौतिक रूप से मर्चेंट की दुकान पर मौजूद है।'
                    : 'Validating that a rider is physically present within range of a merchant rest stop during check-in.'}
                </li>
              </ul>
              <p className="mt-3 text-sm text-pitstop-muted font-medium">
                {isHindi
                  ? '🔒 हम कभी भी बैकग्राउंड में राइडर्स की लोकेशन ट्रैक नहीं करते हैं, न ही कोई जीपीएस रूट इतिहास सहेजते हैं।'
                  : '🔒 We do NOT continuously track rider locations in the background, nor do we store persistent GPS route histories.'}
              </p>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">
                {isHindi ? '3. डेटा शेयरिंग सीमाएं' : '3. Data Sharing Boundaries'}
              </Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">
                {isHindi ? '3. सूचना साझाकरण और तृतीय पक्ष' : '3. Information Sharing & Third Parties'}
              </h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                {isHindi
                  ? 'पिटस्टॉप कभी भी किसी विज्ञापनदाता या डेटा ब्रोकर को व्यक्तिगत डेटा नहीं बेचता है। जानकारी केवल निम्नलिखित परिचालन स्थितियों में साझा की जाती है:'
                  : 'PitStop never sells personal user data to third-party advertisers or data brokers. Information is shared strictly in the following operational contexts:'}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-pitstop-muted list-disc list-inside">
                <li>
                  {isHindi
                    ? 'मर्चेंट के साथ: जब कोई राइडर चेक-इन करता है या माइक्रो-जॉब के लिए आवेदन करता है, तो मर्चेंट को राइडर का नाम और आगमन समय दिखाई देता है।'
                    : 'With Merchants: When a rider checks in or applies for a micro-job, the merchant receives rider name, check-in time, and job application note.'}
                </li>
                <li>
                  {isHindi
                    ? 'सुरक्षा उपाय: प्लेटफॉर्म के सुरक्षित संचालन और दुरुपयोग से बचाव के लिए आवश्यक सर्वर लॉग्स।'
                    : 'For System Security: Necessary server logs and rate-limiting safeguards to prevent abuse.'}
                </li>
              </ul>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <Badge variant="neutral" className="mb-2">
                {isHindi ? '4. सुरक्षा उपाय' : '4. Security Measures'}
              </Badge>
              <h2 className="text-xl font-bold text-pitstop-charcoal">
                {isHindi ? '4. डेटा सुरक्षा और भंडारण' : '4. Data Protection & Retention'}
              </h2>
              <p className="mt-2 text-sm text-pitstop-muted leading-relaxed">
                {isHindi
                  ? 'पासवर्ड हमेशा सॉल्टेड bcrypt हैशिंग के साथ सुरक्षित रखे जाते हैं। एपीआई प्रमाणीकरण जेडब्ल्यूटी (JWT) और भूमिका-आधारित पहुंच नियंत्रण (RBAC) द्वारा सुरक्षित है।'
                  : 'Passwords are saved using salted bcrypt hashing. API authentication is secured via JSON Web Tokens (JWT) and enforced via server-side Role-Based Access Control (RBAC). Data is stored in secure MongoDB database clusters.'}
              </p>
            </div>

            <div className="border-t border-pitstop-border pt-6">
              <h2 className="text-lg font-bold text-pitstop-charcoal">
                {isHindi ? '5. गोपनीयता से संबंधित संपर्क' : '5. Contact Regarding Privacy'}
              </h2>
              <p className="mt-1 text-sm text-pitstop-muted">
                {isHindi ? 'यदि आपके पास गोपनीयता से जुड़े कोई प्रश्न हैं, तो कृपया ' : 'If you have questions regarding data privacy on PitStop, please contact us at '}{' '}
                <span className="font-semibold text-pitstop-charcoal">privacy@pitstop-app.in</span>{' '}
                {isHindi ? 'पर संपर्क करें।' : '.'}
              </p>
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}

