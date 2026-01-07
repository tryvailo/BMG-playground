'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@kit/ui/select';

// Horizon UI Design Tokens
const HORIZON = {
    primary: '#4318FF',
    primaryLight: '#4318FF15',
    secondary: '#A3AED0',
    background: '#F4F7FE',
    textPrimary: '#1B2559',
    textSecondary: '#A3AED0',
};

interface StepRegionProps {
    onContinue: (region: string, language: string) => void;
}

export function StepRegion({ onContinue }: StepRegionProps) {
    const [region, setRegion] = React.useState('UA');
    const [language, setLanguage] = React.useState('en');

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold mb-6 leading-tight" style={{ color: HORIZON.textPrimary }}>
                Which region do you want to run your prompts in?
            </h1>

            <p className="text-lg mb-10 leading-relaxed font-medium" style={{ color: HORIZON.textSecondary }}>
                Choose the primary region that your audience is located, so that
                you get the most relevant results for your brand.
            </p>

            <div className="space-y-8 mb-12">
                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>Region</label>
                    <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger
                            className="h-14 rounded-xl font-semibold px-4 border-2 transition-all"
                            style={{
                                backgroundColor: HORIZON.background,
                                borderColor: region ? HORIZON.primary + '30' : 'transparent',
                                color: HORIZON.textPrimary
                            }}
                        >
                            <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                            <SelectItem value="US" className="font-medium">🇺🇸 United States</SelectItem>
                            <SelectItem value="UK" className="font-medium">🇬🇧 United Kingdom</SelectItem>
                            <SelectItem value="UA" className="font-medium">🇺🇦 Ukraine</SelectItem>
                            <SelectItem value="DE" className="font-medium">🇩🇪 Germany</SelectItem>
                            <SelectItem value="FR" className="font-medium">🇫🇷 France</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger
                            className="h-14 rounded-xl font-semibold px-4 border-2 transition-all"
                            style={{
                                backgroundColor: HORIZON.background,
                                borderColor: language ? HORIZON.primary + '30' : 'transparent',
                                color: HORIZON.textPrimary
                            }}
                        >
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                            <SelectItem value="en" className="font-medium">English (en)</SelectItem>
                            <SelectItem value="uk" className="font-medium">Ukrainian (uk)</SelectItem>
                            <SelectItem value="de" className="font-medium">German (de)</SelectItem>
                            <SelectItem value="fr" className="font-medium">French (fr)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button
                onClick={() => onContinue(region, language)}
                className="w-full lg:w-fit px-12 py-6 text-lg text-white rounded-xl transition-all hover:-translate-y-0.5 font-semibold"
                style={{
                    backgroundColor: HORIZON.primary,
                    boxShadow: `0 15px 30px ${HORIZON.primary}30`
                }}
            >
                Continue
            </Button>
        </div>
    );
}

// Deterministic pseudo-random function for consistent rendering
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Pre-calculate dots positions to avoid hydration mismatch
function generateDots() {
    return Array.from({ length: 120 }).map((_, i) => {
        const angle = (i / 120) * Math.PI * 2;
        const r = 10 + seededRandom(i * 7.3) * 38;
        const x = 50 + Math.cos(angle) * r;
        const y = 50 + Math.sin(angle) * r;
        return { x, y, key: i };
    });
}

export function VisualRegion() {
    const [dots, setDots] = useState<Array<{ x: number; y: number; key: number }>>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Generate dots only on client to avoid hydration mismatch
        setIsMounted(true);
        setDots(generateDots());
    }, []);

    return (
        <div className="flex items-center justify-center animate-in zoom-in-95 duration-1000">
            <div className="relative w-[480px] h-[480px] opacity-40">
                <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: HORIZON.secondary }}>
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
                    <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
                    <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />

                    {/* Mock Globe Dots - rendered only on client to avoid hydration mismatch */}
                    {isMounted && dots.map((dot) => (
                        <circle key={dot.key} cx={dot.x} cy={dot.y} r="0.4" fill="currentColor" />
                    ))}
                </svg>

                {/* Glow Effect with Horizon primary */}
                <div
                    className="absolute inset-0 rounded-full blur-3xl -z-10"
                    style={{ background: `linear-gradient(to top right, ${HORIZON.primary}15, transparent)` }}
                />
            </div>
        </div>
    );
}
