'use client';

import React, { useState, useEffect } from 'react';

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
  FileDown,
  Printer,
  Sparkles,
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

import { Checkbox } from '@kit/ui/checkbox';
import { Label } from '@kit/ui/label';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';

import type { EphemeralAuditResult } from '~/lib/modules/audit/ephemeral-audit';
import { getPreviousTechAudit } from '~/lib/actions/audit-history';
import {
  getScoreStatus,
  TITLE_THRESHOLDS,
  DESCRIPTION_THRESHOLDS,
  CORE_WEB_VITALS,
  getCoreWebVitalStatus,
  isOptimalTitleLength,
  isOptimalDescriptionLength,
  CATEGORY_WEIGHTS,
} from '~/lib/modules/audit/ui-constants';

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
  url?: string;
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
  trend?: number | null;
  isFirstAudit?: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function KpiCard({ label, value, benchmark, trend, isFirstAudit, icon: Icon, iconBg, iconColor }: KpiCardProps) {
  const hasTrend = trend !== null && trend !== undefined;
  const isPositive = hasTrend && trend >= 0;
  const trendDisplay = hasTrend ? `${trend >= 0 ? '+' : ''}${trend}%` : null;

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
        {hasTrend ? (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
            isPositive ? "bg-[#01B57415] text-[#01B574]" : "bg-[#EE5D5015] text-[#EE5D50]"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendDisplay}
          </div>
        ) : isFirstAudit ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#4318FF15] text-[#4318FF]">
            <Sparkles className="w-3 h-3" />
            Перший
          </div>
        ) : null}
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
  // AI Optimization (Technical optimization)
  // Weighted: llms.txt presence (30%), llms.txt quality (40%), robots.txt (15%), sitemap (15%)
  let aiScore = 0;
  if (data.files.llmsTxt.present) aiScore += 30;
  if (data.files.llmsTxt.score > 0) aiScore += Math.round(data.files.llmsTxt.score * 0.4);
  if (data.files.robots) aiScore += 15;
  if (data.files.sitemap) aiScore += 15;

  // Compliance (Basic Compliance)
  // HTTPS (40%), Mobile Friendly (30%), robots.txt (15%), sitemap (15%)
  let complianceScore = 0;
  if (data.security.https) complianceScore += 40;
  if (data.security.mobileFriendly) complianceScore += 30;
  if (data.files.robots) complianceScore += 15;
  if (data.files.sitemap) complianceScore += 15;

  // Schema (Structured data)
  // Each schema type contributes equally (12.5% each, 8 types = 100%)
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
  const schemaScore = Math.round((schemaCount / 8) * 100);

  // SEO/GEO indexing
  // lang (15%), canonical (20%), title quality (20%), description quality (20%), 
  // noindex check (15%), external links (10%)
  let seoScore = 0;
  if (data.meta.lang) seoScore += 15;
  if (data.meta.canonical) seoScore += 20;
  
  // Title quality based on titleAnalysis score if available
  if (data.meta.titleAnalysis?.score) {
    seoScore += Math.round(data.meta.titleAnalysis.score * 0.2);
  } else if (data.meta.titleLength && data.meta.titleLength >= 30 && data.meta.titleLength <= 65) {
    seoScore += 20;
  }
  
  // Description quality based on descriptionAnalysis score if available
  if (data.meta.descriptionAnalysis?.score) {
    seoScore += Math.round(data.meta.descriptionAnalysis.score * 0.2);
  } else if (data.meta.descriptionLength && data.meta.descriptionLength >= 120 && data.meta.descriptionLength <= 165) {
    seoScore += 20;
  }
  
  if (!data.meta.robots?.includes('noindex')) seoScore += 15;
  if (data.externalLinks.broken === 0) seoScore += 10;

  // Performance (Speed & Content)
  // Desktop speed (35%), Mobile speed (45%), redirects (20% total: 7% each)
  let perfScore = 0;
  if (data.speed.desktop !== null) {
    perfScore += Math.round(data.speed.desktop * 0.35);
  }
  if (data.speed.mobile !== null) {
    perfScore += Math.round(data.speed.mobile * 0.45);
  }
  if (data.duplicates.wwwRedirect === 'ok') perfScore += 7;
  if (data.duplicates.trailingSlash === 'ok') perfScore += 7;
  if (data.duplicates.httpRedirect === 'ok') perfScore += 6;

  return {
    ai: Math.min(100, aiScore),
    compliance: Math.min(100, complianceScore),
    schema: Math.min(100, schemaScore),
    seo: Math.min(100, seoScore),
    performance: Math.min(100, perfScore),
  };
}

/**
 * Critical Task Interface with additional metadata
 */
interface CriticalTask {
  message: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'security' | 'compliance' | 'performance' | 'seo' | 'schema' | 'metadata';
  priority: number; // 1-10, higher = more important
}

/**
 * Generate ALL Critical Tasks from Audit Data
 * Returns comprehensive list of ALL issues grouped by severity
 */
