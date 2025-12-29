'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Search, Globe, ChevronRight } from 'lucide-react';
import { cn } from '@kit/ui/utils';

// Horizon UI Design Tokens
const HORIZON = {
    primary: '#4318FF',
    primaryLight: '#4318FF15',
    secondary: '#A3AED0',
    success: '#01B574',
    background: '#F4F7FE',
    textPrimary: '#1B2559',
    textSecondary: '#A3AED0',
};

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
            <h1 className="text-4xl font-bold mb-6 leading-tight" style={{ color: HORIZON.textPrimary }}>
                Let&apos;s start by analyzing your clinic&apos;s visibility
            </h1>

            <p className="text-lg mb-10 leading-relaxed font-medium" style={{ color: HORIZON.textSecondary }}>
                Enter your website domain to see how you&apos;re currently performing in AI search engines.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8 mb-12">
                <div className="relative group">
                    <div
                        className="absolute left-0 top-3 transition-colors group-focus-within:opacity-100 opacity-60"
                        style={{ color: HORIZON.primary }}
                    >
                        <Globe size={24} />
                    </div>
                    <Input
                        value={domain}
                        onChange={(e) => setDomain(e.target.value.toLowerCase())}
                        placeholder="yourclinic.com"
                        className="h-14 bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 text-2xl pl-10 pr-0 pb-4 transition-all placeholder:opacity-30"
                        style={{
                            borderColor: domain ? HORIZON.primary : HORIZON.secondary + '40',
                            color: HORIZON.textPrimary
                        }}
                        autoFocus
                    />
                </div>

                <Button
                    disabled={!domain.trim()}
                    type="submit"
                    className={cn(
                        "w-full lg:w-fit px-12 py-6 text-lg rounded-xl transition-all flex items-center gap-3 font-semibold",
                        domain.trim()
                            ? "text-white shadow-xl animate-pulse-subtle hover:-translate-y-0.5"
                            : "cursor-not-allowed opacity-50"
                    )}
                    style={{
                        backgroundColor: domain.trim() ? HORIZON.primary : HORIZON.secondary,
                        boxShadow: domain.trim() ? `0 15px 30px ${HORIZON.primary}30` : 'none'
                    }}
                >
                    Analyze Visibility
                    <ChevronRight size={20} />
                </Button>
            </form>

            <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: HORIZON.textSecondary }}>
                    <Search size={14} />
                    Real-time Audit
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: HORIZON.textSecondary }}>
                    <Globe size={14} />
                    Global Coverage
                </div>
            </div>

            {/* Preserve animation keyframes */}
            <style jsx>{`
                @keyframes custom-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(67, 24, 255, 0); }
                    50% { transform: scale(1.02); box-shadow: 0 15px 35px -5px rgba(67, 24, 255, 0.25); }
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
        <div
            className="rounded-[20px] shadow-2xl p-8 animate-in zoom-in-95 duration-700 w-full max-w-lg mx-auto"
            style={{
                backgroundColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(67, 24, 255, 0.15)'
            }}
        >
            <div className="flex items-center gap-2 mb-8 border-b pb-4" style={{ borderColor: HORIZON.background }}>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HORIZON.secondary + '40' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HORIZON.secondary + '40' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HORIZON.secondary + '40' }} />
                </div>
                <div className="h-6 rounded-lg w-full max-w-[240px] ml-4 flex items-center px-3" style={{ backgroundColor: HORIZON.background }}>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: HORIZON.secondary + '30' }} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="h-4 rounded-lg w-3/4" style={{ backgroundColor: HORIZON.background }} />
                <div className="h-4 rounded-lg w-1/2" style={{ backgroundColor: HORIZON.background }} />
                <div className="h-32 rounded-xl w-full flex items-center justify-center" style={{ backgroundColor: HORIZON.background }}>
                    {/* Spinning loader - animation preserved */}
                    <div
                        className="w-12 h-12 rounded-full border-4 animate-spin"
                        style={{
                            borderColor: HORIZON.primaryLight,
                            borderTopColor: HORIZON.primary
                        }}
                    />
                </div>
                <div className="h-4 rounded-lg w-2/3" style={{ backgroundColor: HORIZON.background }} />
            </div>

            <div className="mt-8 pt-6 flex items-center justify-between" style={{ borderTop: `1px solid ${HORIZON.background}` }}>
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: HORIZON.background }} />
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: HORIZON.background }} />
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: HORIZON.background }} />
                </div>
                <div
                    className="w-20 h-8 rounded-lg"
                    style={{ backgroundColor: HORIZON.primaryLight, border: `1px solid ${HORIZON.primary}30` }}
                />
            </div>
        </div>
    );
}
