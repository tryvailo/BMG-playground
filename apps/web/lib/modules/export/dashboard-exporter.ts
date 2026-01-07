/**
 * Dashboard Exporter
 * Week 5, Days 2-3: Export dashboard data to PDF and Excel
 */

import * as XLSX from 'xlsx';

/**
 * Dashboard data for export
 */
export interface DashboardExportData {
  clinicName: string;
  generatedAt: string;
  clinicAIScore: number;
  visibility: number;
  techScore: number;
  contentScore: number;
  eeatScore: number;
  localScore: number;
  performanceScore: number;
  services: ServiceExportData[];
  techAudit?: TechAuditExportData;
  competitors?: CompetitorExportData[];
}

export interface ServiceExportData {
  serviceName: string;
  targetPage: string;
  country?: string;
  city?: string;
  visibility: number;
  position?: number;
  aivScore: number;
}

export interface TechAuditExportData {
  desktopScore: number;
  mobileScore: number;
  httpsEnabled: boolean;
  mobileFriendly: boolean;
  llmsTxtPresent: boolean;
  llmsTxtScore?: number;
  robotsTxtPresent: boolean;
  sitemapPresent: boolean;
  schemas: {
    name: string;
    present: boolean;
  }[];
}

export interface CompetitorExportData {
  name: string;
  score: number;
  position: number;
}

/**
 * Export services to Excel
 */