function generateCriticalTasks(data: EphemeralAuditResult): CriticalTask[] {
  const tasks: CriticalTask[] = [];

  // ===== SECURITY ISSUES (CRITICAL) =====

  // HTTPS check
  if (!data.security.https) {
    tasks.push({
      message: 'Налаштувати HTTPS для всіх сторінок',
      severity: 'critical',
      category: 'security',
      priority: 10,
    });
  }

  // Mobile Friendly check
  if (!data.security.mobileFriendly) {
    tasks.push({
      message: 'Додати meta viewport для оптимізації мобільних пристроїв',
      severity: 'critical',
      category: 'security',
      priority: 9,
    });
  }

  // ===== COMPLIANCE ISSUES (CRITICAL) =====

  // robots.txt check
  if (!data.files.robots) {
    tasks.push({
      message: 'Додати файл robots.txt для контролю індексування',
      severity: 'critical',
      category: 'compliance',
      priority: 9,
    });
  } else if (data.files.robotsTxt && data.files.robotsTxt.score < 50) {
    tasks.push({
      message: `Поліпшити robots.txt (поточна оцінка: ${data.files.robotsTxt.score}%)`,
      severity: 'warning',
      category: 'compliance',
      priority: 6,
    });
  }

  // sitemap.xml check
  if (!data.files.sitemap) {
    tasks.push({
      message: 'Додати файл sitemap.xml для кращого індексування',
      severity: 'critical',
      category: 'compliance',
      priority: 8,
    });
  }

  // canonical URL check
  if (!data.meta.canonical) {
    tasks.push({
      message: 'Додати canonical URL тег для уникнення дублю контенту',
      severity: 'critical',
      category: 'compliance',
      priority: 9,
    });
  } else if (data.meta.canonicalAnalysis && data.meta.canonicalAnalysis.score < 50) {
    tasks.push({
      message: `Перевірити canonical URL (поточна оцінка: ${data.meta.canonicalAnalysis.score}%)`,
      severity: 'warning',
      category: 'compliance',
      priority: 6,
    });
  }

  // noindex check
  if (data.meta.robots?.includes('noindex')) {
    tasks.push({
      message: 'Прибрати noindex директиву з robots meta тегу',
      severity: 'critical',
      category: 'compliance',
      priority: 10,
    });
  }

  // ===== SEO METADATA ISSUES (CRITICAL) =====

  // Title check - detailed
  if (!data.meta.title) {
    tasks.push({
      message: 'Додати title tag для сторінки',
      severity: 'critical',
      category: 'metadata',
      priority: 10,
    });
  } else if (data.meta.titleLength !== null) {
    if (data.meta.titleLength < TITLE_THRESHOLDS.MIN_LENGTH) {
      tasks.push({
        message: `Title занадто короткий (${data.meta.titleLength} символів, мінімум ${TITLE_THRESHOLDS.MIN_LENGTH})`,
        severity: 'critical',
        category: 'metadata',
        priority: 9,
      });
    } else if (data.meta.titleLength > TITLE_THRESHOLDS.MAX_LENGTH) {
      tasks.push({
        message: `Title занадто довгий (${data.meta.titleLength} символів, максимум ${TITLE_THRESHOLDS.MAX_LENGTH})`,
        severity: 'warning',
        category: 'metadata',
        priority: 7,
      });
    }
  }

  // Title analysis detailed issues
  if (data.meta.titleAnalysis) {
    if (data.meta.titleAnalysis.isGeneric) {
      tasks.push({
        message: 'Title має бути більш унікальним та специфічним для послуги',
        severity: 'warning',
        category: 'metadata',
        priority: 6,
      });
    }
    if (!data.meta.titleAnalysis.hasLocalKeyword) {
      tasks.push({
        message: 'Додати геолокацію в title для локального пошуку',
        severity: 'warning',
        category: 'metadata',
        priority: 7,
      });
    }
    if (!data.meta.titleAnalysis.startsWithKeyword) {
      tasks.push({
        message: 'Помістити ключове слово на початок title',
        severity: 'info',
        category: 'metadata',
        priority: 4,
      });
    }
    if (data.meta.titleAnalysis.issues && data.meta.titleAnalysis.issues.length > 0) {
      data.meta.titleAnalysis.issues.forEach((issue) => {
        tasks.push({
          message: `Title: ${issue}`,
          severity: 'warning',
          category: 'metadata',
          priority: 5,
        });
      });
    }
  }

  // Description check - detailed
  if (!data.meta.description) {
    tasks.push({
      message: 'Додати meta description для сторінки',
      severity: 'critical',
      category: 'metadata',
      priority: 9,
    });
  } else if (data.meta.descriptionLength !== null) {
    if (data.meta.descriptionLength < DESCRIPTION_THRESHOLDS.MIN_LENGTH) {
      tasks.push({
        message: `Description занадто короткий (${data.meta.descriptionLength} символів, мінімум ${DESCRIPTION_THRESHOLDS.MIN_LENGTH})`,
        severity: 'critical',
        category: 'metadata',
        priority: 8,
      });
    } else if (data.meta.descriptionLength > DESCRIPTION_THRESHOLDS.MAX_LENGTH) {
      tasks.push({
        message: `Description занадто довгий (${data.meta.descriptionLength} символів, максимум ${DESCRIPTION_THRESHOLDS.MAX_LENGTH})`,
        severity: 'warning',
        category: 'metadata',
        priority: 6,
      });
    }
  }

  // Description analysis detailed issues
  if (data.meta.descriptionAnalysis) {
    if (!data.meta.descriptionAnalysis.hasCallToAction) {
      tasks.push({
        message: 'Додати заклик до дії (CTA) в meta description',
        severity: 'warning',
        category: 'metadata',
        priority: 6,
      });
    }
    if (!data.meta.descriptionAnalysis.hasBenefits) {
      tasks.push({
        message: 'Додати переваги або цифри в meta description',
        severity: 'info',
        category: 'metadata',
        priority: 4,
      });
    }
    if (data.meta.descriptionAnalysis.isDifferentFromTitle === false) {
      tasks.push({
        message: 'Description дублює title - зробити унікальним',
        severity: 'warning',
        category: 'metadata',
        priority: 7,
      });
    }
    if (data.meta.descriptionAnalysis.issues && data.meta.descriptionAnalysis.issues.length > 0) {
      data.meta.descriptionAnalysis.issues.forEach((issue) => {
        tasks.push({
          message: `Description: ${issue}`,
          severity: 'warning',
          category: 'metadata',
          priority: 5,
        });
      });
    }
  }

  // ===== SCHEMA MARKUP (CRITICAL) =====

  // Main schema types
  if (!data.schema.hasMedicalOrg && !data.schema.hasLocalBusiness) {
    tasks.push({
      message: 'Додати Schema MedicalOrganization або LocalBusiness markup',
      severity: 'critical',
      category: 'schema',
      priority: 9,
    });
  }

  // Extended schema types
  if (!data.schema.hasPhysician) {
    tasks.push({
      message: 'Додати Schema Physician для医 профілів лікарів',
      severity: 'warning',
      category: 'schema',
      priority: 6,
    });
  }

  if (!data.schema.hasMedicalProcedure) {
    tasks.push({
      message: 'Додати Schema MedicalProcedure для послуг',
      severity: 'warning',
      category: 'schema',
      priority: 6,
    });
  }

  if (!data.schema.hasFAQPage) {
    tasks.push({
      message: 'Додати Schema FAQPage для FAQ секції',
      severity: 'info',
      category: 'schema',
      priority: 4,
    });
  }

  if (!data.schema.hasBreadcrumbList) {
    tasks.push({
      message: 'Додати Schema BreadcrumbList для навігації',
      severity: 'info',
      category: 'schema',
      priority: 4,
    });
  }

  if (!data.schema.hasReview) {
    tasks.push({
      message: 'Додати Schema Review/AggregateRating для відгуків',
      severity: 'info',
      category: 'schema',
      priority: 3,
    });
  }

  // ===== AI OPTIMIZATION (llms.txt) =====

  if (!data.files.llmsTxt.present) {
    tasks.push({
      message: 'Додати файл llms.txt для оптимізації AI видимості',
      severity: 'warning',
      category: 'seo',
      priority: 7,
    });
  } else if (data.files.llmsTxt.score < 50) {
    tasks.push({
      message: `Поліпшити вміст llms.txt (поточна оцінка: ${data.files.llmsTxt.score}%)`,
      severity: 'warning',
      category: 'seo',
      priority: 6,
    });
  }

  // ===== LANGUAGE & HREFLANG =====

  if (!data.meta.lang) {
    tasks.push({
      message: 'Додати мовний атрибут lang до <html> тегу',
      severity: 'warning',
      category: 'compliance',
      priority: 5,
    });
  }

  if (data.meta.hreflangs && data.meta.hreflangs.length > 0) {
    // Site has hreflang tags - this is good for multilingual sites
  } else if (!data.meta.hreflangs || data.meta.hreflangs.length === 0) {
    // No hreflangs - only issue if site is multilingual (skip for single-language)
  }

  // ===== PERFORMANCE ISSUES =====

  if (data.speed.desktop !== null && data.speed.desktop < 50) {
    tasks.push({
      message: `Критично низька швидкість Desktop (${data.speed.desktop}%). Оптимізувати зображення, скрипти та CSS`,
      severity: 'critical',
      category: 'performance',
      priority: 9,
    });
  } else if (data.speed.desktop !== null && data.speed.desktop < 75) {
    tasks.push({
      message: `Слабка швидкість Desktop (${data.speed.desktop}%). Працювати над оптимізацією`,
      severity: 'warning',
      category: 'performance',
      priority: 7,
    });
  }

  if (data.speed.mobile !== null && data.speed.mobile < 50) {
    tasks.push({
      message: `Критично низька швидкість Mobile (${data.speed.mobile}%). Оптимізувати для мобільних пристроїв`,
      severity: 'critical',
      category: 'performance',
      priority: 9,
    });
  } else if (data.speed.mobile !== null && data.speed.mobile < 75) {
    tasks.push({
      message: `Слабка швидкість Mobile (${data.speed.mobile}%). Необхідна оптимізація`,
      severity: 'warning',
      category: 'performance',
      priority: 7,
    });
  }

  // Core Web Vitals issues
  if (data.speed.desktopDetails) {
    if (data.speed.desktopDetails.lcp && data.speed.desktopDetails.lcp > CORE_WEB_VITALS.LCP.NEEDS_IMPROVEMENT) {
      tasks.push({
        message: `LCP (Desktop) повільний: ${Math.round(data.speed.desktopDetails.lcp)}ms (добре < ${CORE_WEB_VITALS.LCP.GOOD}ms)`,
        severity: 'warning',
        category: 'performance',
        priority: 6,
      });
    }
  }

  if (data.speed.mobileDetails) {
    if (data.speed.mobileDetails.lcp && data.speed.mobileDetails.lcp > CORE_WEB_VITALS.LCP.NEEDS_IMPROVEMENT) {
      tasks.push({
        message: `LCP (Mobile) повільний: ${Math.round(data.speed.mobileDetails.lcp)}ms (добре < ${CORE_WEB_VITALS.LCP.GOOD}ms)`,
        severity: 'warning',
        category: 'performance',
        priority: 6,
      });
    }
  }

  // ===== EXTERNAL LINKS & IMAGES =====

  if (data.externalLinks.broken > 0) {
    tasks.push({
      message: `Виправити ${data.externalLinks.broken} битих посилань${data.externalLinks.total > 0 ? ` (з ${data.externalLinks.total} всього)` : ''}`,
      severity: 'warning',
      category: 'compliance',
      priority: 5,
    });
  }

  if (data.images.missingAlt > 0) {
    tasks.push({
      message: `Додати alt-тексти до ${data.images.missingAlt} зображень${data.images.total > 0 ? ` (з ${data.images.total} всього)` : ''}`,
      severity: 'warning',
      category: 'seo',
      priority: 6,
    });
  }

  // ===== DUPLICATE CONTENT ISSUES =====

  if (data.duplicates.wwwRedirect === 'duplicate') {
    tasks.push({
      message: 'Налаштувати редирект www ↔ non-www (дублювання контенту)',
      severity: 'critical',
      category: 'compliance',
      priority: 9,
    });
  } else if (data.duplicates.wwwRedirect === 'error') {
    tasks.push({
      message: 'Перевірити редирект www (помилка при перевірці)',
      severity: 'warning',
      category: 'compliance',
      priority: 4,
    });
  }

  if (data.duplicates.httpRedirect === 'duplicate') {
    tasks.push({
      message: 'Налаштувати редирект HTTP → HTTPS (дублювання контенту)',
      severity: 'critical',
      category: 'security',
      priority: 10,
    });
  } else if (data.duplicates.httpRedirect === 'error') {
    tasks.push({
      message: 'Перевірити редирект HTTP → HTTPS (помилка при перевірці)',
      severity: 'warning',
      category: 'security',
      priority: 4,
    });
  }

  if (data.duplicates.trailingSlash === 'duplicate') {
    tasks.push({
      message: 'Налаштувати редирект trailing slash (дублювання контенту)',
      severity: 'critical',
      category: 'compliance',
      priority: 8,
    });
  } else if (data.duplicates.trailingSlash === 'error') {
    tasks.push({
      message: 'Перевірити редирект trailing slash (помилка при перевірці)',
      severity: 'warning',
      category: 'compliance',
      priority: 4,
    });
  }

  // ===== SORT BY PRIORITY (highest first) =====
  tasks.sort((a, b) => b.priority - a.priority);

  return tasks;
}

