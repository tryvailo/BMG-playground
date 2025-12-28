'use client';

import React from 'react';
import { Plus, Upload, Download, ExternalLink } from 'lucide-react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import type { ServiceTableRow } from '~/lib/types/domain';

interface ServiceTableProps {
  data?: ServiceTableRow[];
  onAddService?: () => void;
  onUploadCSV?: () => void;
  onExport?: () => void;
}

// Mock data for visualization
const mockData: ServiceTableRow[] = [
  {
    serviceName: 'Heart Ultrasound',
    targetPage: 'https://adonis.com.ua/services/cardiology/ultrasound',
    country: 'UA',
    city: 'Kyiv',
    isVisible: true,
    foundUrl: 'https://adonis.com.ua/services/cardiology/ultrasound',
    position: 2,
    totalResults: 5,
    aivScore: 75.5,
    competitors: ['MedCenter', 'Health Clinic', 'CardioCare'],
    competitorUrls: [
      'https://medcenter.ua/cardiology',
      'https://healthclinic.ua/services',
      'https://cardiocare.ua/ultrasound',
    ],
  },
  {
    serviceName: 'Joint Ultrasound',
    targetPage: 'https://adonis.com.ua/services/orthopedics/joint-ultrasound',
    country: 'UA',
    city: 'Kyiv',
    isVisible: true,
    foundUrl: 'https://adonis.com.ua/services/orthopedics/joint-ultrasound',
    position: 1,
    totalResults: 4,
    aivScore: 88.2,
    competitors: ['OrthoCenter', 'JointCare'],
    competitorUrls: ['https://orthocenter.ua/joints', 'https://jointcare.ua'],
  },
  {
    serviceName: 'Gynecologist',
    targetPage: 'https://adonis.com.ua/services/gynecology',
    country: 'UA',
    city: 'Kyiv',
    isVisible: false,
    foundUrl: null,
    position: null,
    totalResults: 6,
    aivScore: 0,
    competitors: ['WomenHealth', 'GynecoCare', 'HealthPlus'],
    competitorUrls: [
      'https://womenhealth.ua',
      'https://gynecocare.ua',
      'https://healthplus.ua/gynecology',
    ],
  },
  {
    serviceName: 'Dental Implants',
    targetPage: 'https://adonis.com.ua/services/dentistry/implants',
    country: 'UA',
    city: 'Kyiv',
    isVisible: true,
    foundUrl: 'https://adonis.com.ua/services/dentistry/implants',
    position: 3,
    totalResults: 7,
    aivScore: 62.3,
    competitors: ['DentalCare', 'SmileCenter', 'DentPlus', 'ToothCare'],
    competitorUrls: [
      'https://dentalcare.ua/implants',
      'https://smilecenter.ua',
      'https://dentplus.ua',
      'https://toothcare.ua',
    ],
  },
  {
    serviceName: 'MRI Scan',
    targetPage: 'https://adonis.com.ua/services/diagnostics/mri',
    country: 'UA',
    city: 'Kyiv',
    isVisible: true,
    foundUrl: 'https://adonis.com.ua/services/diagnostics/mri',
    position: 1,
    totalResults: 5,
    aivScore: 92.1,
    competitors: ['DiagnosticCenter', 'MRIClinic'],
    competitorUrls: ['https://diagnosticcenter.ua/mri', 'https://mriclinic.ua'],
  },
  {
    serviceName: 'Cardiologist Consultation',
    targetPage: 'https://adonis.com.ua/services/cardiology/consultation',
    country: 'UA',
    city: 'Kyiv',
    isVisible: false,
    foundUrl: null,
    position: null,
    totalResults: 8,
    aivScore: 0,
    competitors: [
      'CardioCenter',
      'HeartCare',
      'CardioPlus',
      'HeartHealth',
      'CardioCare',
    ],
    competitorUrls: [
      'https://cardiocenter.ua',
      'https://heartcare.ua',
      'https://cardioplus.ua',
      'https://hearthealth.ua',
      'https://cardiocare.ua',
    ],
  },
];

export function ServiceTable({
  data = mockData,
  onAddService,
  onUploadCSV,
  onExport,
}: ServiceTableProps) {
  const truncateText = (text: string, maxLength: number = 30): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderCompetitors = (competitors: string[]): string => {
    if (competitors.length === 0) return '—';
    if (competitors.length <= 2) return competitors.join(', ');
    return `${competitors.slice(0, 2).join(', ')}...`;
  };

  const renderCompetitorUrls = (urls: string[]): React.ReactNode => {
    if (urls.length === 0) return <span className="text-slate-400">—</span>;
    if (urls.length === 1 && urls[0]) {
      return (
        <a
          href={urls[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1"
        >
          <span className="max-w-[120px] truncate">{truncateText(urls[0], 20)}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return (
      <div className="text-xs text-slate-600 dark:text-slate-400">
        {urls.length} URLs
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Service Visibility Analysis
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Аналіз видачі послуг клініки у системах ШІ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onExport} variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onAddService}
          size="sm"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
        <Button onClick={onUploadCSV} variant="outline" size="sm" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900">
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Service
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[150px]">
                Page
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Country
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                City
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Visibility
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Found URL
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Position
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Results
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                AIV Score
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Competitors
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Comp. URLs
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-100">
                  {row.serviceName}
                </TableCell>
                <TableCell className="text-xs max-w-[150px]">
                  <a
                    href={row.targetPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                    title={row.targetPage}
                  >
                    {truncateText(row.targetPage, 25)}
                  </a>
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                  {row.country}
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                  {row.city}
                </TableCell>
                <TableCell className="text-xs">
                  {row.isVisible ? (
                    <Badge variant="success" className="text-xs">
                      Present
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Not Present
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs max-w-[150px]">
                  {row.foundUrl ? (
                    <a
                      href={row.foundUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate block flex items-center gap-1"
                      title={row.foundUrl}
                    >
                      <span className="truncate">{truncateText(row.foundUrl, 20)}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                  {row.position !== null ? `#${row.position}` : '—'}
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                  {row.totalResults}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge
                    variant={row.aivScore > 70 ? 'success' : row.aivScore > 40 ? 'warning' : 'outline'}
                    className="text-xs"
                  >
                    {row.aivScore.toFixed(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px]">
                  <div className="truncate" title={row.competitors.join(', ')}>
                    {renderCompetitors(row.competitors)}
                  </div>
                </TableCell>
                <TableCell className="text-xs max-w-[150px]">
                  {renderCompetitorUrls(row.competitorUrls)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

