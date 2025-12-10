'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import { LoadingOverlay } from '@kit/ui/loading-overlay';

import { useVisibilityMonitor, useRunScan, type KeywordScanResult } from './hooks/use-visibility-monitor';

export function VisibilityMonitor() {
  const [isDragging, setIsDragging] = useState(false);
  const { data, isLoading, error } = useVisibilityMonitor();
  const runScanMutation = useRunScan();

  const results = data?.results || [];
  const isProcessing = runScanMutation.isPending;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleRunScan();
  };

  const handleRunScan = () => {
    runScanMutation.mutate(undefined);
  };

  if (isLoading) {
    return (
      <LoadingOverlay>
        <span className="text-muted-foreground">Loading visibility data...</span>
      </LoadingOverlay>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load visibility data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visibility Monitor</h1>
          <p className="text-slate-500">Track your brand's presence across AI models.</p>
        </div>
        <button 
          onClick={handleRunScan}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isProcessing ? <Loader className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          Run New Scan
        </button>
      </div>

      {/* Upload Area */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer bg-white
          ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400'}
        `}
      >
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UploadCloud size={24} />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Upload Keywords CSV</h3>
        <p className="text-slate-500 mt-1 max-w-md mx-auto">
          Drag and drop your list of medical services or keywords here. We support .csv and .xlsx files up to 5MB.
        </p>
        <p className="text-xs text-slate-400 mt-4">or click to browse files</p>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Recent Scans</h3>
          <div className="flex gap-2">
             <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-green-100 text-green-800">ChatGPT</span>
             <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-cyan-100 text-cyan-800">Perplexity</span>
             <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-teal-100 text-teal-800">Gemini</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Keyword / Prompt</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">AIV Score</th>
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Top Competitor</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.keyword}</td>
                  <td className="px-6 py-4">
                    <span className={`
                        px-2 py-1 rounded text-xs font-semibold
                        ${row.aiResponseSource === 'ChatGPT' ? 'bg-green-100 text-green-700' : ''}
                        ${row.aiResponseSource === 'Perplexity' ? 'bg-cyan-100 text-cyan-700' : ''}
                        ${row.aiResponseSource === 'Gemini' ? 'bg-teal-100 text-teal-700' : ''}
                    `}>
                        {row.aiResponseSource}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {row.status === 'VISIBLE' && <CheckCircle size={16} className="text-green-500" />}
                      {row.status === 'PARTIAL' && <AlertCircle size={16} className="text-yellow-500" />}
                      {row.status === 'NOT_VISIBLE' && <AlertCircle size={16} className="text-red-500" />}
                      <span className={`
                        ${row.status === 'VISIBLE' ? 'text-green-600' : ''}
                        ${row.status === 'PARTIAL' ? 'text-yellow-600' : ''}
                        ${row.status === 'NOT_VISIBLE' ? 'text-red-600' : ''}
                      `}>{row.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[80px]">
                      <div 
                        className={`h-2.5 rounded-full ${row.aivScore > 70 ? 'bg-green-500' : row.aivScore > 40 ? 'bg-yellow-400' : 'bg-red-500'}`} 
                        style={{ width: `${row.aivScore}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-1 inline-block">{row.aivScore}/100</span>
                  </td>
                  <td className="px-6 py-4">{row.rank > 0 ? `#${row.rank}` : '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{row.topCompetitor}</td>
                  <td className="px-6 py-4 text-slate-400">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