/**
 * Main TechAuditSection Component
 */
export function TechAuditSection({ data, url }: TechAuditSectionProps) {
  const { t } = useTranslation('playground');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isTasksOpen, setIsTasksOpen] = useState(false);

  // State for trends from previous audit
  const [trends, setTrends] = useState<Record<string, number | null>>({});
  const [isFirstAudit, setIsFirstAudit] = useState(true);
  const [trendsLoaded, setTrendsLoaded] = useState(false);

  // Helper to get status from boolean
  const fromBool = (val: boolean | null): 'good' | 'bad' =>
    val ? 'good' : 'bad';

  const categoryScores = calculateCategoryScores(data);

  // Load previous audit to calculate trends
  useEffect(() => {
    if (!data || !url || trendsLoaded) return;

    const loadPreviousAudit = async () => {
      try {
        const previous = await getPreviousTechAudit({ url });

        if (previous && previous.result) {
          // Calculate previous scores from partial data (handle missing fields gracefully)
          const prevData = previous.result;
          let prevAi = 0;
          if (prevData.files?.llmsTxt?.present) prevAi += 30;
          if (prevData.files?.llmsTxt?.score > 0) prevAi += Math.round(prevData.files.llmsTxt.score * 0.4);
          if (prevData.files?.robots) prevAi += 15;
          if (prevData.files?.sitemap) prevAi += 15;
          
          let prevCompliance = 0;
          if (prevData.security?.https) prevCompliance += 40;
          if (prevData.security?.mobileFriendly) prevCompliance += 30;
          if (prevData.files?.robots) prevCompliance += 15;
          if (prevData.files?.sitemap) prevCompliance += 15;
          
          const prevSchemaCount = prevData.schema ? Object.values(prevData.schema).filter(Boolean).length : 0;
          const prevSchema = Math.round((prevSchemaCount / 8) * 100);
          
          const prevScores = {
            ai: Math.min(100, prevAi),
            compliance: Math.min(100, prevCompliance),
            schema: Math.min(100, prevSchema),
            seo: 50, // Fallback - not all fields available in history
            performance: 50, // Fallback - not all fields available in history
          };
          
          const currentScores = categoryScores;

          setTrends({
            ai: currentScores.ai - prevScores.ai,
            compliance: currentScores.compliance - prevScores.compliance,
            schema: Math.round(currentScores.schema - prevScores.schema),
            seo: null, // Cannot calculate accurately from history
            performance: null, // Cannot calculate accurately from history
          });
          setIsFirstAudit(false);
        } else {
          setIsFirstAudit(true);
        }
        setTrendsLoaded(true);
      } catch (error) {
        console.error('[TechAuditSection] Failed to load previous audit:', error);
        setTrendsLoaded(true);
      }
    };

    loadPreviousAudit();
  }, [data, url, trendsLoaded]);

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
  const allCriticalTasks = generateCriticalTasks(data);

  // Apply filtering
  const criticalTasks = selectedCategories.length > 0
    ? allCriticalTasks.filter(task => selectedCategories.includes(task.category))
    : allCriticalTasks;

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const categories = Array.from(new Set(allCriticalTasks.map(t => t.category)));

  // --- Export Functions ---
  const downloadAsCSV = () => {
    const headers = ['Message', 'Severity', 'Category', 'Priority'];
    const rows = allCriticalTasks.map(t => [
      `"${t.message.replace(/"/g, '""')}"`,
      t.severity,
      t.category,
      t.priority
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tech-audit-tasks-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const _html = `
      <html>
        <head>
          <title>Technical Audit Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1B2559; }
            h1 { color: #4318FF; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #E2E8F0; padding: 12px; text-align: left; }
            th { background-color: #F4F7FE; }
            .severity-critical { color: #EE5D50; font-weight: bold; }
            .severity-warning { color: #FFB547; font-weight: bold; }
            .severity-info { color: #2B77E5; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Technical Audit Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Overall Score: ${overallScore}%</p>
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Category</th>
                <th>Task</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              ${allCriticalTasks.map(t => `
                <tr>
                  <td>${t.priority}</td>
                  <td style="text-transform: capitalize;">${t.category}</td>
                  <td>${t.message}</td>
                  <td class="severity-${t.severity}">${t.severity.toUpperCase()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.close();
  };

  // --- History Tracking ---
  interface AuditHistoryEntry {
    score: number;
    criticalCount: number;
    timestamp?: number;
  }
  const [history, setHistory] = useState<AuditHistoryEntry[]>([]);

  useEffect(() => {
    // Generate a unique key for this domain if possible
    const domain = data.meta.canonical
      ? new URL(data.meta.canonical).hostname
      : 'current-site';
    const storageKey = `tech-audit-history-${domain}`;

    // Load history
    const savedHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setHistory(savedHistory);

    // Save current run if it's new (simple timestamp check)
    const now = new Date().getTime();
    const lastRun = savedHistory[0];

    // Avoid double saving in dev mode
    if (!lastRun || now - lastRun.timestamp > 60000) {
      const newEntry = {
        timestamp: now,
        score: overallScore,
        criticalCount: allCriticalTasks.filter(t => t.severity === 'critical').length,
        warningCount: allCriticalTasks.filter(t => t.severity === 'warning').length,
      };

      const updatedHistory = [newEntry, ...savedHistory].slice(0, 5); // Keep last 5
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      // Update local state without trigger re-run
    }
  }, [overallScore, allCriticalTasks.length]);

  const lastAudit = history.length > 1 ? history[1] : null;
  const _scoreDelta = lastAudit ? overallScore - lastAudit.score : 0;
  const _criticalDelta = lastAudit ? allCriticalTasks.filter(t => t.severity === 'critical').length - lastAudit.criticalCount : 0;

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
            trend={trendsLoaded ? trends.ai : null}
            isFirstAudit={trendsLoaded && isFirstAudit}
            icon={Zap}
            iconBg={HORIZON.primaryLight}
            iconColor={HORIZON.primary}
          />
          <KpiCard
            label="Basic Compliance"
            value={`${categoryScores.compliance}%`}
            benchmark="100%"
            trend={trendsLoaded ? trends.compliance : null}
            isFirstAudit={trendsLoaded && isFirstAudit}
            icon={Shield}
            iconBg={HORIZON.successLight}
            iconColor={HORIZON.success}
          />
          <KpiCard
            label="Structured data"
            value={`${Math.round(categoryScores.schema)}%`}
            benchmark="75%"
            trend={trendsLoaded ? trends.schema : null}
            isFirstAudit={trendsLoaded && isFirstAudit}
            icon={FileText}
            iconBg={HORIZON.infoLight}
            iconColor={HORIZON.info}
          />
          <KpiCard
            label="GEO indexing"
            value={`${categoryScores.seo}%`}
            benchmark="80%"
            trend={trendsLoaded ? trends.seo : null}
            isFirstAudit={trendsLoaded && isFirstAudit}
            icon={Search}
            iconBg={HORIZON.warningLight}
            iconColor={HORIZON.warning}
          />
          <KpiCard
            label="Speed & Content"
            value={`${categoryScores.performance}%`}
            benchmark="90%"
            trend={trendsLoaded ? trends.performance : null}
            isFirstAudit={trendsLoaded && isFirstAudit}
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

        {/* Critical Tasks - Always visible critical, expandable rest */}
        <Card
          className="overflow-hidden rounded-[20px] border-none bg-white transition-all duration-300"
          style={{ boxShadow: HORIZON.shadow }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className="mb-1 text-sm font-bold tracking-widest uppercase"
                  style={{ color: HORIZON.textSecondary }}
                >
                  Задачі з пріоритетом
                </h3>
                <p
                  className="text-sm font-bold"
                  style={{ color: HORIZON.textPrimary }}
                >
                  Список виправлень
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadAsCSV}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 hover:text-primary border border-slate-200"
                  title="Експорт у CSV"
                >
                  <FileDown className="w-4 h-4" />
                </button>
                <button
                  onClick={downloadAsPDF}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 hover:text-primary border border-slate-200"
                  title="Друк / PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              {/* Summary stats - always visible */}
              <div className="grid grid-cols-4 gap-2 pb-4 border-b border-slate-200">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: HORIZON.error }}>
                    {allCriticalTasks.filter(t => t.severity === 'critical').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Критичних</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: HORIZON.warning }}>
                    {allCriticalTasks.filter(t => t.severity === 'warning').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Попередження</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: HORIZON.info }}>
                    {allCriticalTasks.filter(t => t.severity === 'info').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Інформація</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: HORIZON.textSecondary }}>
                    {allCriticalTasks.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Всього</p>
                </div>
              </div>

              {/* Critical issues - ALWAYS VISIBLE */}
              {allCriticalTasks.filter(t => t.severity === 'critical').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-red-700 uppercase tracking-widest">🔴 Критичні проблеми</h4>
                  <div className="space-y-2 pl-2 border-l-2 border-red-300">
                    {allCriticalTasks.filter(t => t.severity === 'critical').map((task, index) => (
                      <div key={`critical-${index}`} className="flex items-start gap-3">
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: HORIZON.error }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: HORIZON.textPrimary }}>
                            {task.message}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Категорія: {task.category} • Пріоритет: {task.priority}/10
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allCriticalTasks.filter(t => t.severity === 'critical').length === 0 && (
                <div className="flex items-center gap-3 py-4 justify-center">
                  <CheckCircle2 className="w-5 h-5" style={{ color: HORIZON.success }} />
                  <span className="text-sm font-medium" style={{ color: HORIZON.success }}>
                    Критичних проблем не виявлено!
                  </span>
                </div>
              )}

              {/* Collapsible section for warnings, info, filters */}
              {(allCriticalTasks.filter(t => t.severity === 'warning').length > 0 || 
                allCriticalTasks.filter(t => t.severity === 'info').length > 0) && (
                <Collapsible open={isTasksOpen} onOpenChange={setIsTasksOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">
                        Показати попередження та рекомендації
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                            {allCriticalTasks.filter(t => t.severity === 'warning').length}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                            {allCriticalTasks.filter(t => t.severity === 'info').length}
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-slate-400 transition-transform',
                            isTasksOpen && 'rotate-180',
                          )}
                        />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pt-4 space-y-4">
                      {/* Category Filters */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        {categories.map(cat => (
                          <div key={cat} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-${cat}`}
                              checked={selectedCategories.includes(cat)}
                              onCheckedChange={() => toggleCategory(cat)}
                            />
                            <Label
                              htmlFor={`filter-${cat}`}
                              className="text-xs font-semibold capitalize cursor-pointer text-slate-600"
                            >
                              {cat}
                            </Label>
                          </div>
                        ))}
                        {selectedCategories.length > 0 && (
                          <button
                            onClick={() => setSelectedCategories([])}
                            className="text-[10px] font-bold text-primary hover:underline ml-auto"
                          >
                            Очистити все
                          </button>
                        )}
                      </div>

                      {/* Warnings */}
                      {criticalTasks.filter(t => t.severity === 'warning').length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-widest">⚠️ Попередження</h4>
                          <div className="space-y-2 pl-2 border-l-2 border-amber-300">
                            {criticalTasks.filter(t => t.severity === 'warning').map((task, index) => (
                              <div key={`warning-${index}`} className="flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: HORIZON.warning }} />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-700">
                                    {task.message}
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-1">
                                    Категорія: {task.category} • Пріоритет: {task.priority}/10
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Info */}
                      {criticalTasks.filter(t => t.severity === 'info').length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-widest">ℹ️ Рекомендації</h4>
                          <div className="space-y-2 pl-2 border-l-2 border-blue-300">
                            {criticalTasks.filter(t => t.severity === 'info').map((task, index) => (
                              <div key={`info-${index}`} className="flex items-start gap-3">
                                <Info className="w-4 h-4 flex-shrink-0 mt-1 text-blue-500" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-700">
                                    {task.message}
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-1">
                                    Категорія: {task.category} • Пріоритет: {task.priority}/10
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summary by category */}
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Розподіл по категоріям</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(Object.keys(CATEGORY_WEIGHTS) as Array<keyof typeof CATEGORY_WEIGHTS>).map((category) => {
                            const catName = String(category);
                            const count = allCriticalTasks.filter(t => t.category === category).length;
                            return count > 0 ? (
                              <div key={catName} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                <p className="text-[11px] font-medium text-slate-600 capitalize">{catName}</p>
                                <p className="text-lg font-bold" style={{ color: HORIZON.colors[category as keyof typeof HORIZON.colors] || HORIZON.textPrimary }}>
                                  {count}
                                </p>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>
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
            status={getScoreStatus(data.files.llmsTxt.score)}
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
              {/* Problems - missing sections or low score */}
              {(data.files.llmsTxt.missingSections?.length > 0 || data.files.llmsTxt.score < 50) && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Проблеми
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-red-600">
                    {!data.files.llmsTxt.present && (
                      <li>Файл llms.txt не знайдено на сайті</li>
                    )}
                    {data.files.llmsTxt.present && data.files.llmsTxt.score === 0 && (
                      <li>Файл llms.txt порожній або не містить корисної інформації</li>
                    )}
                    {data.files.llmsTxt.present && data.files.llmsTxt.score > 0 && data.files.llmsTxt.score < 50 && (
                      <li>Файл llms.txt має низьку якість (оцінка: {data.files.llmsTxt.score}%)</li>
                    )}
                    {data.files.llmsTxt.missingSections?.map((issue, i) => (
                      <li key={i}>Відсутній розділ: {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {data.files.llmsTxt.recommendations.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Рекомендації
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
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
            status={getScoreStatus(data.files.robotsTxt?.score)}
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
              {data.meta.hreflangs?.length > 0 ? (
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
              ) : (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Статус
                  </h4>
                  <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Це нормально!</strong> Hreflang теги не знайдені, тому що ваш сайт одномовний.
                    </p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        <strong>Коли потрібні hreflang теги:</strong>
                      </p>
                      <ul className="list-disc list-inside ml-1 space-y-0.5">
                        <li>Сайт доступний на різних мовах (укр, англ, нім. тощо)</li>
                        <li>Основний контент дублюється для різних географічних регіонів</li>
                        <li>Потрібно явно вказати Google та LLM які версії показувати</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-900/30">
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        ✓ Ваш одномовний сайт — hreflang не потрібні. Проблеми немає.
                      </p>
                    </div>
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
            status={getScoreStatus(data.meta.titleAnalysis?.score)}
            score={data.meta.titleAnalysis?.score ?? (isOptimalTitleLength(data.meta.titleLength) ? 70 : 30)}
            value={isOptimalTitleLength(data.meta.titleLength) ? `${data.meta.titleLength} симв. ✓` : `${data.meta.titleLength || 0} симв. ✗`}
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
                      <span className="font-medium text-slate-700 text-xs">Оптимальна довжина ({TITLE_THRESHOLDS.MIN_LENGTH}-{TITLE_THRESHOLDS.MAX_LENGTH})</span>
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

              {/* Service Titles Analysis */}
              {data.meta.titleAnalysis?.serviceTitles && data.meta.titleAnalysis.serviceTitles.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Аналіз заголовків послуг ({data.meta.titleAnalysis.serviceTitles.length})
                  </h4>
                  <div className="space-y-3">
                    {data.meta.titleAnalysis.serviceTitles.map((serviceTitle, index) => (
                      <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 italic break-words">
                              &quot;{serviceTitle.title || 'N/A'}&quot;
                            </p>
                          </div>
                          <Badge
                            variant={
                              serviceTitle.score >= 80
                                ? 'default'
                                : serviceTitle.score >= 50
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={
                              serviceTitle.score >= 80
                                ? 'bg-emerald-100 text-emerald-800 flex-shrink-0'
                                : serviceTitle.score >= 50
                                  ? 'bg-amber-100 text-amber-800 flex-shrink-0'
                                  : 'bg-red-100 text-red-800 flex-shrink-0'
                            }
                          >
                            {serviceTitle.score ?? 'N/A'}%
                          </Badge>
                        </div>

                        {/* Quick checks for this service title */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${serviceTitle.isOptimalLength ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-slate-600">Довжина: {serviceTitle.isOptimalLength ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${serviceTitle.hasLocalKeyword ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-slate-600">Місто: {serviceTitle.detectedCity || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${!serviceTitle.isGeneric ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-slate-600">Унікальний: {!serviceTitle.isGeneric ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${serviceTitle.startsWithKeyword ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-slate-600">Ключ на початку: {serviceTitle.startsWithKeyword ? '✓' : '—'}</span>
                          </div>
                        </div>

                        {/* Issues for this service title */}
                        {serviceTitle.issues && serviceTitle.issues.length > 0 && (
                          <div className="text-xs text-red-600 space-y-1">
                            {serviceTitle.issues.map((issue, i) => (
                              <div key={i} className="flex gap-2">
                                <span className="text-red-500 flex-shrink-0">•</span>
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_19.title')}
            status={getScoreStatus(data.meta.descriptionAnalysis?.score)}
            score={data.meta.descriptionAnalysis?.score ?? (isOptimalDescriptionLength(data.meta.descriptionLength) ? 70 : 30)}
            value={isOptimalDescriptionLength(data.meta.descriptionLength) ? `${data.meta.descriptionLength} симв. ✓` : `${data.meta.descriptionLength || 0} симв. ✗`}
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
                      <span className="font-medium text-slate-700 text-xs">Оптимальна довжина ({DESCRIPTION_THRESHOLDS.MIN_LENGTH}-{DESCRIPTION_THRESHOLDS.MAX_LENGTH})</span>
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

              {/* Service Descriptions Analysis */}
              {data.meta.descriptionAnalysis?.serviceDescriptions && data.meta.descriptionAnalysis.serviceDescriptions.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Аналіз описів послуг ({data.meta.descriptionAnalysis.serviceDescriptions.length})
                  </h4>
                  <div className="space-y-3">
                    {data.meta.descriptionAnalysis.serviceDescriptions.map((serviceDesc, index) => (
                      <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 italic break-words">
                              &quot;{serviceDesc.description || 'N/A'}&quot;
                            </p>
                          </div>
                          <Badge
                            variant={
                              serviceDesc.score >= 80
                                ? 'default'
                                : serviceDesc.score >= 50
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={
                              serviceDesc.score >= 80
                                ? 'bg-emerald-100 text-emerald-800 flex-shrink-0'
                                : serviceDesc.score >= 50
                                  ? 'bg-amber-100 text-amber-800 flex-shrink-0'
                                  : 'bg-red-100 text-red-800 flex-shrink-0'
                            }
                          >
                            {serviceDesc.score ?? 'N/A'}%
                          </Badge>
                        </div>

                        {/* Quick checks for this service description */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${serviceDesc.isOptimalLength ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-slate-600">Довжина: {serviceDesc.isOptimalLength ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${serviceDesc.hasCallToAction ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-slate-600">CTA: {serviceDesc.hasCallToAction ? '✓' : '—'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${serviceDesc.hasBenefits ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-slate-600">Переваги: {serviceDesc.hasBenefits ? '✓' : '—'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${!serviceDesc.isGeneric ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-slate-600">Унікальний: {!serviceDesc.isGeneric ? '✓' : '✗'}</span>
                          </div>
                        </div>

                        {/* Issues for this service description */}
                        {serviceDesc.issues && serviceDesc.issues.length > 0 && (
                          <div className="text-xs text-red-600 space-y-1">
                            {serviceDesc.issues.map((issue, i) => (
                              <div key={i} className="flex gap-2">
                                <span className="text-red-500 flex-shrink-0">•</span>
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </MinimalMetricCard>
          <MinimalMetricCard
            title={t('techAudit.items.3_20.title')}
            status={getScoreStatus(data.meta.canonicalAnalysis?.score)}
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
            status={getScoreStatus(data.speed.desktop)}
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

              {/* Core Web Vitals */}
              {data.speed.desktopDetails && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Core Web Vitals (Desktop)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {/* LCP */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Largest Contentful Paint</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.desktopDetails.lcp ? `${Math.round(data.speed.desktopDetails.lcp)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.desktopDetails.lcp ? (() => {
                          const status = getCoreWebVitalStatus('LCP', data.speed.desktopDetails.lcp);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* FCP */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">First Contentful Paint</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.desktopDetails.fcp ? `${Math.round(data.speed.desktopDetails.fcp)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.desktopDetails.fcp ? (() => {
                          const status = getCoreWebVitalStatus('FCP', data.speed.desktopDetails.fcp);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* CLS */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Cumulative Layout Shift</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.desktopDetails.cls !== null ? data.speed.desktopDetails.cls.toFixed(3) : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.desktopDetails.cls !== null ? (() => {
                          const status = getCoreWebVitalStatus('CLS', data.speed.desktopDetails.cls);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* TBT */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Total Blocking Time</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.desktopDetails.tbt ? `${Math.round(data.speed.desktopDetails.tbt)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.desktopDetails.tbt ? (() => {
                          const status = getCoreWebVitalStatus('TBT', data.speed.desktopDetails.tbt);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* TTFB */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Time to First Byte</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.desktopDetails.ttfb ? `${Math.round(data.speed.desktopDetails.ttfb)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.desktopDetails.ttfb ? (() => {
                          const status = getCoreWebVitalStatus('TTFB', data.speed.desktopDetails.ttfb);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* Speed Index */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Speed Index</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.desktopDetails.si ? `${Math.round(data.speed.desktopDetails.si)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.desktopDetails.si ? (() => {
                          const status = getCoreWebVitalStatus('SI', data.speed.desktopDetails.si);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Score */}
              {data.speed.desktopDetails?.categories && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Lighthouse Categories
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {data.speed.desktopDetails.categories.performance !== null && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <p className="text-[10px] text-slate-500 mb-1">Performance</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{data.speed.desktopDetails.categories.performance}</p>
                          <ProgressBar value={data.speed.desktopDetails.categories.performance} max={100} size="sm" />
                        </div>
                      </div>
                    )}
                    {data.speed.desktopDetails.categories.accessibility !== null && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <p className="text-[10px] text-slate-500 mb-1">Accessibility</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{data.speed.desktopDetails.categories.accessibility}</p>
                          <ProgressBar value={data.speed.desktopDetails.categories.accessibility} max={100} size="sm" />
                        </div>
                      </div>
                    )}
                    {data.speed.desktopDetails.categories.bestPractices !== null && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <p className="text-[10px] text-slate-500 mb-1">Best Practices</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{data.speed.desktopDetails.categories.bestPractices}</p>
                          <ProgressBar value={data.speed.desktopDetails.categories.bestPractices} max={100} size="sm" />
                        </div>
                      </div>
                    )}
                    {data.speed.desktopDetails.categories.seo !== null && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <p className="text-[10px] text-slate-500 mb-1">SEO</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{data.speed.desktopDetails.categories.seo}</p>
                          <ProgressBar value={data.speed.desktopDetails.categories.seo} max={100} size="sm" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {data.speed.desktopDetails?.opportunities && data.speed.desktopDetails.opportunities.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Топ-5 Можливості для Оптимізації
                  </h4>
                  <div className="space-y-2">
                    {data.speed.desktopDetails.opportunities.slice(0, 5).map((opp, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-slate-900">{opp.title}</p>
                          {opp.score !== undefined && (
                            <span className="text-[10px] font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded">
                              {opp.score}
                            </span>
                          )}
                        </div>
                        {opp.savings !== undefined && (
                          <p className="text-[10px] text-slate-500">
                            Potential savings: {opp.savings} {opp.savingsUnit || 'ms'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
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
            status={getScoreStatus(data.speed.mobile)}
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

              {/* Core Web Vitals */}
              {data.speed.mobileDetails && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Core Web Vitals (Mobile)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {/* LCP */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Largest Contentful Paint</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.mobileDetails.lcp ? `${Math.round(data.speed.mobileDetails.lcp)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.mobileDetails.lcp ? (() => {
                          const status = getCoreWebVitalStatus('LCP', data.speed.mobileDetails.lcp);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* FCP */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">First Contentful Paint</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.mobileDetails.fcp ? `${Math.round(data.speed.mobileDetails.fcp)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.mobileDetails.fcp ? (() => {
                          const status = getCoreWebVitalStatus('FCP', data.speed.mobileDetails.fcp);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* CLS */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Cumulative Layout Shift</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.mobileDetails.cls !== null ? data.speed.mobileDetails.cls.toFixed(3) : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.mobileDetails.cls !== null ? (() => {
                          const status = getCoreWebVitalStatus('CLS', data.speed.mobileDetails.cls);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* TBT */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Total Blocking Time</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.mobileDetails.tbt ? `${Math.round(data.speed.mobileDetails.tbt)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.mobileDetails.tbt ? (() => {
                          const status = getCoreWebVitalStatus('TBT', data.speed.mobileDetails.tbt);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* TTFB */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Time to First Byte</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.mobileDetails.ttfb ? `${Math.round(data.speed.mobileDetails.ttfb)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.mobileDetails.ttfb ? (() => {
                          const status = getCoreWebVitalStatus('TTFB', data.speed.mobileDetails.ttfb);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>

                    {/* Speed Index */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <p className="text-[10px] text-slate-500 mb-1">Speed Index</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.speed.mobileDetails.si ? `${Math.round(data.speed.mobileDetails.si)}ms` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {data.speed.mobileDetails.si ? (() => {
                          const status = getCoreWebVitalStatus('SI', data.speed.mobileDetails.si);
                          return status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Needs improvement' : '✗ Poor';
                        })() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Score */}
              {data.speed.mobileDetails?.categories && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Lighthouse Categories
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {data.speed.mobileDetails.categories.performance !== null && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <p className="text-[10px] text-slate-500 mb-1">Performance</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{data.speed.mobileDetails.categories.performance}</p>
                          <ProgressBar value={data.speed.mobileDetails.categories.performance} max={100} size="sm" />
                        </div>
                      </div>
                    )}
                    {data.speed.mobileDetails.categories.accessibility !== null && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <p className="text-[10px] text-slate-500 mb-1">Accessibility</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{data.speed.mobileDetails.categories.accessibility}</p>
                          <ProgressBar value={data.speed.mobileDetails.categories.accessibility} max={100} size="sm" />
                        </div>
                      </div>
                    )}
                    {data.speed.mobileDetails.categories.bestPractices !== null && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <p className="text-[10px] text-slate-500 mb-1">Best Practices</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{data.speed.mobileDetails.categories.bestPractices}</p>
                          <ProgressBar value={data.speed.mobileDetails.categories.bestPractices} max={100} size="sm" />
                        </div>
                      </div>
                    )}
                    {data.speed.mobileDetails.categories.seo !== null && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <p className="text-[10px] text-slate-500 mb-1">SEO</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{data.speed.mobileDetails.categories.seo}</p>
                          <ProgressBar value={data.speed.mobileDetails.categories.seo} max={100} size="sm" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {data.speed.mobileDetails?.opportunities && data.speed.mobileDetails.opportunities.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Топ-5 Можливості для Оптимізації
                  </h4>
                  <div className="space-y-2">
                    {data.speed.mobileDetails.opportunities.slice(0, 5).map((opp, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-slate-900">{opp.title}</p>
                          {opp.score !== undefined && (
                            <span className="text-[10px] font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded">
                              {opp.score}
                            </span>
                          )}
                        </div>
                        {opp.savings !== undefined && (
                          <p className="text-[10px] text-slate-500">
                            Potential savings: {opp.savings} {opp.savingsUnit || 'ms'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
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
