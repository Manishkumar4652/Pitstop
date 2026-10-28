'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Store, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Check, 
  ShieldCheck,
  Info,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Container, PageHeader, Card, Button, Badge, SectionHeading } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

export function ForMerchantsContent() {
  const { t } = useLanguage();

  return (
    <>
      <PageHeader
        title={t('forMerchants.pageTitle')}
        description={t('forMerchants.pageDescription')}
        badge={t('forMerchants.badge')}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/merchant/register">
              <Button variant="primary" size="md" leftIcon={<Store className="h-4 w-4" />} rightIcon={<ArrowRight className="h-4 w-4" />}>
                {t('forMerchants.registerPartnerBtn')}
              </Button>
            </Link>
            <Link href="/merchant/login">
              <Button variant="secondary" size="md">
                {t('forMerchants.merchantLoginBtn')}
              </Button>
            </Link>
          </div>
        }
      />

      <section className="py-12 sm:py-16">
        <Container size="xl">
          {/* Value Proposition Grid */}
          <SectionHeading
            title={t('forMerchants.whyJoinTitle')}
            subtitle={t('forMerchants.whyJoinSubtitle')}
            badge={t('forMerchants.whyJoinBadge')}
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            <Card variant="default">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-pitstop-charcoal">
                {t('forMerchants.benefitFootfallTitle')}
              </h3>
              <p className="mt-2 text-sm text-pitstop-muted">
                {t('forMerchants.benefitFootfallDesc')}
              </p>
            </Card>

            <Card variant="default">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-pitstop-charcoal">
                {t('forMerchants.benefitJobsTitle')}
              </h3>
              <p className="mt-2 text-sm text-pitstop-muted">
                {t('forMerchants.benefitJobsDesc')}
              </p>
            </Card>

            <Card variant="default">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-pitstop-charcoal">
                {t('forMerchants.benefitGoodwillTitle')}
              </h3>
              <p className="mt-2 text-sm text-pitstop-muted">
                {t('forMerchants.benefitGoodwillDesc')}
              </p>
            </Card>

            <Card variant="default">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-pitstop-charcoal">
                {t('forMerchants.benefitVerifiedTitle')}
              </h3>
              <p className="mt-2 text-sm text-pitstop-muted">
                {t('forMerchants.benefitVerifiedDesc')}
              </p>
            </Card>
          </div>

          {/* Facility Guidelines & Direct Registration Section */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left Col: Facility Requirements */}
            <div className="lg:col-span-5 space-y-6">
              <Card variant="default" className="bg-gradient-to-b from-white to-pitstop-bg">
                <div className="flex items-center gap-2 mb-4">
                  <Store className="h-5 w-5 text-pitstop-yellow-dark" />
                  <h3 className="text-lg font-bold text-pitstop-charcoal">
                    {t('forMerchants.guidelinesTitle')}
                  </h3>
                </div>
                <p className="text-sm text-pitstop-muted mb-4">
                  {t('forMerchants.guidelinesSubtitle')}
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{t('forMerchants.amenityWaterTitle')}</strong> {t('forMerchants.amenityWaterDesc')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{t('forMerchants.amenitySeatingTitle')}</strong> {t('forMerchants.amenitySeatingDesc')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{t('forMerchants.amenityChargingTitle')}</strong> {t('forMerchants.amenityChargingDesc')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{t('forMerchants.amenityRestroomTitle')}</strong> {t('forMerchants.amenityRestroomDesc')}</span>
                  </li>
                </ul>
              </Card>

              <Card variant="flat" className="border-pitstop-yellow/40 bg-pitstop-yellow-light p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-pitstop-charcoal">
                      {t('forMerchants.zeroFeeTitle')}
                    </h4>
                    <p className="mt-1 text-xs text-pitstop-muted">
                      {t('forMerchants.zeroFeeDesc')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Col: Direct Registration Onboarding Card */}
            <div className="lg:col-span-7">
              <Card variant="default" className="border-2 border-pitstop-yellow/30 bg-gradient-to-br from-white via-white to-amber-50/30 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-pitstop-yellow-dark" />
                      <h3 className="text-xl font-bold text-pitstop-charcoal">
                        {t('forMerchants.cardTitle')}
                      </h3>
                    </div>
                    <p className="text-sm text-pitstop-muted mt-1">
                      {t('forMerchants.cardSubtitle')}
                    </p>
                  </div>
                  <Badge variant="yellow" className="shrink-0">
                    {t('forMerchants.cardBadge')}
                  </Badge>
                </div>

                {/* 4-Step Registration Workflow Overview */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-pitstop-border/60 bg-white shadow-xs">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pitstop-yellow text-xs font-bold text-pitstop-charcoal">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-pitstop-charcoal">
                        {t('forMerchants.step1Title')}
                      </h4>
                      <p className="text-xs text-pitstop-muted mt-0.5">
                        {t('forMerchants.step1Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-pitstop-border/60 bg-white shadow-xs">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pitstop-yellow text-xs font-bold text-pitstop-charcoal">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-pitstop-charcoal">
                        {t('forMerchants.step2Title')}
                      </h4>
                      <p className="text-xs text-pitstop-muted mt-0.5">
                        {t('forMerchants.step2Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-pitstop-border/60 bg-white shadow-xs">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pitstop-yellow text-xs font-bold text-pitstop-charcoal">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-pitstop-charcoal">
                        {t('forMerchants.step3Title')}
                      </h4>
                      <p className="text-xs text-pitstop-muted mt-0.5">
                        {t('forMerchants.step3Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-pitstop-border/60 bg-white shadow-xs">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pitstop-yellow text-xs font-bold text-pitstop-charcoal">
                      4
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-pitstop-charcoal">
                        {t('forMerchants.step4Title')}
                      </h4>
                      <p className="text-xs text-pitstop-muted mt-0.5">
                        {t('forMerchants.step4Desc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* What happens upon registration */}
                <div className="rounded-lg bg-pitstop-bg border border-pitstop-border p-4 mb-6">
                  <h4 className="text-xs font-bold text-pitstop-charcoal mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {t('forMerchants.instantPerksTitle')}
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-pitstop-muted">
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-pitstop-yellow"></span>
                      {t('forMerchants.perk1')}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-pitstop-yellow"></span>
                      {t('forMerchants.perk2')}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-pitstop-yellow"></span>
                      {t('forMerchants.perk3')}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-pitstop-yellow"></span>
                      {t('forMerchants.perk4')}
                    </li>
                  </ul>
                </div>

                {/* Primary CTA Button */}
                <Link href="/merchant/register" className="block">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    fullWidth 
                    leftIcon={<Store className="h-5 w-5" />} 
                    rightIcon={<ArrowRight className="h-5 w-5" />}
                    className="py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    {t('forMerchants.ctaRegister')}
                  </Button>
                </Link>

                <p className="text-center text-xs text-pitstop-muted mt-4">
                  {t('forMerchants.alreadyPartner')}{' '}
                  <Link href="/merchant/login" className="font-semibold text-pitstop-charcoal underline hover:text-black">
                    {t('forMerchants.loginLink')}
                  </Link>
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

