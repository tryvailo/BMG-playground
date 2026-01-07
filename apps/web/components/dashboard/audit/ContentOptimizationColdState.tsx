'use client';

import React from 'react';
import {
  FileText,
  Users,
  Stethoscope,
  Network,
  BookOpen,
  Sparkles,
  Droplets,
  Link2,
  HelpCircle,
  Phone,
  Clock,
  Bell,
  Mail,
  Play,
  CheckCircle2,
  Loader2,
  Circle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

const Progress = ({ value = 0, className }: { value?: number; className?: string }) => (
  <div className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}>
    <div
      className="bg-primary h-full flex-1 transition-all"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export type ContentCheckStatus = 'completed' | 'in-progress' | 'pending';

export interface ContentCheckItem {
  id: string;
  label: string;
  status: ContentCheckStatus;
  icon: React.ElementType;
  weight: string;
}

interface ContentOptimizationColdStateProps {
  isRunning?: boolean;
  progress?: number;
  currentStep?: string;
  checks?: ContentCheckItem[];
  onRunAudit?: () => void;
  onNotify?: () => void;
  onEmailNotify?: () => void;
  estimatedTime?: string;
}

const defaultChecks: ContentCheckItem[] = [
  { id: 'directions', label: 'Сторінки напрямків', status: 'pending', icon: Stethoscope, weight: '10%' },
  { id: 'services', label: 'Сторінки послуг', status: 'pending', icon: FileText, weight: '15%' },
  { id: 'doctors', label: 'Сторінки лікарів', status: 'pending', icon: Users, weight: '15%' },
  { id: 'architecture', label: 'Архітектура сайту', status: 'pending', icon: Network, weight: '15%' },
  { id: 'blog', label: 'Блог та статті', status: 'pending', icon: BookOpen, weight: '10%' },
  { id: 'uniqueness', label: 'Унікальність контенту', status: 'pending', icon: Sparkles, weight: '15%' },
  { id: 'wateriness', label: 'Водянистість тексту', status: 'pending', icon: Droplets, weight: '5%' },
  { id: 'authority', label: 'Авторитетність посилань', status: 'pending', icon: Link2, weight: '5%' },
  { id: 'faq', label: 'FAQ секція', status: 'pending', icon: HelpCircle, weight: '5%' },
  { id: 'contacts', label: 'Контактна інформація', status: 'pending', icon: Phone, weight: '5%' },
];

const StatusIcon = ({ status }: { status: ContentCheckStatus }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'in-progress':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'pending':
      return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  }
};

const BenchmarkCard = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string; highlight?: boolean }[];
}) => (
  <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
    <div className="flex items-center gap-1.5 mb-2">
      <Info className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </span>
    </div>
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground leading-tight">{item.label}</span>
          <span className={cn(
            "font-semibold flex-shrink-0 ml-2",
            item.highlight ? "text-primary" : "text-foreground"
          )}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export function ContentOptimizationColdState({
  isRunning = false,
  progress = 0,
  currentStep,
  checks = defaultChecks,
  onRunAudit,
  onNotify,
  onEmailNotify,
  estimatedTime = '2-4 хвилини',
}: ContentOptimizationColdStateProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-1">
          {isRunning ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <FileText className="h-6 w-6 text-primary" />
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {isRunning ? 'Аналіз контенту вашого сайту' : 'Оптимізація контенту'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {isRunning
            ? currentStep || 'Аналізуємо структуру та якість контенту...'
            : 'Запустіть аудит для аналізу структури, унікальності та оптимізації контенту вашого сайту'}
        </p>
      </div>

      {/* Progress Section (when running) */}
      {isRunning && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Розрахунковий час: ~{estimatedTime}
            </span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Score Placeholders */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Content Score', icon: FileText },
          { label: 'Uniqueness', icon: Sparkles },
          { label: 'Architecture', icon: Network },
        ].map((item) => (
          <Card key={item.label} className="border-dashed">
            <CardContent className="pt-3 pb-3 flex flex-col items-center">
              <div className="relative w-16 h-16 mb-1">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />
                  {isRunning && (
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray="283"
                      strokeDashoffset="200"
                      strokeLinecap="round"
                      className="text-primary/30 animate-pulse"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  ) : (
                    <item.icon className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium text-center leading-tight">{item.label}</span>
              <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                {isRunning ? 'analyzing...' : 'pending'}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checklist */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Що перевіряємо
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {checks.map((check) => (
              <div
                key={check.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-colors",
                  check.status === 'completed' && "bg-emerald-50 dark:bg-emerald-500/10",
                  check.status === 'in-progress' && "bg-blue-50 dark:bg-blue-500/10",
                  check.status === 'pending' && "bg-muted/30"
                )}
              >
                <StatusIcon status={check.status} />
                <check.icon className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  check.status === 'completed' && "text-emerald-600 dark:text-emerald-400",
                  check.status === 'in-progress' && "text-blue-600 dark:text-blue-400",
                  check.status === 'pending' && "text-muted-foreground/60"
                )} />
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-xs leading-tight block",
                    check.status === 'pending' && "text-muted-foreground"
                  )}>
                    {check.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">{check.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benchmarks */}
      <div className="grid grid-cols-2 gap-2">
        <BenchmarkCard
          title="Benchmark контенту"
          items={[
            { label: 'Сторінки послуг (норма)', value: '10+' },
            { label: 'Сторінки послуг (відмінно)', value: '20+', highlight: true },
            { label: 'Сторінки лікарів (норма)', value: '5+' },
            { label: 'Сторінки лікарів (відмінно)', value: '15+', highlight: true },
          ]}
        />
        <BenchmarkCard
          title="Якість контенту"
          items={[
            { label: 'Унікальність (норма)', value: '80%+' },
            { label: 'Унікальність (відмінно)', value: '95%+', highlight: true },
            { label: 'Водянистість (норма)', value: '<25%' },
            { label: 'Водянистість (відмінно)', value: '<10%', highlight: true },
          ]}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
        {!isRunning ? (
          <Button onClick={onRunAudit} size="lg" className="w-full sm:w-auto">
            <Play className="h-4 w-4 mr-2" />
            Запустити аудит
          </Button>
        ) : (
          <>
            {onNotify && (
              <Button variant="outline" size="lg" onClick={onNotify} className="w-full sm:w-auto">
                <Bell className="h-4 w-4 mr-2" />
                Повідомити коли готово
              </Button>
            )}
            {onEmailNotify && (
              <Button variant="ghost" size="lg" onClick={onEmailNotify} className="w-full sm:w-auto">
                <Mail className="h-4 w-4 mr-2" />
                Надіслати на email
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

