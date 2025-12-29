'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link2,
  Phone,
  MapPin,
  HelpCircle,
  ChevronDown,
  Info,
  AlertCircle,
  Shield,
  Users,
  Layout,
  BookOpen,
  Hash,
  Droplets,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';

import type { ContentAuditResult } from '~/lib/server/services/content/types';

// --- Premium 2026 Light Tokens ---
  const _TOKENS = {
    colors: {
        you: '#f43f5e', // Ruby
        c1: '#3b82f6', // Blue
        c2: '#8b5cf6', // Violet
        c3: '#10b981', // Emerald
        c4: '#f59e0b', // Amber
        c5: '#0ea5e9', // Sky
        c6: '#6366f1', // Indigo
        c7: '#d946ef', // Fuchsia
        c8: '#f97316', // Orange
        c9: '#14b8a6', // Teal
        c10: '#64748b', // Slate
        marketAvg: '#cbd5e1',
    },
    shadows: {
        soft: 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
        deep: 'shadow-[0_20px_50px_rgba(0,0,0,0.06)]',
    }
};

// --- Custom Modern Components ---
interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

const BentoCard = ({ children, className, title, subtitle }: BentoCardProps) => (
    <Card className={cn(
        "border border-slate-200 bg-white shadow-[0_8px_32px_0_rgba(15,23,42,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] group",
        className
    )}>
        {(title || subtitle) && (
            <CardHeader className="pb-2">
                {title && <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-primary transition-colors">{title}</h3>}
                {subtitle && <p className="text-sm font-bold text-slate-900">{subtitle}</p>}
            </CardHeader>
        )}
        <CardContent className={cn("p-6", (title || subtitle) && "pt-2")}>
            {children}
        </CardContent>
    </Card>
);

interface ContentAuditSectionProps {
  /** Optional URL from parent context. If provided, will be used as default */
  defaultUrl?: string;
  /** Optional pre-computed result. If provided, will be displayed directly */
  result?: ContentAuditResult | null;
  className?: string;
}

/**
 * Progress Bar Component
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function ProgressBar({ value, max = 100, label, showValue = true, size = 'md' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = () => {
    if (percentage < 50) return 'bg-red-600';
    if (percentage < 90) return 'bg-orange-500';
    return 'bg-emerald-600';
  };

  const heightClasses = {
    sm: 'h-2.5',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-bold text-slate-700">{label}</span>
          {showValue && (
            <span className="text-sm font-black text-slate-900">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300', heightClasses[size])}>
        <div
          className={cn('transition-all duration-500 ease-out rounded-full shadow-sm', getColor())}
          style={{
            width: `${percentage}%`,
            height: '100%',
            minWidth: percentage > 0 ? '4px' : '0',
            minHeight: '100%'
          }}
        />
      </div>
    </div>
  );
}

/**
 * Enhanced Minimal Metric Card Component
 */
interface MinimalMetricCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status: 'good' | 'bad' | 'warning' | 'neutral';
  value?: string | number | React.ReactNode;
  score?: number | null;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function MinimalMetricCard({
  title,
  description,
  icon,
  status,
  value,
  score,
  children,
  defaultOpen = false
}: MinimalMetricCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Auto-calculate score from status if score is not provided
  const calculatedScore = score !== undefined && score !== null
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
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'bad':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Info className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'bg-emerald-50 border-emerald-300';
      case 'bad':
        return 'bg-red-50 border-red-300';
      case 'warning':
        return 'bg-orange-50 border-orange-300';
      default:
        return 'bg-white border-slate-200';
    }
  };

  return (
    <BentoCard className={cn('border-2', getStatusColor())}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon || getStatusIcon()}
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {title}
                  </CardTitle>
                  {description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {calculatedScore !== null && calculatedScore !== undefined ? (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-lg font-black italic',
                      calculatedScore >= 90 ? 'text-emerald-500' :
                        calculatedScore >= 50 ? 'text-orange-500' :
                          'text-rose-500'
                    )}>
                      {calculatedScore}
                    </span>
                    <span className="text-sm text-slate-500">/100</span>
                  </div>
                ) : null}
                {value && (
                  <span className="text-base font-bold text-slate-900">
                    {value}
                  </span>
                )}
                <ChevronDown className={cn(
                  'h-5 w-5 text-slate-400 transition-transform',
                  isOpen && 'rotate-180'
                )} />
              </div>
            </div>
            {calculatedScore !== null && calculatedScore !== undefined ? (
              <div className="mt-3">
                <ProgressBar value={calculatedScore} size="sm" showValue={false} />
              </div>
            ) : (
              <div className="mt-3 h-2.5 w-full bg-slate-100 rounded-full border border-slate-200" />
            )}
          </CardHeader>
        </CollapsibleTrigger>
        {children && (
          <CollapsibleContent>
            <CardContent className="pt-0">
              {children}
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </BentoCard>
  );
}

