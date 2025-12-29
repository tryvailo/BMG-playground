'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Search, Globe, ChevronRight } from 'lucide-react';
import { cn } from '@kit/ui/utils';

interface StepDomainProps {
    onContinue: (domain: string) => void;
}

export function StepDomain({ onContinue }: StepDomainProps) {
    const [domain, setDomain] = useState('');

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (domain.trim()) {
            onContinue(domain.trim());
        }
    };

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                Let&apos;s start by analyzing your clinic&apos;s visibility
            </h1>

            <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">
                Enter your website domain to see how you&apos;re currently performing in AI search engines.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8 mb-12">
                <div className="relative group">
                    <div className="absolute left-0 top-3 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                        <Globe size={24} />
                    </div>
                    <Input
                        value={domain}
                        onChange={(e) => setDomain(e.target.value.toLowerCase())}
                        placeholder="yourclinic.com"
                        className="h-14 bg-transparent border-0 border-b-2 border-slate-100 rounded-none focus-visible:ring-0 focus-visible:border-teal-500 text-2xl pl-10 pr-0 pb-4 transition-all placeholder:text-slate-200"
                        autoFocus
                    />
                </div>

                <Button
                    disabled={!domain.trim()}
                    type="submit"
                    className={cn(
                        "w-full lg:w-fit px-12 py-6 text-lg rounded-xl transition-all flex items-center gap-3",
                        domain.trim()
                            ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-100 hover:shadow-teal-200 animate-pulse-subtle"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                >
                    Analyze Visibility
                    <ChevronRight size={20} />
                </Button>
            </form>

            <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Search size={14} />
                    Real-time Audit
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Globe size={14} />
                    Global Coverage
                </div>
            </div>
            <style jsx>{`
                @keyframes custom-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0); }
                    50% { transform: scale(1.02); box-shadow: 0 10px 25px -5px rgba(13, 148, 136, 0.2); }
                }
                .animate-pulse-subtle {
                    animation: custom-pulse 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}

export function VisualDomain() {
    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 animate-in zoom-in-95 duration-700 w-full max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-8 border-b border-slate-50 pb-4">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                </div>
                <div className="bg-slate-50 h-6 rounded-lg w-full max-w-[240px] ml-4 flex items-center px-3">
                    <div className="w-full h-2 bg-slate-200 rounded-full" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="h-4 bg-slate-50 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-50 rounded-lg w-1/2" />
                <div className="h-32 bg-slate-50 rounded-xl w-full flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
                </div>
                <div className="h-4 bg-slate-50 rounded-lg w-2/3" />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50" />
                    <div className="w-8 h-8 rounded-lg bg-slate-50" />
                    <div className="w-8 h-8 rounded-lg bg-slate-50" />
                </div>
                <div className="w-20 h-8 rounded-lg bg-teal-50 border border-teal-100" />
            </div>
        </div>
    );
}