export function exportServicesExcel(
  services: ServiceExportData[],
  clinicName: string,
): Blob {
  const worksheetData = [
    ['Service Name', 'Target Page', 'Country', 'City', 'Visibility %', 'Position', 'AIV Score'],
    ...services.map((s) => [
      s.serviceName,
      s.targetPage,
      s.country || '',
      s.city || '',
      s.visibility,
      s.position || '',
      s.aivScore,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Service Name
    { wch: 40 }, // Target Page
    { wch: 10 }, // Country
    { wch: 15 }, // City
    { wch: 12 }, // Visibility
    { wch: 10 }, // Position
    { wch: 12 }, // AIV Score
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Services');

  // Add summary sheet
  const summaryData = [
    ['Clinic', clinicName],
    ['Generated At', new Date().toISOString()],
    ['Total Services', services.length],
    ['Visible Services', services.filter((s) => s.visibility > 0).length],
    ['Average Visibility', calculateAverage(services.map((s) => s.visibility)).toFixed(1) + '%'],
    ['Average AIV Score', calculateAverage(services.map((s) => s.aivScore)).toFixed(1)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Export full dashboard to Excel
 */
export function exportDashboardExcel(data: DashboardExportData): Blob {
  const workbook = XLSX.utils.book_new();

  // 1. Summary sheet
  const summaryData = [
    ['ClinicAI Dashboard Report'],
    [''],
    ['Clinic', data.clinicName],
    ['Generated At', data.generatedAt],
    [''],
    ['Key Metrics'],
    ['ClinicAI Score', data.clinicAIScore],
    ['Visibility', data.visibility + '%'],
    ['Tech Score', data.techScore + '%'],
    ['Content Score', data.contentScore + '%'],
    ['E-E-A-T Score', data.eeatScore + '%'],
    ['Local Score', data.localScore + '%'],
    ['Performance Score', data.performanceScore + '%'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // 2. Services sheet
  const servicesData = [
    ['Service Name', 'Target Page', 'Country', 'City', 'Visibility %', 'Position', 'AIV Score'],
    ...data.services.map((s) => [
      s.serviceName,
      s.targetPage,
      s.country || '',
      s.city || '',
      s.visibility,
      s.position || '',
      s.aivScore,
    ]),
  ];

  const servicesSheet = XLSX.utils.aoa_to_sheet(servicesData);
  servicesSheet['!cols'] = [
    { wch: 25 },
    { wch: 40 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, servicesSheet, 'Services');

  // 3. Tech Audit sheet
  if (data.techAudit) {
    const techData = [
      ['Technical Audit Results'],
      [''],
      ['Desktop Speed Score', data.techAudit.desktopScore + '/100'],
      ['Mobile Speed Score', data.techAudit.mobileScore + '/100'],
      ['HTTPS Enabled', data.techAudit.httpsEnabled ? 'Yes' : 'No'],
      ['Mobile Friendly', data.techAudit.mobileFriendly ? 'Yes' : 'No'],
      ['llms.txt Present', data.techAudit.llmsTxtPresent ? 'Yes' : 'No'],
      ['llms.txt Score', data.techAudit.llmsTxtScore ? data.techAudit.llmsTxtScore + '/100' : 'N/A'],
      ['robots.txt Present', data.techAudit.robotsTxtPresent ? 'Yes' : 'No'],
      ['Sitemap Present', data.techAudit.sitemapPresent ? 'Yes' : 'No'],
      [''],
      ['Schema Markup'],
      ...data.techAudit.schemas.map((s) => [s.name, s.present ? 'Present' : 'Missing']),
    ];

    const techSheet = XLSX.utils.aoa_to_sheet(techData);
    techSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, techSheet, 'Tech Audit');
  }

  // 4. Competitors sheet
  if (data.competitors && data.competitors.length > 0) {
    const compData = [
      ['Competitor Analysis'],
      [''],
      ['Competitor', 'Score', 'Position'],
      ...data.competitors.map((c) => [c.name, c.score, c.position]),
    ];

    const compSheet = XLSX.utils.aoa_to_sheet(compData);
    compSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, compSheet, 'Competitors');
  }

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generate PDF content as HTML (for client-side PDF generation)
 * Returns HTML string that can be converted to PDF using html2pdf or similar
 */
export function generateDashboardPDFContent(data: DashboardExportData): string {
  const servicesRows = data.services
    .map(
      (s) => `
      <tr>
        <td>${escapeHtml(s.serviceName)}</td>
        <td>${s.visibility}%</td>
        <td>${s.position || '-'}</td>
        <td>${s.aivScore.toFixed(1)}</td>
      </tr>
    `,
    )
    .join('');

  const schemasRows = data.techAudit?.schemas
    .map(
      (s) => `
      <tr>
        <td>${escapeHtml(s.name)}</td>
        <td style="color: ${s.present ? 'green' : 'red'}">${s.present ? '✓' : '✗'}</td>
      </tr>
    `,
    )
    .join('') || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ClinicAI Dashboard Report - ${escapeHtml(data.clinicName)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    h1 {
      color: #1a1a2e;
      border-bottom: 2px solid #4a90a4;
      padding-bottom: 10px;
    }
    h2 {
      color: #4a90a4;
      margin-top: 30px;
    }
    .meta {
      color: #666;
      margin-bottom: 20px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .metric-card {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #1a1a2e;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #4a90a4;
      color: white;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>ClinicAI Dashboard Report</h1>
  <div class="meta">
    <strong>Clinic:</strong> ${escapeHtml(data.clinicName)}<br>
    <strong>Generated:</strong> ${data.generatedAt}
  </div>

  <h2>Key Metrics</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value">${data.clinicAIScore}</div>
      <div class="metric-label">ClinicAI Score</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.visibility}%</div>
      <div class="metric-label">Visibility</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.techScore}%</div>
      <div class="metric-label">Tech Score</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.contentScore}%</div>
      <div class="metric-label">Content Score</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.eeatScore}%</div>
      <div class="metric-label">E-E-A-T Score</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.localScore}%</div>
      <div class="metric-label">Local Score</div>
    </div>
  </div>

  <h2>Services (${data.services.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Service</th>
        <th>Visibility</th>
        <th>Position</th>
        <th>AIV Score</th>
      </tr>
    </thead>
    <tbody>
      ${servicesRows}
    </tbody>
  </table>

  ${data.techAudit ? `
  <h2>Technical Audit</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value">${data.techAudit.desktopScore}</div>
      <div class="metric-label">Desktop Speed</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.techAudit.mobileScore}</div>
      <div class="metric-label">Mobile Speed</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.techAudit.httpsEnabled ? '✓' : '✗'}</div>
      <div class="metric-label">HTTPS</div>
    </div>
  </div>

  <h3>Schema Markup</h3>
  <table>
    <thead>
      <tr>
        <th>Schema Type</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${schemasRows}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    Generated by ClinicAI Platform • ${new Date().toISOString()}
  </div>
</body>
</html>
`;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download HTML as PDF (using print dialog)
 */
export function downloadAsPDF(htmlContent: string, _filename: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.print();
  };
}

// Helper functions
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