/**
 * Calculate Overall Score
 */
function calculateOverallScore(data: ContentAuditResult): number {
  const scores: number[] = [];

  // Text Quality scores (inverted for wateriness - lower is better)
  scores.push(100 - data.text_quality.wateriness_score); // Invert: 0% wateriness = 100 score
  scores.push(data.text_quality.uniqueness_score);

  // Structure score
  scores.push(data.structure.architecture_score);

  // Authority scores (boolean to score)
  if (data.authority.has_valid_phone) scores.push(100);
  if (data.authority.has_valid_address) scores.push(100);
  if (data.authority.authority_links_count > 0) scores.push(Math.min(100, data.authority.authority_links_count * 20)); // 1 link = 20, 5+ = 100
  if (data.authority.faq_count >= 3) scores.push(100);
  else if (data.authority.faq_count > 0) scores.push(50);

  // Structure pages (boolean to score)
  if (data.structure.has_doctor_pages) scores.push(100);
  if (data.structure.has_service_pages) scores.push(100);
  if (data.structure.has_department_pages) scores.push(100);
  if (data.structure.has_blog) scores.push(100);

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function ContentAuditSection({ result, className }: ContentAuditSectionProps) {
  const t = useTranslations('Playground.contentAudit');

  if (!result) {
    return null;
  }

  const overallScore = calculateOverallScore(result);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-300';
    if (score >= 50) return 'bg-orange-50 border-orange-300';
    return 'bg-red-50 border-red-300';
  };

  // Calculate category scores
  const categoryScores = {
    structure: result.structure.architecture_score,
    textQuality: (result.text_quality.uniqueness_score + (100 - result.text_quality.wateriness_score)) / 2,
    authority: (() => {
      const scores: number[] = [];
      if (result.authority.has_valid_phone) scores.push(100);
      if (result.authority.has_valid_address) scores.push(100);
      if (result.authority.authority_links_count > 0) scores.push(Math.min(100, result.authority.authority_links_count * 20));
      if (result.authority.faq_count >= 3) scores.push(100);
      else if (result.authority.faq_count > 0) scores.push(50);
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    })(),
  };

  const s = result.structure;
  const q = result.text_quality;
  const a = result.authority;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Results Header */}
      <BentoCard className={cn('border-2 relative overflow-hidden bg-white', getScoreBgColor(overallScore))}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
          <FileText className="w-24 h-24" />
        </div>
        <CardHeader>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
                {t('title')}
              </h1>
              <p className="text-sm font-medium text-slate-700">
                {t('description')}
              </p>
            </div>
            <div className="text-center">
              <div className={cn('text-5xl font-black italic tracking-tighter mb-1', getScoreColor(overallScore))}>
                {overallScore}
              </div>
              <div className="text-sm font-bold text-slate-600">
                / 100
              </div>
            </div>
          </div>

          {/* Category Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Structure</span>
                <span className="text-xs font-black text-slate-900">{categoryScores.structure}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                <div
                  className={cn(
                    'transition-all duration-500 ease-out rounded-full shadow-sm h-full',
                    categoryScores.structure >= 90 ? 'bg-emerald-600' : categoryScores.structure >= 50 ? 'bg-orange-500' : 'bg-red-600'
                  )}
                  style={{ width: `${categoryScores.structure}%`, minWidth: categoryScores.structure > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Text Quality</span>
                <span className="text-xs font-black text-slate-900">{Math.round(categoryScores.textQuality)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                <div
                  className={cn(
                    'transition-all duration-500 ease-out rounded-full shadow-sm h-full',
                    categoryScores.textQuality >= 90 ? 'bg-emerald-600' : categoryScores.textQuality >= 50 ? 'bg-orange-500' : 'bg-red-600'
                  )}
                  style={{ width: `${categoryScores.textQuality}%`, minWidth: categoryScores.textQuality > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Authority</span>
                <span className="text-xs font-black text-slate-900">{categoryScores.authority}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                <div
                  className={cn(
                    'transition-all duration-500 ease-out rounded-full shadow-sm h-full',
                    categoryScores.authority >= 90 ? 'bg-emerald-600' : categoryScores.authority >= 50 ? 'bg-orange-500' : 'bg-red-600'
                  )}
                  style={{ width: `${categoryScores.authority}%`, minWidth: categoryScores.authority > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </BentoCard>

      {/* Audit Items List */}
      <div className="space-y-3">
        {/* 4.1 Direction Pages */}
        <MinimalMetricCard
          title={t('items.4_1.title')}
          description={t('items.4_1.description')}
          icon={<Layout className="h-5 w-5 text-blue-500" />}
          status={s.direction_pages_count && s.direction_pages_count > 0 ? 'good' : 'bad'}
          value={s.direction_pages_count || 0}
        >
          <div className="text-sm space-y-2">
            <p className="text-slate-700">Виявлено <strong className="font-bold text-slate-900">{s.direction_pages_count || 0}</strong> унікальних посилань на сторінки напрямків.</p>
            <p className="text-slate-500">Наявність окремих сторінок для кожного напрямку допомагає AI краще зрозуміти спеціалізацію клініки.</p>
          </div>
        </MinimalMetricCard>

        {/* 4.2 Service Pages */}
        <MinimalMetricCard
          title={t('items.4_2.title')}
          description={t('items.4_2.description')}
          icon={<Hash className="h-5 w-5 text-indigo-500" />}
          status={s.service_pages_count && s.service_pages_count > 5 ? 'good' : s.service_pages_count && s.service_pages_count > 0 ? 'warning' : 'bad'}
          value={s.service_pages_count || 0}
        >
          <div className="text-sm space-y-2">
            <p className="text-slate-700">Знайдено <strong className="font-bold text-slate-900">{s.service_pages_count || 0}</strong> сторінок послуг.</p>
            <p className="text-slate-500">Рекомендується мати детальну сторінку для кожної конкретної послуги з детальним описом.</p>
          </div>
        </MinimalMetricCard>

        {/* 4.3 Doctor Pages */}
        <MinimalMetricCard
          title={t('items.4_3.title')}
          description={t('items.4_3.description')}
          icon={<Users className="h-5 w-5 text-emerald-500" />}
          status={s.has_doctor_pages && s.doctor_details?.has_photos && s.doctor_details?.has_bio ? 'good' : s.has_doctor_pages ? 'warning' : 'bad'}
        >
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              {s.doctor_details?.has_photos ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
              <span className="text-slate-700 font-medium">Фото лікарів</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              {s.doctor_details?.has_bio ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
              <span className="text-slate-700 font-medium">Біографія</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              {s.doctor_details?.has_experience ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
              <span className="text-slate-700 font-medium">Досвід роботи</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              {s.doctor_details?.has_certificates ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
              <span className="text-slate-700 font-medium">Сертифікати</span>
            </div>
          </div>
        </MinimalMetricCard>

        {/* 4.4 Site Architecture */}
        <MinimalMetricCard
          title={t('items.4_4.title')}
          description={t('items.4_4.description')}
          icon={<Layout className="h-5 w-5 text-orange-500" />}
          status={s.architecture_score >= 80 ? 'good' : s.architecture_score >= 50 ? 'warning' : 'bad'}
          score={s.architecture_score}
        >
          <div className="text-sm space-y-2">
            <p className="text-slate-700">Оцінка архітектури: <strong className="font-bold text-slate-900">{s.architecture_score}/100</strong>.</p>
            {s.internal_linking_circular && (
              <Alert variant="warning" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">Виявлено ознаки кругового лінкування (Лікар ↔ Послуга ↔ Філія).</AlertDescription>
              </Alert>
            )}
            <p className="text-slate-500">Гарна архітектура дозволяє користувачеві знайти будь-яку послугу за 2-3 кліки від головної.</p>
          </div>
        </MinimalMetricCard>

        {/* 4.5 Blog */}
        <MinimalMetricCard
          title={t('items.4_5.title')}
          description={t('items.4_5.description')}
          icon={<BookOpen className="h-5 w-5 text-purple-500" />}
          status={s.has_blog && s.blog_details?.is_regularly_updated ? 'good' : s.has_blog ? 'warning' : 'bad'}
        >
          {s.has_blog ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-1">Кількість статей</p>
                <p className="font-black text-slate-900">{s.blog_details?.posts_count || 0}</p>
              </div>
              <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-1">Середня довжина</p>
                <p className="font-black text-slate-900">{s.blog_details?.avg_article_length || 0} слів</p>
              </div>
              <div className="col-span-2 p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-1">Регулярність оновлень</p>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", s.blog_details?.is_regularly_updated ? "bg-emerald-500" : "bg-red-500")} />
                  <span className="text-xs font-medium text-slate-700">{s.blog_details?.is_regularly_updated ? "Активно оновлюється" : "Давно не було нових статей"}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Блог не знайдено. Статті допомагають будувати E-E-A-T.</p>
          )}
        </MinimalMetricCard>

        {/* 4.6 Uniqueness */}
        <MinimalMetricCard
          title={t('items.4_6.title')}
          description={t('items.4_6.description')}
          icon={<FileText className="h-5 w-5 text-cyan-500" />}
          status={q.uniqueness_score >= 90 ? 'good' : q.uniqueness_score >= 70 ? 'warning' : 'bad'}
          value={`${q.uniqueness_score.toFixed(0)}%`}
        >
          <div className="space-y-3">
            <ProgressBar value={q.uniqueness_score} size="sm" />
            <p className="text-xs text-slate-500 italic">Примітка: Унікальність базово оцінена на основі структури контенту та повторів.</p>
          </div>
        </MinimalMetricCard>

        {/* 4.7 Wateriness */}
        <MinimalMetricCard
          title={t('items.4_7.title')}
          description={t('items.4_7.description')}
          icon={<Droplets className="h-5 w-5 text-blue-400" />}
          status={q.wateriness_score < 20 ? 'good' : q.wateriness_score < 25 ? 'warning' : 'bad'}
          value={`${q.wateriness_score.toFixed(1)}%`}
        >
          <p className="text-sm text-slate-700">Показник водянистості: <strong className="font-bold text-slate-900">{q.wateriness_score.toFixed(1)}%</strong>.</p>
          <p className="text-xs text-slate-500 mt-1">Норма — до 25%. Високий показник означає багато &quot;стоп-слів&quot; та мало корисної інформації.</p>
        </MinimalMetricCard>

        {/* 4.8 Link Authority */}
        <MinimalMetricCard
          title={t('items.4_8.title')}
          description={t('items.4_8.description')}
          icon={<Shield className="h-5 w-5 text-slate-700" />}
          status={a.authority_links_count >= 3 ? 'good' : a.authority_links_count > 0 ? 'warning' : 'bad'}
          value={a.authority_links_count}
        >
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-700">Знайдено <strong className="font-bold text-slate-900">{a.authority_links_count}</strong> посилань на трастові домени.</span>
          </div>
          <p className="text-xs text-slate-500">Трастові домени: ВООЗ, МОЗ, NIH, PubMed та медичні асоціації.</p>
        </MinimalMetricCard>

        {/* 4.9 FAQ */}
        <MinimalMetricCard
          title={t('items.4_9.title')}
          description={t('items.4_9.description')}
          icon={<HelpCircle className="h-5 w-5 text-yellow-500" />}
          status={a.faq_count >= 3 ? 'good' : a.faq_count > 0 ? 'warning' : 'bad'}
          value={a.faq_count}
        >
          <p className="text-sm text-slate-700">Кількість питань у розділі FAQ: <strong className="font-bold text-slate-900">{a.faq_count}</strong>.</p>
          <p className="text-xs text-slate-500 mt-1">FAQ допомагає отримати розширені результати (Rich Snippets) у пошуку.</p>
        </MinimalMetricCard>

        {/* 4.10 Address */}
        <MinimalMetricCard
          title={t('items.4_10.title')}
          description={t('items.4_10.description')}
          icon={<MapPin className="h-5 w-5 text-red-500" />}
          status={a.has_valid_address ? 'good' : 'bad'}
        >
          <p className="text-sm text-slate-700">Статус адреси: {a.has_valid_address ? <span className="text-emerald-600 font-bold">Знайдено</span> : <span className="text-red-600 font-bold">Відсутня</span>}.</p>
          <p className="text-xs text-slate-500 mt-1">Чітка адреса критично важлива для локальної видимості (Local SEO).</p>
        </MinimalMetricCard>

        {/* 4.11 Phone */}
        <MinimalMetricCard
          title={t('items.4_11.title')}
          description={t('items.4_11.description')}
          icon={<Phone className="h-5 w-5 text-green-500" />}
          status={a.has_valid_phone && a.is_phone_clickable ? 'good' : a.has_valid_phone ? 'warning' : 'bad'}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Наявність телефону:</span>
              <span>{a.has_valid_phone ? "✅ Так" : "❌ Ні"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Можливість кліку (tel:):</span>
              <span>{a.is_phone_clickable ? "✅ Так" : "❌ Ні"}</span>
            </div>
          </div>
        </MinimalMetricCard>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <BentoCard className="border-2 border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 text-xl font-black italic">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              Рекомендації ({result.recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-slate-700 leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </BentoCard>
      )}
    </div>
  );
}
