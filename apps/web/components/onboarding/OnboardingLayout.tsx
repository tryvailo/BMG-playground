'use client';

import React from 'react';
import { useRouter } from '~/lib/navigation';
import { ChevronLeft } from 'lucide-react';
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
    shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
};

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
        <div className="flex flex-col lg:flex-row min-h-screen" style={{ backgroundColor: HORIZON.background }}>
            {/* Left side: Content */}
            <div className="flex-1 flex flex-col p-6 lg:p-12 xl:p-20 relative">
                {/* Header */}
                <header className="flex items-center gap-4 mb-20 lg:mb-32">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: HORIZON.primaryLight }}
                        >
                            <div className="w-5 h-5" style={{ color: HORIZON.primary }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                        </div>
                        <span className="font-bold text-lg" style={{ color: HORIZON.textPrimary }}>{clinicName}</span>
                        <span style={{ color: HORIZON.secondary }}>|</span>
                        <span className="font-medium" style={{ color: HORIZON.textSecondary }}>{domain}</span>
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
                                className="flex items-center gap-1.5 transition-colors group hover:opacity-80"
                                style={{ color: HORIZON.textSecondary }}
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
                                    "h-2 rounded-full transition-all duration-300",
                                    i === step
                                        ? "w-8"
                                        : i < step
                                            ? "w-2"
                                            : "w-2"
                                )}
                                style={{
                                    backgroundColor: i === step
                                        ? HORIZON.primary
                                        : i < step
                                            ? HORIZON.success
                                            : HORIZON.secondary + '40'
                                }}
                            />
                        ))}
                    </div>
                </footer>
            </div>

            {/* Right side: Visual */}
            <div
                className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
                style={{ backgroundColor: 'white' }}
            >
                {/* Gradient background */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background: `radial-gradient(circle at 30% 50%, ${HORIZON.primary}20 0%, transparent 50%),
                                     radial-gradient(circle at 70% 30%, ${HORIZON.success}15 0%, transparent 40%)`
                    }}
                />

                {/* Dotted background pattern */}
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: `radial-gradient(circle, ${HORIZON.textPrimary} 1px, transparent 1px)`,
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
