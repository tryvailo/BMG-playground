'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Info,
  ChevronDown,
  Zap,
  Shield,
  Search,
  Gauge,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';
import type { EphemeralAuditResult } from '~/lib/modules/audit/ephemeral-audit';
import { useTranslation } from 'react-i18next';

// --- Horizon UI Design Tokens ---
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  secondary: '#A3AED0',
  secondaryLight: '#A3AED015',
  success: '#01B574',
  successLight: '#01B57415',
  warning: '#FFB547',
  warningLight: '#FFB54715',
  error: '#EE5D50',
  errorLight: '#EE5D5015',
  info: '#2B77E5',
  infoLight: '#2B77E515',
  background: '#F4F7FE',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
  shadowHover: '0 25px 50px rgba(112, 144, 176, 0.18)',
  shadowSm: '0 4px 12px rgba(112, 144, 176, 0.1)',
  // Category colors
  colors: {
    ai: '#4318FF',
    compliance: '#01B574',
    schema: '#2B77E5',
    seo: '#FFB547',
    performance: '#EE5D50',
  }
};

// --- Horizon Card Component ---
interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
}

const BentoCard = ({ children, className, title, subtitle, style }: BentoCardProps) => (
  <Card
    className={cn(
      "border-none bg-white rounded-[20px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
      className
    )}
    style={{ boxShadow: HORIZON.shadow, ...style }}
  >
    {(title || subtitle) && (
      <CardHeader className="pb-2">
        {title && (
          <h3 className="text-lg font-bold" style={{ color: HORIZON.textPrimary }}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm" style={{ color: HORIZON.textSecondary }}>
            {subtitle}
          </p>
        )}
      </CardHeader>
    )}
    <CardContent className={cn("p-6", (title || subtitle) && "pt-2")}>
      {children}
    </CardContent>
  </Card>
);

interface TechAuditSectionProps {
  data: EphemeralAuditResult;
}

/**
 * Single Audit Item Component
 */
interface AuditItemProps {
  id: string;
  title: string;
  description: string;
  status: 'good' | 'bad' | 'warning' | 'neutral';
  value?: string | number | React.ReactNode;
  score?: number | null;
  children?: React.ReactNode;
}

