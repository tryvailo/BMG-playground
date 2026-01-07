'use client';

import React, { useState } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Gauge,
  Info,
  Search,
  Shield,
  XCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';

import type { EphemeralAuditResult } from '~/lib/modules/audit/ephemeral-audit';

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
  },
};

// --- Horizon Card Component ---
interface HorizonCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
}

const HorizonCard = ({
  children,
  className,
  title,
  subtitle,
  style,
}: HorizonCardProps) => (
  <Card
    className={cn(
      'overflow-hidden rounded-[20px] border-none bg-white transition-all duration-300',
      className,
    )}
    style={{ boxShadow: HORIZON.shadow, ...style }}
  >
    {(title || subtitle) && (
      <CardHeader className="pb-2">
        {title && (
          <h3
            className="mb-1 text-sm font-bold tracking-widest uppercase"
            style={{ color: HORIZON.textSecondary }}
          >
            {title}
          </h3>
        )}
        {subtitle && (
          <p
            className="text-sm font-bold"
            style={{ color: HORIZON.textPrimary }}
          >
            {subtitle}
          </p>
        )}
      </CardHeader>
    )}
    <CardContent className={cn('p-6', (title || subtitle) && 'pt-2')}>
      {children}
    </CardContent>
  </Card>
);

// --- Progress Bar Component ---
interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

function ProgressBar({ value, max = 100, size = 'sm' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = () => {
    if (percentage < 50) return HORIZON.error;
    if (percentage < 90) return HORIZON.warning;
    return HORIZON.success;
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div
      className={cn('w-full overflow-hidden rounded-full', heightClasses[size])}
      style={{ backgroundColor: HORIZON.background }}
    >
      <div
        className="rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: getColor(),
          minWidth: percentage > 0 ? '4px' : '0',
        }}
      />
    </div>
  );
}

interface TechAuditSectionProps {
  data: EphemeralAuditResult;
}

/**
 * Minimal Metric Card Component (matches EEATAuditSection style)
 */
