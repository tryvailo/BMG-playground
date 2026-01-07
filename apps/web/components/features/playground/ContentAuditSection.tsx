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
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';

import type { ContentAuditResult } from '~/lib/server/services/content/types';

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
  shadowSm: '0 4px 12px rgba(112, 144, 176, 0.1)',
};

// --- Horizon Card Component ---
interface HorizonCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
}

const HorizonCard = ({ children, className, title, subtitle, style }: HorizonCardProps) => (
  <Card
    className={cn(
      "border-none bg-white rounded-[20px] overflow-hidden transition-all duration-300",
      className
    )}
    style={{ boxShadow: HORIZON.shadow, ...style }}
  >
    {(title || subtitle) && (
      <CardHeader className="pb-2">
        {title && (
          <h3 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: HORIZON.textSecondary }}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm font-bold" style={{ color: HORIZON.textPrimary }}>
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
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-bold" style={{ color: HORIZON.textSecondary }}>{label}</span>
          {showValue && (
            <span className="text-xs font-bold" style={{ color: HORIZON.textPrimary }}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-[#F4F7FE] rounded-full overflow-hidden', heightClasses[size])}>
        <div
          className="transition-all duration-500 ease-out rounded-full shadow-sm"
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: getColor(),
            minWidth: percentage > 0 ? '4px' : '0'
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
        return <CheckCircle2 className="h-5 w-5" style={{ color: HORIZON.success }} />;
      case 'bad':
        return <XCircle className="h-5 w-5" style={{ color: HORIZON.error }} />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" style={{ color: HORIZON.warning }} />;
      default:
        return <Info className="h-5 w-5" style={{ color: HORIZON.textSecondary }} />;
    }
  };

  return (
    <HorizonCard className="border-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#F4F7FE] border border-[#E2E8F0]">
                  {icon || getStatusIcon()}
                </div>
                <div>
                  <CardTitle className="text-base font-bold" style={{ color: HORIZON.textPrimary }}>
                    {title}
                  </CardTitle>
                  {description && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: HORIZON.textSecondary }}>
                      {description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {calculatedScore !== null && calculatedScore !== undefined ? (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-2xl font-bold tracking-tighter',
                      calculatedScore >= 90 ? 'text-[#01B574]' :
                        calculatedScore >= 50 ? 'text-[#FFB547]' :
                          'text-[#EE5D50]'
                    )}>
                      {calculatedScore}
                    </span>
                    <span className="text-sm font-bold" style={{ color: HORIZON.textSecondary }}>/100</span>
                  </div>
                ) : null}
                {value && (
                  <span className="text-sm font-bold" style={{ color: HORIZON.textPrimary }}>
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
              <div className="mt-4">
                <ProgressBar value={calculatedScore} size="sm" showValue={false} />
              </div>
            ) : (
              <div className="mt-4 h-1.5 w-full bg-[#F4F7FE] rounded-full" />
            )}
          </div>
        </CollapsibleTrigger>
        {children && (
          <CollapsibleContent>
            <div className="mt-6 pt-6 border-t" style={{ borderColor: HORIZON.background }}>
              {children}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </HorizonCard>
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

export function ContentAuditSection({ result, className }: ContentAuditSectionProps) {
  const t = useTranslations('Playground.contentAudit');

  if (!result) {
    return null;
  }

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
    <div className={cn('space-y-6 pb-20 animate-in fade-in duration-700', className)}>
      {/* KPI Summary Cards */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <Layers className="w-5 h-5" style={{ color: HORIZON.primary }} />
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: HORIZON.textPrimary }}>
            Аналіз контенту
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          <KpiCard
            label="Структура сайту"
            value={`${categoryScores.structure}%`}
            benchmark="80%"
            trend={categoryScores.structure >= 80 ? '+' + (categoryScores.structure - 80) + '%' : '-' + (80 - categoryScores.structure) + '%'}
            icon={Layout}
            iconBg={HORIZON.primaryLight}
            iconColor={HORIZON.primary}
          />
          <KpiCard
            label="Якість тексту"
            value={`${Math.round(categoryScores.textQuality)}%`}
            benchmark="75%"
            trend={Math.round(categoryScores.textQuality) >= 75 ? '+' + (Math.round(categoryScores.textQuality) - 75) + '%' : '-' + (75 - Math.round(categoryScores.textQuality)) + '%'}
            icon={FileText}
            iconBg={HORIZON.successLight}
            iconColor={HORIZON.success}
          />
          <KpiCard
            label="Авторитетність"
            value={`${categoryScores.authority}%`}
            benchmark="70%"
            trend={categoryScores.authority >= 70 ? '+' + (categoryScores.authority - 70) + '%' : '-' + (70 - categoryScores.authority) + '%'}
            icon={Shield}
            iconBg={HORIZON.warningLight}
            iconColor={HORIZON.warning}
          />
        </div>
      </section>

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
        <HorizonCard className="border-none" style={{ backgroundColor: '#FFF9F2' }}>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-[#FFB54720]">
                <AlertTriangle className="h-6 w-6 text-[#FFB547]" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: HORIZON.textSecondary }}>
                  Action Plan
                </h3>
                <p className="text-xl font-bold" style={{ color: HORIZON.textPrimary }}>
                  Recommendations ({result.recommendations.length})
                </p>
              </div>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-[#FFB547] mt-1 flex-shrink-0 font-bold">•</span>
                  <span className="leading-relaxed font-medium" style={{ color: '#4A5568' }}>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </HorizonCard>
      )}
    </div>
  );
}
