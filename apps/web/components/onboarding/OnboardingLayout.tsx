'use client';

import React from 'react';
import { useRouter } from '~/lib/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@kit/ui/utils';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    visual?: React.ReactNode;
    step: number;
    totalSteps: number;
    onBack?: () => void;
    showBack?: boolean;
    domain?: string;
    clinicName?: string;
}

export function OnboardingLayout({
    children,
    visual,
    step,
    totalSteps,
    onBack,
    showBack = true,
    domain = 'yourclinic.com',
    clinicName = 'My Clinic',
}: OnboardingLayoutProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8FAFC]">
            {/* Left side: Content */}
            <div className="flex-1 flex flex-col p-6 lg:p-12 xl:p-20 relative">
                {/* Header */}
                <header className="flex items-center gap-4 mb-20 lg:mb-32">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center border border-teal-100 shadow-sm">
                            <div className="w-5 h-5 text-teal-600">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                        </div>
                        <span className="font-bold text-slate-900 text-lg">{clinicName}</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-slate-500 font-medium">{domain}</span>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col max-w-xl">
                    {children}
                </main>

                {/* Footer */}
                <footer className="mt-12 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {showBack && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors group"
                            >
                                <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                                <span className="text-sm font-medium">Back</span>
                            </button>
                        )}
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    i === step
                                        ? "w-6 bg-slate-900"
                                        : "w-1.5 bg-slate-200"
                                )}
                            />
                        ))}
                    </div>
                </footer>
            </div>

            {/* Right side: Visual */}
            <div className="hidden lg:flex flex-1 bg-slate-50 relative overflow-hidden items-center justify-center">
                {/* Dotted background pattern */}
                <div
                    className="absolute inset-0 opacity-[0.2]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* Visual Content Container */}
                <div className="relative z-10 w-full max-w-2xl px-12">
                    {visual}
                </div>
            </div>
        </div>
    );
}
