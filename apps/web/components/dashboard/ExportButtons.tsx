/**
 * ExportButtons Component
 * Week 5, Days 2-3: Export dashboard to PDF/Excel
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@kit/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  projectId: string;
  disabled?: boolean;
}

export function ExportButtons({ projectId, disabled }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'excel' | 'pdf' | 'json', type: 'full' | 'services') => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    const exportKey = `${format}-${type}`;
    setExporting(exportKey);

    try {
      const response = await fetch(
        `/api/export?projectId=${projectId}&format=${format}&type=${type}`,
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        downloadBlob(blob, `dashboard-${projectId}.json`);
        toast.success('JSON exported successfully');
      } else if (format === 'excel') {
        const blob = await response.blob();
        const filename = type === 'services' 
          ? `services-${projectId}.xlsx`
          : `dashboard-report-${projectId}.xlsx`;
        downloadBlob(blob, filename);
        toast.success('Excel file downloaded');
      } else if (format === 'pdf') {
        const html = await response.text();
        openPrintWindow(html);
        toast.success('PDF ready for print');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openPrintWindow = (html: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups for PDF export');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const isExporting = exporting !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Dashboard</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('excel', 'full')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Full Report (Excel)
          {exporting === 'excel-full' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf', 'full')}
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 mr-2" />
          Full Report (PDF)
          {exporting === 'pdf-full' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Export Services</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('excel', 'services')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Services Only (Excel)
          {exporting === 'excel-services' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Data Export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('json', 'full')}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          Raw Data (JSON)
          {exporting === 'json-full' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
