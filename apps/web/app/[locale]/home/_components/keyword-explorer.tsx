'use client';

import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { LoadingOverlay } from '@kit/ui/loading-overlay';

import { useKeywordExplorer, type KeywordOpportunity } from './hooks/use-keyword-explorer';

export function KeywordExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useKeywordExplorer(searchTerm);

  const opportunities = data?.opportunities || [];

  if (isLoading) {
    return (
      <LoadingOverlay>
        <span className="text-muted-foreground">Loading keyword data...</span>
      </LoadingOverlay>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load keyword data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Keyword Explorer</h1>
          <p className="text-slate-500">Discover high-impact prompts to target in AI responses.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-2">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Enter a medical topic (e.g., 'Endoscopy', 'Dental Implants')..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Analyze
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunity Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Volume vs. Difficulty</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Opportunity</span>
                </div>
            </div>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" dataKey="difficulty" name="Difficulty" unit="%" stroke="#64748b" label={{ value: 'Competition Difficulty', position: 'bottom', offset: 0 }} />
                        <YAxis type="number" dataKey="volume" name="Volume" unit=" idx" stroke="#64748b" label={{ value: 'Search Volume', angle: -90, position: 'insideLeft' }} />
                        <ZAxis range={[60, 400]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px' }} />
                        <Scatter name="Opportunities" data={opportunities} fill="#10b981" />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Suggestions Panel */}
        <div className="bg-gradient-to-br from-emerald-600 to-cyan-600 text-white p-6 rounded-xl shadow-lg flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-2">AI Insight</h3>
            <p className="text-emerald-100 mb-6">
                Users asking about "recovery time" often switch to "cost" in follow-up prompts. Target long-tail questions about post-op care to capture early intent.
            </p>
            <button className="bg-white text-emerald-900 py-2 px-4 rounded-lg font-semibold hover:bg-emerald-50 transition-colors">
                Generate Blog Outline
            </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Top Opportunities</h3>
        </div>
        <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                    <th className="px-6 py-3">Prompt Idea</th>
                    <th className="px-6 py-3">Volume</th>
                    <th className="px-6 py-3">Difficulty</th>
                    <th className="px-6 py-3">Impact</th>
                    <th className="px-6 py-3">Action</th>
                </tr>
            </thead>
            <tbody>
                {opportunities.map((item) => (
                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{item.prompt}</td>
                        <td className="px-6 py-4 flex items-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-1.5">
                                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${item.volume}%`}}></div>
                            </div>
                            {item.volume}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{item.difficulty}/100</td>
                        <td className="px-6 py-4">
                            <span className={`
                                px-2 py-1 rounded text-xs font-semibold
                                ${item.potentialImpact === 'High' ? 'bg-green-100 text-green-700' : ''}
                                ${item.potentialImpact === 'Medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                                ${item.potentialImpact === 'Low' ? 'bg-slate-100 text-slate-600' : ''}
                            `}>
                                {item.potentialImpact}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <button className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1">
                                <Plus size={16} /> Track
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