function AuditItem({ title, description, status, value, score, children }: AuditItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'good': return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'bad': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default: return <Info className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'good': return 'bg-[#01B57412] border-[#01B57430]';
      case 'bad': return 'bg-[#EE5D5012] border-[#EE5D5030]';
      case 'warning': return 'bg-[#FFB54712] border-[#FFB54730]';
      default: return 'bg-white border-[#F4F7FE]';
    }
  };

  return (
    <BentoCard className={cn('border-2', getStatusBg())}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {score !== undefined && score !== null && (
                  <span className={cn(
                    'text-lg font-bold',
                    status === 'good' ? 'text-[#01B574]' :
                      status === 'warning' ? 'text-[#FFB547]' :
                        'text-[#EE5D50]'
                  )}>
                    {score}%
                  </span>
                )}
                {value && <span className="text-base font-bold text-slate-900">{value}</span>}
                <ChevronDown className={cn('h-5 w-5 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="mb-4 text-sm text-slate-700">{description}</p>
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </BentoCard>
  );
}

/**
 * Calculate Overall Technical Score
 */
function calculateOverallScore(data: EphemeralAuditResult): number {
  const scores: number[] = [];

  // Speed scores
  if (data.speed.desktop !== null) scores.push(data.speed.desktop);
  if (data.speed.mobile !== null) scores.push(data.speed.mobile);

  // Security scores
  if (data.security.https) scores.push(100);
  if (data.security.mobileFriendly) scores.push(100);

  // Files scores
  if (data.files.robots) scores.push(100);
  if (data.files.sitemap) scores.push(100);
  scores.push(data.files.llmsTxt.score);

  // Schema scores (8 types)
  const schemaCount = [
    data.schema.hasMedicalOrg,
    data.schema.hasLocalBusiness,
    data.schema.hasPhysician,
    data.schema.hasMedicalProcedure,
    data.schema.hasMedicalSpecialty,
    data.schema.hasFAQPage,
    data.schema.hasReview,
    data.schema.hasBreadcrumbList,
  ].filter(Boolean).length;
  scores.push((schemaCount / 8) * 100);

  // Meta scores
  if (data.meta.lang) scores.push(100);
  if (data.meta.canonical) scores.push(100);
  if (data.meta.titleLength && data.meta.titleLength >= 30 && data.meta.titleLength <= 65) scores.push(100);
  if (data.meta.descriptionLength && data.meta.descriptionLength >= 120 && data.meta.descriptionLength <= 165) scores.push(100);
  if (!data.meta.robots?.includes('noindex')) scores.push(100);

  // External links scores
  if (data.externalLinks.broken === 0) scores.push(100);
  if (data.externalLinks.trusted > 0) scores.push(Math.min(100, data.externalLinks.trusted * 20));

  // Images scores
  const imagesScore = data.images.total > 0
    ? ((data.images.total - data.images.missingAlt) / data.images.total) * 100
    : 100;
  scores.push(imagesScore);

  // Duplicates scores
  if (data.duplicates.wwwRedirect === 'ok') scores.push(100);
  if (data.duplicates.trailingSlash === 'ok') scores.push(100);
  if (data.duplicates.httpRedirect === 'ok') scores.push(100);

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Calculate Category Scores
 */
function calculateCategoryScores(data: EphemeralAuditResult) {
  // AI Optimization
  const aiScores: number[] = [];
  if (data.files.llmsTxt.present) aiScores.push(100);
  aiScores.push(data.files.llmsTxt.score);
  if (data.files.robots) aiScores.push(100);
  if (data.files.sitemap) aiScores.push(100);
  const aiScore = aiScores.length > 0 ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length) : 0;

  // Compliance
  const complianceScores: number[] = [];
  if (data.security.https) complianceScores.push(100);
  if (data.security.mobileFriendly) complianceScores.push(100);
  const complianceScore = complianceScores.length > 0 ? Math.round(complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length) : 0;

  // Schema
  const schemaCount = [
    data.schema.hasMedicalOrg,
    data.schema.hasLocalBusiness,
    data.schema.hasPhysician,
    data.schema.hasMedicalProcedure,
    data.schema.hasMedicalSpecialty,
    data.schema.hasFAQPage,
    data.schema.hasReview,
    data.schema.hasBreadcrumbList,
  ].filter(Boolean).length;
  const schemaScore = (schemaCount / 8) * 100;

  // SEO
  const seoScores: number[] = [];
  if (data.meta.lang) seoScores.push(100);
  if (data.meta.canonical) seoScores.push(100);
  if (data.meta.titleLength && data.meta.titleLength >= 30 && data.meta.titleLength <= 65) seoScores.push(100);
  if (data.meta.descriptionLength && data.meta.descriptionLength >= 120 && data.meta.descriptionLength <= 165) seoScores.push(100);
  if (!data.meta.robots?.includes('noindex')) seoScores.push(100);
  if (data.externalLinks.broken === 0) seoScores.push(100);
  if (data.externalLinks.trusted > 0) seoScores.push(Math.min(100, data.externalLinks.trusted * 20));
  const seoScore = seoScores.length > 0 ? Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length) : 0;

  // Performance
  const perfScores: number[] = [];
  if (data.speed.desktop !== null) perfScores.push(data.speed.desktop);
  if (data.speed.mobile !== null) perfScores.push(data.speed.mobile);
  if (data.duplicates.wwwRedirect === 'ok') perfScores.push(100);
  if (data.duplicates.trailingSlash === 'ok') perfScores.push(100);
  if (data.duplicates.httpRedirect === 'ok') perfScores.push(100);
  const perfScore = perfScores.length > 0 ? Math.round(perfScores.reduce((a, b) => a + b, 0) / perfScores.length) : 0;

  return {
    ai: aiScore,
    compliance: complianceScore,
    schema: schemaScore,
    seo: seoScore,
    performance: perfScore,
  };
}

/**
 * Main TechAuditSection Component
 */
