'use client';

import React from 'react';
import { Button } from '@kit/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@kit/ui/select';

interface StepRegionProps {
    onContinue: (region: string, language: string) => void;
}

export function StepRegion({ onContinue }: StepRegionProps) {
    const [region, setRegion] = React.useState('US');
    const [language, setLanguage] = React.useState('en');

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                Which region do you want to run your prompts in?
            </h1>

            <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">
                Choose the primary region that your audience is located, so that
                you get the most relevant results for your brand.
            </p>

            <div className="space-y-8 mb-12">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Region</label>
                    <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-xl text-slate-900 font-semibold px-4">
                            <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                            <SelectItem value="US" className="font-medium">🇺🇸 United States</SelectItem>
                            <SelectItem value="UK" className="font-medium">🇬🇧 United Kingdom</SelectItem>
                            <SelectItem value="UA" className="font-medium">🇺🇦 Ukraine</SelectItem>
                            <SelectItem value="DE" className="font-medium">🇩🇪 Germany</SelectItem>
                            <SelectItem value="FR" className="font-medium">🇫🇷 France</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-xl text-slate-900 font-semibold px-4">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
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
                className="w-full lg:w-fit px-12 py-6 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-100 hover:shadow-teal-200 rounded-xl transition-all"
            >
                Continue
            </Button>
        </div>
    );
}

export function VisualRegion() {
    return (
        <div className="flex items-center justify-center animate-in zoom-in-95 duration-1000">
            <div className="relative w-[480px] h-[480px] opacity-40">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-400">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
                    <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
                    <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />

                    {/* Mock Globe Dots */}
                    {Array.from({ length: 120 }).map((_, i) => {
                        const angle = (i / 120) * Math.PI * 2;
                        const r = 10 + Math.random() * 38;
                        const x = 50 + Math.cos(angle) * r;
                        const y = 50 + Math.sin(angle) * r;
                        return <circle key={i} cx={x} cy={y} r="0.4" fill="currentColor" />;
                    })}
                </svg>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full blur-3xl -z-10" />
            </div>
        </div>
    );
}
