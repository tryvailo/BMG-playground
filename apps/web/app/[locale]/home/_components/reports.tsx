'use client';

import React, { useState } from 'react';
import { FileText, Download, Plus, Trash2, CheckCircle, XCircle, Loader, Calendar, Filter } from 'lucide-react';
import { LoadingOverlay } from '@kit/ui/loading-overlay';

import { useReports, useCreateReport, useDeleteReport } from './hooks/use-reports';

type ReportType = 'Weekly Summary' | 'Competitor Analysis' | 'Technical Audit' | 'Full Export';

export function Reports() {
  const { data, isLoading, error } = useReports();
  const createReportMutation = useCreateReport();
  const deleteReportMutation = useDeleteReport();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportType, setNewReportType] = useState<ReportType>('Weekly Summary');
  const [reportName, setReportName] = useState('');

  const reports = data?.reports || [];

  const handleDelete = (id: string) => {
    deleteReportMutation.mutate(id);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    createReportMutation.mutate({
      name: reportName || undefined,
      type: newReportType,
    });
    setIsModalOpen(false);
    setReportName('');
  };

  if (isLoading) {
    return (
      <LoadingOverlay>
        <span className="text-muted-foreground">Loading reports...</span>
      </LoadingOverlay>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load reports. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Exports</h1>
          <p className="text-muted-foreground">Download detailed insights and historical data.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Create New Report
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex gap-3 overflow-x-auto">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-md text-sm font-medium transition-colors">
          <Filter size={14} /> All Types
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 border border-border hover:bg-muted text-muted-foreground rounded-md text-sm font-medium transition-colors">
          <Calendar size={14} /> Last 30 Days
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs text-foreground uppercase bg-muted">
              <tr>
                <th className="px-6 py-3">Report Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Date Created</th>
                <th className="px-6 py-3">Size</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="bg-card border-b hover:bg-muted transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        report.type === 'Weekly Summary' ? 'bg-emerald-100 text-emerald-600' :
                        report.type === 'Competitor Analysis' ? 'bg-orange-100 text-orange-600' :
                        report.type === 'Technical Audit' ? 'bg-cyan-100 text-cyan-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <FileText size={18} />
                      </div>
                      <span className="font-medium text-foreground">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{report.type}</td>
                  <td className="px-6 py-4">{report.dateCreated}</td>
                  <td className="px-6 py-4">{report.size || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {report.status === 'Ready' && <CheckCircle size={16} className="text-green-500" />}
                      {report.status === 'Processing' && <Loader size={16} className="text-emerald-500 animate-spin" />}
                      {report.status === 'Failed' && <XCircle size={16} className="text-red-500" />}
                      <span className={`
                        ${report.status === 'Ready' ? 'text-green-600' : ''}
                        ${report.status === 'Processing' ? 'text-emerald-600' : ''}
                        ${report.status === 'Failed' ? 'text-red-600' : ''}
                      `}>{report.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        disabled={report.status !== 'Ready'}
                        className="p-2 text-muted-foreground hover:text-emerald-600 disabled:opacity-30 hover:bg-muted rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(report.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No reports found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-card rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Generate New Report</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Report Name (Optional)</label>
                <input 
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., November Audit"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Report Type</label>
                <select 
                  value={newReportType}
                  onChange={(e) => setNewReportType(e.target.value as ReportType)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Weekly Summary">Weekly Summary</option>
                  <option value="Competitor Analysis">Competitor Analysis</option>
                  <option value="Technical Audit">Technical Audit</option>
                  <option value="Full Export">Full Export (CSV)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Generate Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

