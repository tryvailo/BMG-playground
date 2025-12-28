'use client';

import React, { useState } from 'react';
import { AlertTriangle, Globe, Cpu, FileText } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { LoadingOverlay } from '@kit/ui/loading-overlay';

import { useTechAudit, useRunAudit } from './hooks/use-tech-audit';

export function TechAudit() {
  const [url, setUrl] = useState('https://example-clinic.com');
  const { data: result, isLoading, error } = useTechAudit(url);
  const runAuditMutation = useRunAudit();

  const isScanning = runAuditMutation.isPending;

  const handleScan = () => {
    if (url) {
      runAuditMutation.mutate(url);
    }
  };

  if (isLoading && !result) {
    return (
      <LoadingOverlay>
        <span className="text-muted-foreground">Loading audit data...</span>
      </LoadingOverlay>
    );
  }

  if (error && !result) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load audit data. Please try again later.
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Technical GEO Audit</h1>
        <p className="text-muted-foreground">Analyze your website&apos;s technical readiness for AI search engine indexing.</p>
      </div>

      {/* Scanner Input */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <label className="block text-sm font-medium text-foreground mb-2">Website URL</label>
        <div className="flex gap-4">
            <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
            <button 
                onClick={handleScan}
                disabled={isScanning}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-70"
            >
                {isScanning ? 'Scanning...' : 'Run Audit'}
            </button>
        </div>
        {isScanning && (
            <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full animate-scan-progress"></div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Score Card */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">AI Readiness Score</h3>
            <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                        className="text-muted"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <path
                        className="text-emerald-600"
                        strokeDasharray={`${result.overallScore}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                </svg>
                <div className="absolute text-4xl font-bold text-emerald-900">{result.overallScore}</div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Good, but needs improvement</p>
        </div>

        {/* Radar Chart */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-2">Metric Breakdown</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={result.metrics}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" tick={{ fill: '#475569', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Site" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                        <Tooltip />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues List */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Critical Issues</h3>
            <div className="space-y-4">
                {result.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                        <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-red-800">{issue}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Recommendations */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recommendations</h3>
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Cpu size={18} /></div>
                    <div>
                        <p className="text-sm font-medium text-foreground">Implement Schema.org</p>
                        <p className="text-xs text-muted-foreground">Add &apos;MedicalEntity&apos; and &apos;Physician&apos; schemas to help AI understand your services.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><FileText size={18} /></div>
                    <div>
                        <p className="text-sm font-medium text-foreground">Create llms.txt</p>
                        <p className="text-xs text-muted-foreground">Add a file at root to explicitly guide AI scrapers on what to read.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