export function TechAuditSection({ data }: TechAuditSectionProps) {
  const { t } = useTranslation('playground');

  // Helper to get status from boolean
  const fromBool = (val: boolean | null): 'good' | 'bad' => val ? 'good' : 'bad';

  const _overallScore = calculateOverallScore(data);
  const categoryScores = calculateCategoryScores(data);

  // Format metric value to 2 decimal places
  const formatMetric = (value: number | null): string => {
    if (value === null) return 'N/A';
    return value.toFixed(2);
  };

  // Prepare performance data for charts
  const speedComparisonData = [
    {
      name: 'Desktop',
      score: data.speed.desktop || 0,
      fill: HORIZON.primary,
    },
    {
      name: 'Mobile',
      score: data.speed.mobile || 0,
      fill: HORIZON.info,
    },
  ];

  // Core Web Vitals data (if available) - using real data from desktopDetails and mobileDetails
  const coreWebVitalsData = [];
  if (data.speed.desktopDetails) {
    if (data.speed.desktopDetails.lcp !== null) {
      coreWebVitalsData.push({
        metric: 'LCP',
        desktop: data.speed.desktopDetails.lcp,
        mobile: data.speed.mobileDetails?.lcp ?? null,
        unit: 'ms',
        good: 2500,
        needsImprovement: 4000,
      });
    }
    if (data.speed.desktopDetails.fcp !== null) {
      coreWebVitalsData.push({
        metric: 'FCP',
        desktop: data.speed.desktopDetails.fcp,
        mobile: data.speed.mobileDetails?.fcp ?? null,
        unit: 'ms',
        good: 1800,
        needsImprovement: 3000,
      });
    }
    if (data.speed.desktopDetails.cls !== null) {
      coreWebVitalsData.push({
        metric: 'CLS',
        desktop: data.speed.desktopDetails.cls,
        mobile: data.speed.mobileDetails?.cls ?? null,
        unit: '',
        good: 0.1,
        needsImprovement: 0.25,
      });
    }
    if (data.speed.desktopDetails.tbt !== null) {
      coreWebVitalsData.push({
        metric: 'TBT',
        desktop: data.speed.desktopDetails.tbt,
        mobile: data.speed.mobileDetails?.tbt ?? null,
        unit: 'ms',
        good: 200,
        needsImprovement: 600,
      });
    }
  }

  // PageSpeed Categories data
  const pageSpeedCategoriesData = [];
  if (data.speed.desktopDetails?.categories) {
    pageSpeedCategoriesData.push({
      category: 'Performance',
      desktop: data.speed.desktopDetails.categories.performance || 0,
      mobile: data.speed.mobileDetails?.categories?.performance || 0,
    });
    pageSpeedCategoriesData.push({
      category: 'Accessibility',
      desktop: data.speed.desktopDetails.categories.accessibility || 0,
      mobile: data.speed.mobileDetails?.categories?.accessibility || 0,
    });
    pageSpeedCategoriesData.push({
      category: 'Best Practices',
      desktop: data.speed.desktopDetails.categories.bestPractices || 0,
      mobile: data.speed.mobileDetails?.categories?.bestPractices || 0,
    });
    pageSpeedCategoriesData.push({
      category: 'SEO',
      desktop: data.speed.desktopDetails.categories.seo || 0,
      mobile: data.speed.mobileDetails?.categories?.seo || 0,
    });
  }

  return (
    <div className="space-y-12 mb-10">
      {/* ========== CATEGORY KPI GRID ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 py-4 px-2">
        {/* AI Score */}
        <div className="group border-r border-[#F4F7FE] last:border-none pr-4">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-3 text-[#A3AED0]">AI Readiness</p>
          <div className="text-5xl font-black tracking-tighter" style={{ color: HORIZON.textPrimary }}>
            {categoryScores.ai}%
          </div>
        </div>

        {/* Compliance Score */}
        <div className="group border-r border-[#F4F7FE] last:border-none pr-4">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-3 text-[#A3AED0]">Compliance</p>
          <div className="text-5xl font-black tracking-tighter" style={{ color: HORIZON.textPrimary }}>
            {categoryScores.compliance}%
          </div>
        </div>

        {/* Schema Score */}
        <div className="group border-r border-[#F4F7FE] last:border-none pr-4">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-3 text-[#A3AED0]">Structure</p>
          <div className="text-5xl font-black tracking-tighter" style={{ color: HORIZON.textPrimary }}>
            {Math.round(categoryScores.schema)}%
          </div>
        </div>

        {/* SEO Score */}
        <div className="group border-r border-[#F4F7FE] last:border-none pr-4">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-3 text-[#A3AED0]">Visibility</p>
          <div className="text-5xl font-black tracking-tighter" style={{ color: HORIZON.textPrimary }}>
            {categoryScores.seo}%
          </div>
        </div>

        {/* Performance Score */}
        <div className="group">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-3 text-[#A3AED0]">Performance</p>
          <div className="text-5xl font-black tracking-tighter" style={{ color: HORIZON.textPrimary }}>
            {categoryScores.performance}%
          </div>
        </div>
      </div>

      {/* Performance Metrics Visualization */}
      {(data.speed.desktop !== null || data.speed.mobile !== null || coreWebVitalsData.length > 0 || pageSpeedCategoriesData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Speed Comparison: Desktop vs Mobile */}
          {(data.speed.desktop !== null || data.speed.mobile !== null) && (
            <BentoCard title="Performance Comparison">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speedComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid vertical={false} stroke={`${HORIZON.secondary}15`} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: HORIZON.textSecondary, fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: HORIZON.textSecondary, fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Score']}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                      {speedComparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>
          )}

          {/* PageSpeed Categories Radar Chart */}
          {pageSpeedCategoriesData.length > 0 && (
            <BentoCard title="PageSpeed Categories" subtitle="Performance, Accessibility, Best Practices, SEO">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={pageSpeedCategoriesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <PolarGrid stroke={`${HORIZON.secondary}30`} />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{ fill: HORIZON.textSecondary, fontSize: 10, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: HORIZON.textSecondary, fontSize: 10 }}
                      axisLine={false}
                    />
                    <Radar
                      name="Desktop"
                      dataKey="desktop"
                      stroke={HORIZON.primary}
                      fill={HORIZON.primary}
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Mobile"
                      dataKey="mobile"
                      stroke={HORIZON.info}
                      fill={HORIZON.info}
                      fillOpacity={0.6}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: HORIZON.textSecondary }}
                      iconType="circle"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: HORIZON.shadow,
                        padding: '12px',
                      }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>
          )}

          {/* Core Web Vitals */}
          {coreWebVitalsData.length > 0 && (
            <BentoCard className="lg:col-span-2" title="Core Web Vitals" subtitle="LCP, FCP, CLS, TBT Metrics">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coreWebVitalsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid vertical={false} stroke={`${HORIZON.secondary}15`} />
                    <XAxis
                      type="number"
                      tick={{ fill: HORIZON.textSecondary, fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => formatMetric(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="metric"
                      tick={{ fill: HORIZON.textSecondary, fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: HORIZON.shadow,
                        padding: '12px',
                      }}
                      formatter={(value: unknown, name: string) => {
                        if (typeof value !== 'number' || value === null || value === undefined) return ['N/A', name];
                        if (isNaN(value)) return ['N/A', name];
                        return [`${formatMetric(value)}`, name];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: HORIZON.textSecondary }}
                    />
                    <Bar dataKey="desktop" fill={HORIZON.primary} radius={[0, 4, 4, 0]} name="Desktop" />
                    <Bar dataKey="mobile" fill={HORIZON.info} radius={[0, 4, 4, 0]} name="Mobile" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {coreWebVitalsData.map((vital, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">{vital.metric}</div>
                    <div className="text-sm font-medium text-slate-500 mb-2">
                      Good: &lt;{vital.good}{vital.unit} | Needs Improvement: &lt;{vital.needsImprovement}{vital.unit}
                    </div>
                    <div className="flex items-center gap-2">
                      {vital.desktop !== null && (
                        <div className="flex-1">
                          <div className="text-xs text-slate-400 mb-0.5">Desktop</div>
                          <div className={cn(
                            'text-lg font-black',
                            vital.desktop <= vital.good ? 'text-emerald-600' :
                              vital.desktop <= vital.needsImprovement ? 'text-orange-600' :
                                'text-red-600'
                          )}>
                            {formatMetric(vital.desktop)}{vital.unit}
                          </div>
                        </div>
                      )}
                      {vital.mobile !== null && (
                        <div className="flex-1">
                          <div className="text-xs text-slate-400 mb-0.5">Mobile</div>
                          <div className={cn(
                            'text-lg font-black',
                            vital.mobile <= vital.good ? 'text-emerald-600' :
                              vital.mobile <= vital.needsImprovement ? 'text-orange-600' :
                                'text-red-600'
                          )}>
                            {formatMetric(vital.mobile)}{vital.unit}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>
          )}
        </div>
      )}
      {/* Category 1: AI Optimization */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900">
          <Zap className="h-6 w-6 text-primary" />
          {t('techAudit.groups.ai')}
        </h2>

        <div className="grid grid-cols-1 gap-3">
          <AuditItem
            id="3_1"
            title={t('techAudit.items.3_1.title')}
            description={t('techAudit.items.3_1.description')}
            status={fromBool(data.files.llmsTxt.present)}
            value={data.files.llmsTxt.present ? 'Знайдено' : 'Відсутній'}
          />
          <AuditItem
            id="3_2"
            title={t('techAudit.items.3_2.title')}
            description={t('techAudit.items.3_2.description')}
            status={data.files.llmsTxt.score >= 80 ? 'good' : data.files.llmsTxt.score >= 50 ? 'warning' : 'bad'}
            score={data.files.llmsTxt.score}
          >
            {data.files.llmsTxt.recommendations.length > 0 && (
              <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200 space-y-2">
                <p className="font-black text-xs uppercase tracking-wider text-slate-400">Рекомендації:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                  {data.files.llmsTxt.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            )}
          </AuditItem>
          <AuditItem
            id="3_3"
            title={t('techAudit.items.3_3.title')}
            description={t('techAudit.items.3_3.description')}
            status={fromBool(data.files.robots)}
            value={data.files.robots ? 'Знайдено' : 'Відсутній'}
          />
          <AuditItem
            id="3_4"
            title={t('techAudit.items.3_4.title')}
            description={t('techAudit.items.3_4.description')}
            status={data.files.robots && data.files.sitemap ? 'good' : 'warning'}
            value={data.files.sitemap ? 'Sitemap знайдено' : 'Sitemap не вказано'}
          />
        </div>
      </section>

      {/* Category 2: Core Compliance */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900">
          <Shield className="h-6 w-6 text-primary" />
          {t('techAudit.groups.compliance')}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <AuditItem
            id="3_5"
            title={t('techAudit.items.3_5.title')}
            description={t('techAudit.items.3_5.description')}
            status={fromBool(data.security.https)}
            value={data.security.https ? 'Включено' : 'Відключено'}
          />
          <AuditItem
            id="3_6"
            title={t('techAudit.items.3_6.title')}
            description={t('techAudit.items.3_6.description')}
            status={fromBool(data.security.mobileFriendly)}
            value={data.security.mobileFriendly ? 'Так' : 'Ні'}
          />
        </div>
      </section>

      {/* Category 3: Schema Markup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900">
          <FileText className="h-6 w-6 text-primary" />
          {t('techAudit.groups.schema')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AuditItem
            id="3_7" title={t('techAudit.items.3_7.title')} description={t('techAudit.items.3_7.description')}
            status={fromBool(data.schema.hasMedicalOrg)} value={data.schema.hasMedicalOrg ? '✓' : '✗'}
          />
          <AuditItem
            id="3_8" title={t('techAudit.items.3_8.title')} description={t('techAudit.items.3_8.description')}
            status={fromBool(data.schema.hasLocalBusiness)} value={data.schema.hasLocalBusiness ? '✓' : '✗'}
          />
          <AuditItem
            id="3_9" title={t('techAudit.items.3_9.title')} description={t('techAudit.items.3_9.description')}
            status={fromBool(data.schema.hasPhysician)} value={data.schema.hasPhysician ? '✓' : '✗'}
          />
          <AuditItem
            id="3_10" title={t('techAudit.items.3_10.title')} description={t('techAudit.items.3_10.description')}
            status={fromBool(data.schema.hasMedicalSpecialty)} value={data.schema.hasMedicalSpecialty ? '✓' : '✗'}
          />
          <AuditItem
            id="3_11" title={t('techAudit.items.3_11.title')} description={t('techAudit.items.3_11.description')}
            status={fromBool(data.schema.hasMedicalProcedure)} value={data.schema.hasMedicalProcedure ? '✓' : '✗'}
          />
          <AuditItem
            id="3_12" title={t('techAudit.items.3_12.title')} description={t('techAudit.items.3_12.description')}
            status={fromBool(data.schema.hasFAQPage)} value={data.schema.hasFAQPage ? '✓' : '✗'}
          />
          <AuditItem
            id="3_13" title={t('techAudit.items.3_13.title')} description={t('techAudit.items.3_13.description')}
            status={fromBool(data.schema.hasReview)} value={data.schema.hasReview ? '✓' : '✗'}
          />
          <AuditItem
            id="3_14" title={t('techAudit.items.3_14.title')} description={t('techAudit.items.3_14.description')}
            status={fromBool(data.schema.hasBreadcrumbList)} value={data.schema.hasBreadcrumbList ? '✓' : '✗'}
          />
        </div>
      </section>

      {/* Category 4: SEO Basics */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900">
          <Search className="h-6 w-6 text-primary" />
          {t('techAudit.groups.seo')}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <AuditItem
            id="3_15"
            title={t('techAudit.items.3_15.title')}
            description={t('techAudit.items.3_15.description')}
            status={fromBool(!!data.meta.lang)}
            value={data.meta.lang || 'Не вказано'}
          />
          <AuditItem
            id="3_16"
            title={t('techAudit.items.3_16.title')}
            description={t('techAudit.items.3_16.description')}
            status={data.meta.hreflangs?.length > 0 ? 'good' : 'neutral'}
            value={`${data.meta.hreflangs?.length || 0} версій`}
          >
            {data.meta.hreflangs?.length > 0 && (
              <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-200 text-[10px] grid grid-cols-1 gap-1">
                {data.meta.hreflangs.map((h, i) => (
                  <div key={i} className="flex justify-between border-b border-slate-200 pb-1 last:border-0 last:pb-0">
                    <span className="font-bold text-slate-900">{h.lang}</span>
                    <span className="truncate max-w-[200px] text-slate-500">{h.url}</span>
                  </div>
                ))}
              </div>
            )}
          </AuditItem>
          <AuditItem
            id="3_17"
            title={t('techAudit.items.3_17.title')}
            description={t('techAudit.items.3_17.description')}
            status={data.externalLinks.broken === 0 ? 'good' : 'warning'}
            value={`${data.externalLinks.total} посилань`}
          >
            <div className="flex gap-4 text-xs">
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg font-bold">Біті: {data.externalLinks.broken}</div>
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-2 rounded-lg font-bold">Довірені: {data.externalLinks.trusted}</div>
            </div>
          </AuditItem>
          <AuditItem
            id="3_18"
            title={t('techAudit.items.3_18.title')}
            description={t('techAudit.items.3_18.description')}
            status={data.meta.titleLength && data.meta.titleLength >= 30 && data.meta.titleLength <= 65 ? 'good' : 'warning'}
            value={`${data.meta.titleLength || 0} симв.`}
          >
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200 text-xs italic font-medium text-slate-700">&quot;{data.meta.title}&quot;</div>
          </AuditItem>
          <AuditItem
            id="3_19"
            title={t('techAudit.items.3_19.title')}
            description={t('techAudit.items.3_19.description')}
            status={data.meta.descriptionLength && data.meta.descriptionLength >= 120 && data.meta.descriptionLength <= 165 ? 'good' : 'warning'}
            value={`${data.meta.descriptionLength || 0} симв.`}
          >
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200 text-xs italic text-slate-600">&quot;{data.meta.description}&quot;</div>
          </AuditItem>
          <AuditItem
            id="3_20"
            title={t('techAudit.items.3_20.title')}
            description={t('techAudit.items.3_20.description')}
            status={fromBool(!!data.meta.canonical)}
            value={data.meta.canonical ? 'ОК' : 'Відсутній'}
          >
            {data.meta.canonical && <p className="text-[10px] break-all text-slate-500">{data.meta.canonical}</p>}
          </AuditItem>
          <AuditItem
            id="3_21"
            title={t('techAudit.items.3_21.title')}
            description={t('techAudit.items.3_21.description')}
            status={data.meta.robots?.includes('noindex') ? 'warning' : 'good'}
            value={data.meta.robots?.includes('noindex') ? 'Noindex' : 'Index'}
          />
          <AuditItem
            id="3_22"
            title={t('techAudit.items.3_22.title')}
            description={t('techAudit.items.3_22.description')}
            status={data.externalLinks.trusted > 0 ? 'good' : 'warning'}
            value={`${data.externalLinks.trusted} довірених`}
          >
            <p className="text-xs text-slate-500 mb-2">
              Аналіз вихідних посилань на авторитетні домени (PubMed, WHO, та ін.).
            </p>
            <div className="text-[10px] space-y-1 text-slate-600">
              <p>Всього зовнішніх посилань: <strong className="font-bold text-slate-900">{data.externalLinks.total}</strong></p>
              <p>Довірених посилань (E-E-A-T): <strong className="font-bold text-slate-900">{data.externalLinks.trusted}</strong></p>
            </div>
          </AuditItem>
        </div>
      </section>

      {/* Category 5: Speed & Content */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900">
          <Gauge className="h-6 w-6 text-primary" />
          {t('techAudit.groups.performance')}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <AuditItem
            id="3_23"
            title={t('techAudit.items.3_23.title')}
            description={t('techAudit.items.3_23.description')}
            status={
              data.duplicates.wwwRedirect === 'ok' &&
                data.duplicates.trailingSlash === 'ok' &&
                data.duplicates.httpRedirect === 'ok'
                ? 'good' : 'warning'
            }
            value={data.duplicates.wwwRedirect === 'ok' ? 'Налаштовано' : 'Є зауваження'}
          >
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-200 p-3 rounded-lg">
                <span className="font-medium text-slate-700">WWW Редирект</span>
                <Badge variant={data.duplicates.wwwRedirect === 'ok' ? 'default' : 'destructive'}
                  className={data.duplicates.wwwRedirect === 'ok' ? 'bg-emerald-100 text-emerald-800' : ''}>
                  {data.duplicates.wwwRedirect === 'ok' ? 'OK' : 'Помилка'}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-200 p-3 rounded-lg">
                <span className="font-medium text-slate-700">Trailing Slash</span>
                <Badge variant={data.duplicates.trailingSlash === 'ok' ? 'default' : 'destructive'}
                  className={data.duplicates.trailingSlash === 'ok' ? 'bg-emerald-100 text-emerald-800' : ''}>
                  {data.duplicates.trailingSlash === 'ok' ? 'OK' : 'Помилка'}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-200 p-3 rounded-lg">
                <span className="font-medium text-slate-700">HTTP Редирект</span>
                <Badge variant={data.duplicates.httpRedirect === 'ok' ? 'default' : 'destructive'}
                  className={data.duplicates.httpRedirect === 'ok' ? 'bg-emerald-100 text-emerald-800' : ''}>
                  {data.duplicates.httpRedirect === 'ok' ? 'OK' : 'Помилка'}
                </Badge>
              </div>
            </div>
          </AuditItem>
          <AuditItem
            id="3_24"
            title={t('techAudit.items.3_24.title')}
            description={t('techAudit.items.3_24.description')}
            status={data.speed.desktop !== null && data.speed.desktop >= 90 ? 'good' : data.speed.desktop !== null && data.speed.desktop >= 50 ? 'warning' : 'bad'}
            score={data.speed.desktop}
          />
          <AuditItem
            id="3_25"
            title={t('techAudit.items.3_25.title')}
            description={t('techAudit.items.3_25.description')}
            status={data.speed.mobile !== null && data.speed.mobile >= 90 ? 'good' : data.speed.mobile !== null && data.speed.mobile >= 50 ? 'warning' : 'bad'}
            score={data.speed.mobile}
          />
        </div>
      </section>
    </div>
  );
}