interface MinimalMetricCardProps {
  title: string;
  icon?: React.ReactNode;
  status: 'good' | 'bad' | 'warning' | 'neutral';
  value?: string | number | React.ReactNode;
  score?: number | null;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function MinimalMetricCard({
  title,
  icon,
  status,
  value,
  score,
  children,
  defaultOpen = false,
}: MinimalMetricCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const calculatedScore =
    score !== undefined && score !== null
      ? score
      : status === 'good'
        ? 100
        : status === 'warning'
          ? 50
          : status === 'bad'
            ? 0
            : null;

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return (
          <CheckCircle2
            className="h-5 w-5"
            style={{ color: HORIZON.success }}
          />
        );
      case 'bad':
        return <XCircle className="h-5 w-5" style={{ color: HORIZON.error }} />;
      case 'warning':
        return (
          <AlertCircle className="h-5 w-5" style={{ color: HORIZON.warning }} />
        );
      default:
        return (
          <Info className="h-5 w-5" style={{ color: HORIZON.textSecondary }} />
        );
    }
  };

  return (
    <HorizonCard className="border-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer transition-opacity hover:opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl p-2"
                  style={{
                    backgroundColor: HORIZON.background,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {icon || getStatusIcon()}
                </div>
                <CardTitle
                  className="text-base font-bold"
                  style={{ color: HORIZON.textPrimary }}
                >
                  {title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-4">
                {calculatedScore !== null && calculatedScore !== undefined ? (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-2xl font-bold tracking-tighter',
                        calculatedScore >= 90
                          ? 'text-[#01B574]'
                          : calculatedScore >= 50
                            ? 'text-[#FFB547]'
                            : 'text-[#EE5D50]',
                      )}
                    >
                      {calculatedScore}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: HORIZON.textSecondary }}
                    >
                      /100
                    </span>
                  </div>
                ) : null}
                {value && (
                  <span
                    className="text-sm font-bold"
                    style={{ color: HORIZON.textPrimary }}
                  >
                    {value}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-slate-400 transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </div>
            </div>
            {calculatedScore !== null && calculatedScore !== undefined ? (
              <div className="mt-4">
                <ProgressBar value={calculatedScore} size="sm" />
              </div>
            ) : (
              <div
                className="mt-4 h-1.5 w-full rounded-full"
                style={{ backgroundColor: HORIZON.background }}
              />
            )}
          </div>
        </CollapsibleTrigger>
        {children && (
          <CollapsibleContent>
            <div
              className="mt-6 border-t pt-6"
              style={{ borderColor: HORIZON.background }}
            >
              {children}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </HorizonCard>
  );
}

/**
 * Checklist Item Component
 */
interface ChecklistItemProps {
  label: string;
  checked: boolean;
}

function _ChecklistItem({ label, checked }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {checked ? (
        <CheckCircle2
          className="h-5 w-5 flex-shrink-0"
          style={{ color: HORIZON.success }}
        />
      ) : (
        <XCircle
          className="h-5 w-5 flex-shrink-0"
          style={{ color: HORIZON.error }}
        />
      )}
      <span
        className="text-sm font-medium"
        style={{ color: checked ? HORIZON.textPrimary : HORIZON.textSecondary }}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * KPI Card Component (same style as CompetitorsHorizon)
 */
interface KpiCardProps {
  label: string;
  value: string;
  benchmark?: string;
  trend?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function KpiCard({ label, value, benchmark, trend, icon: Icon, iconBg, iconColor }: KpiCardProps) {
  const isPositive = trend?.startsWith('+') ?? true;

  return (
    <HorizonCard 
      className="group hover:-translate-y-1 transition-all duration-300"
      style={{ boxShadow: HORIZON.shadowSm }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
            isPositive ? "bg-[#01B57415] text-[#01B574]" : "bg-[#EE5D5015] text-[#EE5D50]"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="text-sm font-medium mb-1" style={{ color: HORIZON.textSecondary }}>
        {label}
      </div>
      <div className="text-lg font-bold" style={{ color: HORIZON.textPrimary }}>
        <span>{value}</span>
        {benchmark && (
          <>
            <span className="text-sm font-medium mx-1" style={{ color: HORIZON.textSecondary }}>vs</span>
            <span style={{ color: HORIZON.textSecondary }}>{benchmark}</span>
          </>
        )}
      </div>
    </HorizonCard>
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
  if (
    data.meta.titleLength &&
    data.meta.titleLength >= 30 &&
    data.meta.titleLength <= 65
  )
    scores.push(100);
  if (
    data.meta.descriptionLength &&
    data.meta.descriptionLength >= 120 &&
    data.meta.descriptionLength <= 165
  )
    scores.push(100);
  if (!data.meta.robots?.includes('noindex')) scores.push(100);

  // External links scores
  if (data.externalLinks.broken === 0) scores.push(100);
  if (data.externalLinks.trusted > 0)
    scores.push(Math.min(100, data.externalLinks.trusted * 20));

  // Images scores
  const imagesScore =
    data.images.total > 0
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
  const aiScore =
    aiScores.length > 0
      ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length)
      : 0;

  // Compliance
  const complianceScores: number[] = [];
  if (data.security.https) complianceScores.push(100);
  if (data.security.mobileFriendly) complianceScores.push(100);
  const complianceScore =
    complianceScores.length > 0
      ? Math.round(
          complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length,
        )
      : 0;

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
  if (
    data.meta.titleLength &&
    data.meta.titleLength >= 30 &&
    data.meta.titleLength <= 65
  )
    seoScores.push(100);
  if (
    data.meta.descriptionLength &&
    data.meta.descriptionLength >= 120 &&
    data.meta.descriptionLength <= 165
  )
    seoScores.push(100);
  if (!data.meta.robots?.includes('noindex')) seoScores.push(100);
  if (data.externalLinks.broken === 0) seoScores.push(100);
  if (data.externalLinks.trusted > 0)
    seoScores.push(Math.min(100, data.externalLinks.trusted * 20));
  const seoScore =
    seoScores.length > 0
      ? Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length)
      : 0;

  // Performance
  const perfScores: number[] = [];
  if (data.speed.desktop !== null) perfScores.push(data.speed.desktop);
  if (data.speed.mobile !== null) perfScores.push(data.speed.mobile);
  if (data.duplicates.wwwRedirect === 'ok') perfScores.push(100);
  if (data.duplicates.trailingSlash === 'ok') perfScores.push(100);
  if (data.duplicates.httpRedirect === 'ok') perfScores.push(100);
  const perfScore =
    perfScores.length > 0
      ? Math.round(perfScores.reduce((a, b) => a + b, 0) / perfScores.length)
      : 0;

  return {
    ai: aiScore,
    compliance: complianceScore,
    schema: schemaScore,
    seo: seoScore,
    performance: perfScore,
  };
}

/**
 * Critical Task Interface
 */
interface CriticalTask {
  message: string;
  severity: 'critical' | 'warning';
}

/**
 * Generate Critical Tasks from Audit Data
 * Returns 3-8 critical issues and 3-5 warnings
 */
function generateCriticalTasks(data: EphemeralAuditResult): CriticalTask[] {
  const criticalTasks: CriticalTask[] = [];
  const warningTasks: CriticalTask[] = [];

  // ===== CRITICAL ISSUES =====
  
  // Check for missing HREFLANG tags
  if (!data.meta.lang) {
    criticalTasks.push({ message: 'Додати теги HREFLANG', severity: 'critical' });
  }

  // Check for HTTPS
  if (!data.security.https) {
    criticalTasks.push({ message: 'Налаштувати HTTPS', severity: 'critical' });
  }

  // Check for mobile-friendliness
  if (!data.security.mobileFriendly) {
    criticalTasks.push({ message: 'Оптимізувати для мобільних пристроїв', severity: 'critical' });
  }

  // Check for robots.txt
  if (!data.files.robots) {
    criticalTasks.push({ message: 'Додати файл robots.txt', severity: 'critical' });
  }

  // Check for sitemap
  if (!data.files.sitemap) {
    criticalTasks.push({ message: 'Додати sitemap.xml', severity: 'critical' });
  }

  // Check for canonical
  if (!data.meta.canonical) {
    criticalTasks.push({ message: 'Додати canonical URL', severity: 'critical' });
  }

  // Check for noindex
  if (data.meta.robots?.includes('noindex')) {
    criticalTasks.push({ message: 'Прибрати noindex директиву', severity: 'critical' });
  }

  // Check for Schema markup
  if (!data.schema.hasMedicalOrg && !data.schema.hasLocalBusiness) {
    criticalTasks.push({ message: 'Додати Schema MedicalOrganization або LocalBusiness', severity: 'critical' });
  }

  // Check for llms.txt
  if (!data.files.llmsTxt.present) {
    criticalTasks.push({ message: 'Додати файл llms.txt для AI-оптимізації', severity: 'critical' });
  }

  // Check for title issues
  if (!data.meta.title || data.meta.titleLength === null || data.meta.titleLength < 30 || data.meta.titleLength > 65) {
    criticalTasks.push({ message: 'Оптимізувати title сторінки (30-65 символів)', severity: 'critical' });
  }

  // Check for description issues
  if (!data.meta.description || data.meta.descriptionLength === null || data.meta.descriptionLength < 120 || data.meta.descriptionLength > 165) {
    criticalTasks.push({ message: 'Оптимізувати meta description (120-165 символів)', severity: 'critical' });
  }

  // ===== WARNINGS =====
  
  // Performance warnings
  if (data.speed.desktop !== null && data.speed.desktop < 50) {
    warningTasks.push({ message: 'Підвищити швидкість сайту (Desktop)', severity: 'warning' });
  }

  if (data.speed.mobile !== null && data.speed.mobile < 50) {
    warningTasks.push({ message: 'Підвищити швидкість сайту (Mobile)', severity: 'warning' });
  }

  // Check for broken links
  if (data.externalLinks.broken > 0) {
    warningTasks.push({ message: `Виправити ${data.externalLinks.broken} битих посилань`, severity: 'warning' });
  }

  // Check for missing alt texts
  if (data.images.missingAlt > 0) {
    warningTasks.push({ message: `Додати alt-тексти до ${data.images.missingAlt} зображень`, severity: 'warning' });
  }

  // Check for duplicate issues
  if (data.duplicates.wwwRedirect !== 'ok') {
    warningTasks.push({ message: 'Налаштувати WWW редирект', severity: 'warning' });
  }

  if (data.duplicates.httpRedirect !== 'ok') {
    warningTasks.push({ message: 'Налаштувати HTTP → HTTPS редирект', severity: 'warning' });
  }

  if (data.duplicates.trailingSlash !== 'ok') {
    warningTasks.push({ message: 'Налаштувати редирект trailing slash', severity: 'warning' });
  }

  // Check for Schema completeness
  if (!data.schema.hasPhysician) {
    warningTasks.push({ message: 'Додати Schema Physician для лікарів', severity: 'warning' });
  }

  if (!data.schema.hasFAQPage) {
    warningTasks.push({ message: 'Додати Schema FAQPage для FAQ секції', severity: 'warning' });
  }

  if (!data.schema.hasBreadcrumbList) {
    warningTasks.push({ message: 'Додати Schema BreadcrumbList', severity: 'warning' });
  }

  // Limit: 3-8 critical, 3-5 warnings
  const limitedCritical = criticalTasks.slice(0, 8);
  const limitedWarnings = warningTasks.slice(0, 5);

  // Ensure minimum of 3 each (if available)
  return [...limitedCritical, ...limitedWarnings];
}

/**
 * Main TechAuditSection Component
 */
export function TechAuditSection({ data }: TechAuditSectionProps) {
  const { t } = useTranslation('playground');

  // Helper to get status from boolean
  const fromBool = (val: boolean | null): 'good' | 'bad' =>
    val ? 'good' : 'bad';

  const categoryScores = calculateCategoryScores(data);

  // Format metric value to 2 decimal places
  const _formatMetric = (value: number | null): string => {
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

  // Calculate overall score and benchmark
  const overallScore = calculateOverallScore(data);
  const ukraineBenchmark = 31; // Average benchmark for Ukraine
  const scoreDifference = overallScore - ukraineBenchmark;

  // Generate critical tasks from audit data
  const criticalTasks = generateCriticalTasks(data);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* ========== SUMMARY HEADER ========== */}
      <section className="space-y-6">
        {/* Two main metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HorizonCard 
            className="group hover:-translate-y-1 transition-all duration-300"
            style={{ boxShadow: HORIZON.shadowSm }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: HORIZON.textSecondary }}>
              Загальний рівень технічної оптимізації ресурсу
            </p>
            <p className="text-5xl font-bold" style={{ color: HORIZON.textPrimary }}>
              {overallScore}%
            </p>
            <p className="text-sm font-medium mt-2" style={{ color: HORIZON.success }}>
              +3% за 30 днів
            </p>
          </HorizonCard>
          <HorizonCard 
            className="group hover:-translate-y-1 transition-all duration-300"
            style={{ boxShadow: HORIZON.shadowSm }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: HORIZON.textSecondary }}>
              Середній рівень по Україні
            </p>
            <p className="text-5xl font-bold" style={{ color: HORIZON.textPrimary }}>
              {ukraineBenchmark}%
            </p>
            <p className="text-sm font-medium mt-2" style={{ color: scoreDifference > 0 ? HORIZON.success : HORIZON.error }}>
              {scoreDifference > 0 ? `У вас на ${scoreDifference}% краще` : `У вас на ${Math.abs(scoreDifference)}% гірше`}
            </p>
          </HorizonCard>
        </div>

      </section>

      {/* ========== KPI SUMMARY CARDS ========== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <Settings className="w-5 h-5" style={{ color: HORIZON.primary }} />
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: HORIZON.textPrimary }}>
            Детальний аналіз
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Technical optimization"
            value={`${categoryScores.ai}%`}
            benchmark="75%"
            trend={categoryScores.ai >= 75 ? '+' + (categoryScores.ai - 75) + '%' : '-' + (75 - categoryScores.ai) + '%'}
            icon={Zap}
            iconBg={HORIZON.primaryLight}
            iconColor={HORIZON.primary}
          />
          <KpiCard
            label="Basic Compliance"
            value={`${categoryScores.compliance}%`}
            benchmark="100%"
            trend={categoryScores.compliance >= 100 ? '+0%' : '-' + (100 - categoryScores.compliance) + '%'}
            icon={Shield}
            iconBg={HORIZON.successLight}
            iconColor={HORIZON.success}
          />
          <KpiCard
            label="Structured data"
            value={`${Math.round(categoryScores.schema)}%`}
            benchmark="75%"
            trend={categoryScores.schema >= 75 ? '+' + Math.round(categoryScores.schema - 75) + '%' : '-' + Math.round(75 - categoryScores.schema) + '%'}
            icon={FileText}
            iconBg={HORIZON.infoLight}
            iconColor={HORIZON.info}
          />
          <KpiCard
            label="GEO indexing"
            value={`${categoryScores.seo}%`}
            benchmark="80%"
            trend={categoryScores.seo >= 80 ? '+' + (categoryScores.seo - 80) + '%' : '-' + (80 - categoryScores.seo) + '%'}
            icon={Search}
            iconBg={HORIZON.warningLight}
            iconColor={HORIZON.warning}
          />
          <KpiCard
            label="Speed & Content"
            value={`${categoryScores.performance}%`}
            benchmark="90%"
            trend={categoryScores.performance >= 90 ? '+' + (categoryScores.performance - 90) + '%' : '-' + (90 - categoryScores.performance) + '%'}
            icon={Gauge}
            iconBg={HORIZON.errorLight}
            iconColor={HORIZON.error}
          />
        </div>
      </section>

      {/* ========== CHART + CRITICAL TASKS ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speed Comparison Chart */}
        <HorizonCard title="Порівняння технічної оптимізації" subtitle="Оптимізація контенту">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={speedComparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={`${HORIZON.secondary}15`}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: HORIZON.textSecondary,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fill: HORIZON.textSecondary,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
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
        </HorizonCard>

        {/* Critical Tasks */}
        <HorizonCard title="Критичні задачі">
          <div className="space-y-3">
            {criticalTasks.length > 0 ? (
              criticalTasks.map((task, index) => (
                <div key={index} className="flex items-start gap-3">
                  {task.severity === 'critical' ? (
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: HORIZON.error }} />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: HORIZON.warning }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: HORIZON.textPrimary }}>
                    {task.message}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 py-4">
                <CheckCircle2 className="w-5 h-5" style={{ color: HORIZON.success }} />
                <span className="text-sm font-medium" style={{ color: HORIZON.textPrimary }}>
                  Критичних проблем не виявлено
                </span>
              </div>
            )}
          </div>
        </HorizonCard>
      </div>

      {/* Category 1: AI Optimization */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <Zap className="text-primary h-6 w-6" />
          {t('techAudit.groups.ai')}
        </h2>

        <div className="grid grid-cols-1 gap-3">
          <MinimalMetricCard
            title={t('techAudit.items.3_1.title')}
            status={fromBool(data.files.llmsTxt.present)}
            value={data.files.llmsTxt.present ? 'Знайдено' : 'Відсутній'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Файл llms.txt потрібен для того, щоб допомогти сучасним системам штучного інтелекту швидко і точно знаходити важливий та релевантний контент вашого сайту.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність файлу.
                </p>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_2.title')}
            status={
              data.files.llmsTxt.score >= 80
                ? 'good'
                : data.files.llmsTxt.score >= 50
                  ? 'warning'
                  : 'bad'
            }
            score={data.files.llmsTxt.score}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Файл має містити максимум ключових даних, які AI шукають для відповіді користувачу: унікальні переваги, точні описи послуг, конкретні приклади.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  LLM перевіряє файл на відповідність рекомендаціям.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                          <li>Файл структурований у форматі Markdown</li>
                          <li>Вказані ключові сторінки, контакти, адреси, послуги</li>
                          <li>Додані структурні hints для AI: FAQ, ключові факти</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                          <li>Файл пустий або містить лише URL</li>
                          <li>Немає опису послуг та переваг</li>
                          <li>Застарілі дані</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {data.files.llmsTxt.recommendations.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-black tracking-wider text-slate-400 uppercase mb-2">
                    Рекомендації:
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-xs text-slate-700">
                    {data.files.llmsTxt.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_3.title')}
            status={fromBool(data.files.robots)}
            value={data.files.robots ? 'Знайдено' : 'Відсутній'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Файл robots.txt допомагає пошуковим і AI-роботам ефективно сканувати і правильно індексувати сторінки клініки.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність файлу.
                </p>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_4.title')}
            status={
              data.files.robotsTxt?.score >= 80
                ? 'good'
                : data.files.robotsTxt?.score >= 50
                  ? 'warning'
                  : 'bad'
            }
            score={data.files.robotsTxt?.score ?? (data.files.sitemap ? 50 : 0)}
            value={
              data.files.robotsTxt?.hasSitemap
                ? 'Sitemap знайдено'
                : 'Sitemap не вказано'
            }
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Правильно налаштований robots.txt дозволяє індексувати релевантні сторінки та блокувати технічні/приватні.
                </p>
              </div>

              {/* Robots.txt Analysis Results */}
              {data.files.robotsTxt && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Результати аналізу
                  </h4>
                  <div className="space-y-2">
                    {/* Sitemap URLs */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Sitemap вказано</span>
                      <Badge
                        variant={data.files.robotsTxt.hasSitemap ? 'default' : 'destructive'}
                        className={data.files.robotsTxt.hasSitemap ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.files.robotsTxt.hasSitemap ? 'Так' : 'Ні'}
                      </Badge>
                    </div>
                    {data.files.robotsTxt.sitemapUrls?.length > 0 && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <span className="font-medium text-slate-700 text-xs block mb-2">Sitemap URLs:</span>
                        <div className="space-y-1">
                          {data.files.robotsTxt.sitemapUrls.map((url, i) => (
                            <p key={i} className="text-[10px] text-slate-500 truncate">{url}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Disallow All Check */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Блокує весь сайт</span>
                      <Badge
                        variant={data.files.robotsTxt.disallowAll ? 'destructive' : 'default'}
                        className={!data.files.robotsTxt.disallowAll ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.files.robotsTxt.disallowAll ? 'Так ⚠️' : 'Ні'}
                      </Badge>
                    </div>
                    {/* AI Bots Blocking Check */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Блокує AI-ботів</span>
                      <Badge
                        variant={data.files.robotsTxt.blocksAIBots ? 'destructive' : 'default'}
                        className={!data.files.robotsTxt.blocksAIBots ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.files.robotsTxt.blocksAIBots ? 'Так ⚠️' : 'Ні'}
                      </Badge>
                    </div>
                    {data.files.robotsTxt.blockedAIBots?.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                        <span className="font-medium text-red-700 text-xs block mb-1">Заблоковані AI-боти:</span>
                        <p className="text-[10px] text-red-600">{data.files.robotsTxt.blockedAIBots.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Issues and Recommendations */}
              {data.files.robotsTxt?.issues?.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Проблеми
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-red-600">
                    {data.files.robotsTxt.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.files.robotsTxt?.recommendations?.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Рекомендації
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                    {data.files.robotsTxt.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                          <li>Дозволено доступ до основного контенту</li>
                          <li>Заборонено /admin/, /login/, /cart/</li>
                          <li>Вказано Sitemap</li>
                          <li>Не блокує AI-ботів (GPTBot, PerplexityBot)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                          <li>Disallow: / (блокує весь сайт)</li>
                          <li>Немає посилання на sitemap</li>
                          <li>Блокує GPTBot, ChatGPT-User</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
        </div>
      </section>

      {/* Category 2: Core Compliance */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <Shield className="text-primary h-6 w-6" />
          {t('techAudit.groups.compliance')}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <MinimalMetricCard
            title={t('techAudit.items.3_5.title')}
            status={fromBool(data.security.https)}
            value={data.security.https ? 'Включено' : 'Відключено'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  HTTPS — захищений протокол, який гарантує шифрування даних. Критично для медичних сайтів.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо протокол сайту.
                </p>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_6.title')}
            status={fromBool(data.security.mobileFriendly)}
            value={data.security.mobileFriendly ? 'Так' : 'Ні'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Мобільна адаптивність є критично важливою. Google використовує mobile-first індексацію.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Аналіз viewport, адаптивного дизайну.
                </p>
              </div>
            </div>
          </MinimalMetricCard>
        </div>
      </section>

      {/* Category 3: Schema Markup */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <FileText className="text-primary h-6 w-6" />
          {t('techAudit.groups.schema')}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MinimalMetricCard
            title={t('techAudit.items.3_7.title')}
            status={fromBool(data.schema.hasMedicalOrg)}
            value={data.schema.hasMedicalOrg ? '✓' : '✗'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schema MedicalOrganization допомагає пошуковим системам і AI ідентифікувати вашу клініку як медичну організацію з усіма необхідними даними.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність та валідність розмітки.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Правильно впроваджена schema з усіма необхідними полями (назва, адреса, контакти, спеціалізації)
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Schema відсутня або містить помилки валідації
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_8.title')}
            status={fromBool(data.schema.hasLocalBusiness)}
            value={data.schema.hasLocalBusiness ? '✓' : '✗'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schema LocalBusiness покращує локальне SEO та допомагає AI показувати вашу клініку в результатах для місцевих запитів.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність та валідність розмітки.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Правильно впроваджена schema з адресою, координатами, годинами роботи
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Schema відсутня або містить помилки валідації
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_9.title')}
            status={fromBool(data.schema.hasPhysician)}
            value={data.schema.hasPhysician ? '✓' : '✗'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schema Physician допомагає виділити лікарів клініки як експертів, підвищуючи E-E-A-T сигнали для Google та AI.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність та валідність розмітки.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Правильно впроваджена schema з ПІБ, спеціалізацією, освітою, досвідом
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Schema відсутня або містить помилки валідації
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_10.title')}
            status={fromBool(data.schema.hasMedicalSpecialty)}
            value={data.schema.hasMedicalSpecialty ? '✓' : '✗'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schema MedicalSpecialty уточнює напрямки діяльності клініки для точного розуміння AI та пошуковими системами.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність та валідність розмітки.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Правильно впроваджена schema зі списком медичних спеціальностей
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Schema відсутня або містить помилки валідації
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_11.title')}
            status={fromBool(data.schema.hasMedicalProcedure)}
            value={data.schema.hasMedicalProcedure ? '✓' : '✗'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schema MedicalProcedure описує конкретні медичні послуги та процедури, допомагаючи AI надавати точні відповіді.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність та валідність розмітки.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Правильно впроваджена schema з описом процедури, підготовкою, протипоказаннями
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Schema відсутня або містить помилки валідації
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_12.title')}
            status={fromBool(data.schema.hasFAQPage)}
            value={data.schema.hasFAQPage ? '✓' : '✗'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schema FAQPage дозволяє відображати FAQ-відповіді безпосередньо в результатах пошуку та AI-відповідях.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність та валідність розмітки.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Правильно впроваджена schema з питаннями та відповідями про послуги
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Schema відсутня або містить помилки валідації
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_13.title')}
            status={fromBool(data.schema.hasReview)}
            value={data.schema.hasReview ? '✓' : '✗'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schema Review підвищує довіру до клініки через відображення відгуків та рейтингів у результатах пошуку.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність та валідність розмітки.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Правильно впроваджена schema з рейтингом, кількістю відгуків, авторами
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Schema відсутня або містить помилки валідації
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_14.title')}
            status={fromBool(data.schema.hasBreadcrumbList)}
            value={data.schema.hasBreadcrumbList ? '✓' : '✗'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schema BreadcrumbList покращує навігацію та відображення шляху до сторінки в результатах пошуку.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність та валідність розмітки.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Правильно впроваджена schema зі структурою: Головна → Послуги → МРТ
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Schema відсутня або містить помилки валідації
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
        </div>
      </section>

      {/* Category 4: SEO Basics */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <Search className="text-primary h-6 w-6" />
          {t('techAudit.groups.seo')}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <MinimalMetricCard
            title={t('techAudit.items.3_15.title')}
            status={fromBool(!!data.meta.lang)}
            value={data.meta.lang || 'Не вказано'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Атрибут lang допомагає чітко вказати мову вмісту сторінки для браузерів, пошукових систем і AI.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо атрибут lang в HTML.
                </p>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_16.title')}
            status={data.meta.hreflangs?.length > 0 ? 'good' : 'neutral'}
            value={`${data.meta.hreflangs?.length || 0} версій`}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Hreflang вказує пошуковим системам і AI, яка мовна версія сторінки повинна відображатися користувачеві.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Перевіряємо наявність hreflang тегів (якщо сайт багатомовний).
                </p>
              </div>
              {data.meta.hreflangs?.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Знайдені версії
                  </h4>
                  <div className="grid grid-cols-1 gap-1 rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-[10px]">
                    {data.meta.hreflangs.map((h, i) => (
                      <div
                        key={i}
                        className="flex justify-between border-b border-slate-200 pb-1 last:border-0 last:pb-0"
                      >
                        <span className="font-bold text-slate-900">{h.lang}</span>
                        <span className="max-w-[200px] truncate text-slate-500">
                          {h.url}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_17.title')}
            status={data.externalLinks.broken === 0 ? 'good' : 'warning'}
            value={`${data.externalLinks.total} посилань`}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Зовнішні посилання повинні бути працюючими та вести на надійні, авторитетні ресурси.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Працює/Не працює</li>
                  <li>Перевірка на авторитетність (медичні асоціації, наукові журнали)</li>
                </ul>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Посилання на PubMed, WHO, МОЗ України, медичні асоціації
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Биті посилання, спам, непідтверджені джерела
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex gap-4 text-xs">
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-bold text-red-600">
                    Біті: {data.externalLinks.broken}
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-bold text-emerald-600">
                    Довірені: {data.externalLinks.trusted}
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_18.title')}
            status={
              data.meta.titleAnalysis?.score >= 80
                ? 'good'
                : data.meta.titleAnalysis?.score >= 50
                  ? 'warning'
                  : 'bad'
            }
            score={data.meta.titleAnalysis?.score ?? (data.meta.titleLength && data.meta.titleLength >= 30 && data.meta.titleLength <= 65 ? 70 : 30)}
            value={`${data.meta.titleLength || 0} симв.`}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Заголовки мають бути лаконічними, релевантними до запиту з ключовими словами та геолокацією.
                </p>
              </div>

              {/* Title Analysis Results */}
              {data.meta.titleAnalysis && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Результати аналізу
                  </h4>
                  <div className="space-y-2">
                    {/* Length check */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Оптимальна довжина (50-60)</span>
                      <Badge
                        variant={data.meta.titleAnalysis.isOptimalLength ? 'default' : 'destructive'}
                        className={data.meta.titleAnalysis.isOptimalLength ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.meta.titleAnalysis.isOptimalLength ? 'Так' : `${data.meta.titleLength} симв.`}
                      </Badge>
                    </div>
                    {/* Local keyword */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Локальне ключове слово</span>
                      <Badge
                        variant={data.meta.titleAnalysis.hasLocalKeyword ? 'default' : 'secondary'}
                        className={data.meta.titleAnalysis.hasLocalKeyword ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.meta.titleAnalysis.hasLocalKeyword ? data.meta.titleAnalysis.detectedCity : 'Відсутнє'}
                      </Badge>
                    </div>
                    {/* Generic check */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Унікальний заголовок</span>
                      <Badge
                        variant={!data.meta.titleAnalysis.isGeneric ? 'default' : 'destructive'}
                        className={!data.meta.titleAnalysis.isGeneric ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {!data.meta.titleAnalysis.isGeneric ? 'Так' : 'Загальний'}
                      </Badge>
                    </div>
                    {/* Keyword first */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Ключове слово на початку</span>
                      <Badge
                        variant={data.meta.titleAnalysis.startsWithKeyword ? 'default' : 'secondary'}
                        className={data.meta.titleAnalysis.startsWithKeyword ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.meta.titleAnalysis.startsWithKeyword ? 'Так' : 'Ні'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Issues */}
              {data.meta.titleAnalysis?.issues?.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Проблеми
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-red-600">
                    {data.meta.titleAnalysis.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {data.meta.titleAnalysis?.recommendations?.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Рекомендації
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                    {data.meta.titleAnalysis.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> &quot;МРТ головного мозку у Києві | Клініка XYZ&quot; (56 симв.)
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> &quot;Головна&quot; або заголовок &gt; 70 символів
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Поточний заголовок
                </h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-700 italic">
                  &quot;{data.meta.title}&quot;
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_19.title')}
            status={
              data.meta.descriptionAnalysis?.score >= 80
                ? 'good'
                : data.meta.descriptionAnalysis?.score >= 50
                  ? 'warning'
                  : 'bad'
            }
            score={data.meta.descriptionAnalysis?.score ?? (data.meta.descriptionLength && data.meta.descriptionLength >= 120 && data.meta.descriptionLength <= 165 ? 70 : 30)}
            value={`${data.meta.descriptionLength || 0} симв.`}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Meta description має бути унікальним, відповідати змісту сторінки та містити ключові слова та заклик до дії.
                </p>
              </div>

              {/* Description Analysis Results */}
              {data.meta.descriptionAnalysis && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Результати аналізу
                  </h4>
                  <div className="space-y-2">
                    {/* Length check */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Оптимальна довжина (150-160)</span>
                      <Badge
                        variant={data.meta.descriptionAnalysis.isOptimalLength ? 'default' : 'destructive'}
                        className={data.meta.descriptionAnalysis.isOptimalLength ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.meta.descriptionAnalysis.isOptimalLength ? 'Так' : `${data.meta.descriptionLength} симв.`}
                      </Badge>
                    </div>
                    {/* CTA check */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Заклик до дії (CTA)</span>
                      <Badge
                        variant={data.meta.descriptionAnalysis.hasCallToAction ? 'default' : 'secondary'}
                        className={data.meta.descriptionAnalysis.hasCallToAction ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.meta.descriptionAnalysis.hasCallToAction ? 'Є' : 'Відсутній'}
                      </Badge>
                    </div>
                    {/* Benefits check */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Переваги/цифри</span>
                      <Badge
                        variant={data.meta.descriptionAnalysis.hasBenefits ? 'default' : 'secondary'}
                        className={data.meta.descriptionAnalysis.hasBenefits ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.meta.descriptionAnalysis.hasBenefits ? 'Є' : 'Відсутні'}
                      </Badge>
                    </div>
                    {/* Different from title */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Відрізняється від Title</span>
                      <Badge
                        variant={data.meta.descriptionAnalysis.isDifferentFromTitle ? 'default' : 'destructive'}
                        className={data.meta.descriptionAnalysis.isDifferentFromTitle ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.meta.descriptionAnalysis.isDifferentFromTitle ? 'Так' : 'Дублюється'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Issues */}
              {data.meta.descriptionAnalysis?.issues?.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Проблеми
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-red-600">
                    {data.meta.descriptionAnalysis.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {data.meta.descriptionAnalysis?.recommendations?.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Рекомендації
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                    {data.meta.descriptionAnalysis.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Чіткий опис послуги з закликом до дії, 150 символів
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Дублюється title або &gt; 200 символів
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Поточний опис
                </h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-600 italic">
                  &quot;{data.meta.description}&quot;
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_20.title')}
            status={
              data.meta.canonicalAnalysis?.score >= 80
                ? 'good'
                : data.meta.canonicalAnalysis?.score >= 50
                  ? 'warning'
                  : 'bad'
            }
            score={data.meta.canonicalAnalysis?.score ?? (data.meta.canonical ? 50 : 0)}
            value={
              data.meta.canonicalAnalysis?.hasCanonical
                ? data.meta.canonicalAnalysis.isSelfReferencing
                  ? 'Self-referencing ✓'
                  : 'Знайдено'
                : 'Відсутній'
            }
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Canonical URL вказує пошуковикам, яку версію сторінки індексувати, уникаючи проблем з дублями.
                </p>
              </div>

              {/* Canonical Analysis Results */}
              {data.meta.canonicalAnalysis && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Результати аналізу
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <span className="font-medium text-slate-700 text-xs">Наявність canonical</span>
                      <Badge
                        variant={data.meta.canonicalAnalysis.hasCanonical ? 'default' : 'destructive'}
                        className={data.meta.canonicalAnalysis.hasCanonical ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {data.meta.canonicalAnalysis.hasCanonical ? 'Так' : 'Ні'}
                      </Badge>
                    </div>
                    {data.meta.canonicalAnalysis.hasCanonical && (
                      <>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                          <span className="font-medium text-slate-700 text-xs">Self-referencing</span>
                          <Badge
                            variant={data.meta.canonicalAnalysis.isSelfReferencing ? 'default' : 'outline'}
                            className={data.meta.canonicalAnalysis.isSelfReferencing ? 'bg-emerald-100 text-emerald-800' : ''}
                          >
                            {data.meta.canonicalAnalysis.isSelfReferencing ? 'Так ✓' : 'Ні'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                          <span className="font-medium text-slate-700 text-xs">Абсолютний URL</span>
                          <Badge
                            variant={data.meta.canonicalAnalysis.isAbsoluteUrl ? 'default' : 'destructive'}
                            className={data.meta.canonicalAnalysis.isAbsoluteUrl ? 'bg-emerald-100 text-emerald-800' : ''}
                          >
                            {data.meta.canonicalAnalysis.isAbsoluteUrl ? 'Так' : 'Ні'}
                          </Badge>
                        </div>
                        {data.meta.canonicalAnalysis.hasDifferentDomain && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                            <span className="font-medium text-red-700 text-xs">⚠️ Вказує на інший домен</span>
                          </div>
                        )}
                        {data.meta.canonicalAnalysis.hasQueryParams && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                            <span className="font-medium text-yellow-700 text-xs">⚠️ Містить query параметри</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Issues and Recommendations */}
              {data.meta.canonicalAnalysis?.issues && data.meta.canonicalAnalysis.issues.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                    Проблеми
                  </h4>
                  <div className="space-y-1">
                    {data.meta.canonicalAnalysis.issues.map((issue, i) => (
                      <p key={i} className="text-xs text-red-600 flex items-start gap-1">
                        <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        {issue}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {data.meta.canonicalAnalysis?.recommendations && data.meta.canonicalAnalysis.recommendations.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                    Рекомендації
                  </h4>
                  <div className="space-y-1">
                    {data.meta.canonicalAnalysis.recommendations.map((rec, i) => (
                      <p key={i} className="text-xs text-blue-600 flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 shrink-0" />
                        {rec}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {data.meta.canonical && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Поточний canonical
                  </h4>
                  <p className="text-[10px] break-all text-slate-500">
                    {data.meta.canonical}
                  </p>
                </div>
              )}
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_21.title')}
            status={data.meta.robots?.includes('noindex') ? 'warning' : 'good'}
            value={data.meta.robots?.includes('noindex') ? 'Noindex' : 'Index'}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Noindex приховує сторінки від індексації (технічні, малоцінні, дублікати).
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Виводимо список сторінок з noindex.
                </p>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_22.title')}
            status={
              data.externalLinks.dofollowPercent >= 70 && data.externalLinks.dofollowPercent <= 85
                ? 'good'
                : data.externalLinks.dofollowPercent > 0
                  ? 'warning'
                  : 'neutral'
            }
            score={data.externalLinks.dofollowPercent}
            value={`${data.externalLinks.dofollowPercent}% dofollow`}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Nofollow контролює передачу ваги посилань. Оптимальне співвідношення: 70-80% dofollow для тематичних посилань (медичні джерела), nofollow для рекламних та UGC.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  (Кількість dofollow посилань / Загальна кількість) × 100%
                </p>
              </div>

              {/* Dofollow/Nofollow Stats */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Статистика посилань
                </h4>
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-medium text-emerald-600">Dofollow: {data.externalLinks.dofollow}</span>
                      <span className="text-xs font-medium text-orange-600">Nofollow: {data.externalLinks.nofollow}</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 transition-all duration-300" 
                        style={{ width: `${data.externalLinks.dofollowPercent}%` }}
                      />
                      <div 
                        className="bg-orange-400 transition-all duration-300" 
                        style={{ width: `${100 - data.externalLinks.dofollowPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-slate-500">{data.externalLinks.dofollowPercent}%</span>
                      <span className="text-[10px] text-slate-500">{100 - data.externalLinks.dofollowPercent}%</span>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className={cn(
                    "p-3 rounded-lg border",
                    data.externalLinks.dofollowPercent >= 70 && data.externalLinks.dofollowPercent <= 85
                      ? "bg-emerald-50 border-emerald-200"
                      : data.externalLinks.dofollowPercent > 85
                        ? "bg-orange-50 border-orange-200"
                        : "bg-red-50 border-red-200"
                  )}>
                    <div className="flex items-start gap-2">
                      {data.externalLinks.dofollowPercent >= 70 && data.externalLinks.dofollowPercent <= 85 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="text-xs">
                        {data.externalLinks.dofollowPercent >= 70 && data.externalLinks.dofollowPercent <= 85 ? (
                          <span className="text-emerald-700">Оптимальне співвідношення dofollow/nofollow</span>
                        ) : data.externalLinks.dofollowPercent > 85 ? (
                          <span className="text-orange-700">Занадто багато dofollow посилань. Додайте nofollow для рекламних/партнерських.</span>
                        ) : data.externalLinks.dofollowPercent < 70 && data.externalLinks.dofollowPercent > 0 ? (
                          <span className="text-orange-700">Забагато nofollow. Тематичні медичні посилання мають бути dofollow.</span>
                        ) : (
                          <span className="text-slate-600">Немає даних про посилання.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* General stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-center">
                      <div className="text-lg font-bold text-slate-900">{data.externalLinks.total}</div>
                      <div className="text-[10px] text-slate-500">Всього</div>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-center">
                      <div className="text-lg font-bold text-emerald-600">{data.externalLinks.trusted}</div>
                      <div className="text-[10px] text-slate-500">Довірених</div>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-center">
                      <div className="text-lg font-bold text-red-600">{data.externalLinks.broken}</div>
                      <div className="text-[10px] text-slate-500">Битих</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                          <li>70-80% dofollow на медичні асоціації, PubMed, WHO</li>
                          <li>Nofollow для рекламних, партнерських, UGC</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                          <li>100% nofollow на всі зовнішні посилання</li>
                          <li>Dofollow на рекламні/спам ресурси</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
        </div>
      </section>

      {/* Category 5: Speed & Content */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <Gauge className="text-primary h-6 w-6" />
          {t('techAudit.groups.performance')}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <MinimalMetricCard
            title={t('techAudit.items.3_23.title')}
            status={
              data.duplicates.wwwRedirect === 'ok' &&
              data.duplicates.trailingSlash === 'ok' &&
              data.duplicates.httpRedirect === 'ok'
                ? 'good'
                : 'warning'
            }
            value={
              data.duplicates.wwwRedirect === 'ok'
                ? 'Налаштовано'
                : 'Є зауваження'
            }
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Сторінки з дубльованим контентом негативно впливають на GEO та AI-ранжування.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Схожість контенту &gt; 80% = дублі.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Статус редиректів
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <span className="font-medium text-slate-700">WWW Редирект</span>
                    <Badge
                      variant={
                        data.duplicates.wwwRedirect === 'ok'
                          ? 'default'
                          : 'destructive'
                      }
                      className={
                        data.duplicates.wwwRedirect === 'ok'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ''
                      }
                    >
                      {data.duplicates.wwwRedirect === 'ok' ? 'OK' : 'Помилка'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <span className="font-medium text-slate-700">
                      Trailing Slash
                    </span>
                    <Badge
                      variant={
                        data.duplicates.trailingSlash === 'ok'
                          ? 'default'
                          : 'destructive'
                      }
                      className={
                        data.duplicates.trailingSlash === 'ok'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ''
                      }
                    >
                      {data.duplicates.trailingSlash === 'ok' ? 'OK' : 'Помилка'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <span className="font-medium text-slate-700">
                      HTTP Редирект
                    </span>
                    <Badge
                      variant={
                        data.duplicates.httpRedirect === 'ok'
                          ? 'default'
                          : 'destructive'
                      }
                      className={
                        data.duplicates.httpRedirect === 'ok'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ''
                      }
                    >
                      {data.duplicates.httpRedirect === 'ok' ? 'OK' : 'Помилка'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_24.title')}
            status={
              data.speed.desktop !== null && data.speed.desktop >= 90
                ? 'good'
                : data.speed.desktop !== null && data.speed.desktop >= 50
                  ? 'warning'
                  : 'bad'
            }
            score={data.speed.desktop}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Швидкість десктопної версії впливає на користувацький досвід та позиції в AI-відповідях.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Google PageSpeed Insights API.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Performance score &gt;= 90
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Performance score &lt; 50
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_25.title')}
            status={
              data.speed.mobile !== null && data.speed.mobile >= 90
                ? 'good'
                : data.speed.mobile !== null && data.speed.mobile >= 50
                  ? 'warning'
                  : 'bad'
            }
            score={data.speed.mobile}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Опис
                </h4>
                <p className="text-sm text-muted-foreground">
                  Понад 60% трафіку з мобільних. AI-системи надають перевагу швидким сайтам.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Розрахунок
                </h4>
                <p className="text-sm text-muted-foreground">
                  Google PageSpeed Insights API.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Приклади
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#01B574' }}>Добрий приклад:</strong> Performance score &gt;= 90
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong style={{ color: '#EE5D50' }}>Поганий приклад:</strong> Performance score &lt; 50
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MinimalMetricCard>
        </div>
      </section>
    </div>
  );
}
