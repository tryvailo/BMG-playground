'use client';

import React from 'react';
import { Button } from '@kit/ui/button';
import { ChevronRight } from 'lucide-react';
import { cn } from '@kit/ui/utils';

// Horizon UI Design Tokens
const HORIZON = {
    primary: '#4318FF',
    primaryLight: '#4318FF15',
    secondary: '#A3AED0',
    success: '#01B574',
    warning: '#FFB547',
    background: '#F4F7FE',
    textPrimary: '#1B2559',
    textSecondary: '#A3AED0',
    shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
};

interface Competitor {
    name: string;
    url: string;
}

interface StepBenchmarkProps {
    onContinue: () => void;
    clinicName?: string;
    competitors?: Competitor[];
    totalClinicsInCity?: number;
}

// Deterministic position generator based on clinic name and total clinics count
export function getClinicPosition(clinicName: string, totalClinics: number): number {
    // Ensure minimum of 5 clinics for reasonable display
    const total = Math.max(totalClinics, 5);
    
    // Generate a hash for deterministic but varied results
    let hash = 0;
    for (let i = 0; i < clinicName.length; i++) {
        const char = clinicName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // Position should be in the lower half (worse positions) to show room for improvement
    // Range: from middle to last position
    const minPosition = Math.ceil(total / 2);
    const maxPosition = total;
    const range = Math.max(1, maxPosition - minPosition + 1);
    
    // Calculate position within range using hash
    const position = minPosition + (Math.abs(hash) % range);
    return Math.max(2, Math.min(position, total));
}

// Calculate AI visibility score (0-100)
export function getVisibilityScore(clinicName: string): number {
    let hash = 0;
    for (let i = 0; i < clinicName.length; i++) {
        hash = ((hash << 5) - hash) + clinicName.charCodeAt(i);
    }
    return 15 + (Math.abs(hash) % 20); // Score 15-34%
}

export function StepBenchmark({ onContinue, clinicName = 'My Clinic', competitors = [], totalClinicsInCity = 0 }: StepBenchmarkProps) {
    // Use total clinics in city if available, otherwise fall back to competitors count + 1, minimum 5
    const totalClinics = Math.max(totalClinicsInCity > 0 ? totalClinicsInCity : competitors.length + 1, 5);
    const position = React.useMemo(() => getClinicPosition(clinicName, totalClinics), [clinicName, totalClinics]);
    const visibilityScore = React.useMemo(() => getVisibilityScore(clinicName), [clinicName]);

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: HORIZON.textPrimary }}>
                Результати аналізу
            </h1>

            <p className="text-lg mb-8 font-medium" style={{ color: HORIZON.textSecondary }}>
                Ось як <span className="font-bold" style={{ color: HORIZON.primary }}>{clinicName}</span> виглядає в AI-пошуку порівняно з конкурентами.
            </p>

            {/* Main Metrics - Clean and Simple */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {/* Position */}
                <div
                    className="rounded-2xl p-6 text-center"
                    style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
                >
                    <div className="text-4xl font-black mb-2" style={{ color: HORIZON.warning }}>
                        #{position}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: HORIZON.textSecondary }}>
                        Місце серед {totalClinics} клінік
                    </div>
                </div>

                {/* Visibility Score */}
                <div
                    className="rounded-2xl p-6 text-center"
                    style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
                >
                    <div className="text-4xl font-black mb-2" style={{ color: HORIZON.warning }}>
                        {visibilityScore}%
                    </div>
                    <div className="text-sm font-semibold" style={{ color: HORIZON.textSecondary }}>
                        AI видимість
                    </div>
                </div>

                {/* Potential */}
                <div
                    className="rounded-2xl p-6 text-center"
                    style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
                >
                    <div className="text-4xl font-black mb-2" style={{ color: HORIZON.success }}>
                        +{85 - visibilityScore}%
                    </div>
                    <div className="text-sm font-semibold" style={{ color: HORIZON.textSecondary }}>
                        Потенціал росту
                    </div>
                </div>
            </div>

            {/* Simple explanation */}
            <p className="text-sm mb-8 leading-relaxed" style={{ color: HORIZON.textSecondary }}>
                Середня видимість топ-3 клінік у вашому регіоні — <strong style={{ color: HORIZON.textPrimary }}>85%</strong>. 
                Ми покажемо, як покращити вашу позицію.
            </p>

            <Button
                onClick={onContinue}
                className="w-full lg:w-fit px-12 py-6 text-lg text-white rounded-xl transition-all hover:-translate-y-0.5 font-semibold flex items-center gap-2"
                style={{
                    backgroundColor: HORIZON.primary,
                    boxShadow: `0 15px 30px ${HORIZON.primary}30`
                }}
            >
                Продовжити
                <ChevronRight size={20} />
            </Button>
        </div>
    );
}

interface VisualBenchmarkProps {
    clinicName?: string;
    competitors?: Competitor[];
    totalClinicsInCity?: number;
}

export function VisualBenchmark({ clinicName = 'My Clinic', competitors: propCompetitors = [], totalClinicsInCity = 0 }: VisualBenchmarkProps) {
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    // Use total clinics in city if available, otherwise fall back to competitors count + 1, minimum 5
    const totalClinics = Math.max(totalClinicsInCity > 0 ? totalClinicsInCity : propCompetitors.length + 1, 5);
    const clinicPosition = React.useMemo(() => getClinicPosition(clinicName, totalClinics), [clinicName, totalClinics]);
    const visibilityScore = React.useMemo(() => getVisibilityScore(clinicName), [clinicName]);

    // Score for competitors (higher ranks = higher scores)
    const getScoreForRank = (rank: number) => 90 - (rank - 1) * 8;

    // Build ranking list
    const rankings = React.useMemo(() => {
        const list: { rank: number; name: string; score: number; isCurrent: boolean }[] = [];
        
        // Add top competitors
        if (propCompetitors.length > 0) {
            propCompetitors.slice(0, 3).forEach((comp, i) => {
                list.push({ rank: i + 1, name: comp.name, score: getScoreForRank(i + 1), isCurrent: false });
            });
        } else {
            list.push({ rank: 1, name: 'Лідер ринку', score: 90, isCurrent: false });
            list.push({ rank: 2, name: 'Топ-2 клініка', score: 82, isCurrent: false });
            list.push({ rank: 3, name: 'Топ-3 клініка', score: 74, isCurrent: false });
        }
        
        // Add current clinic
        list.push({ rank: clinicPosition, name: clinicName, score: visibilityScore, isCurrent: true });
        
        return list;
    }, [propCompetitors, clinicName, clinicPosition, visibilityScore]);

    return (
        <div
            className="rounded-2xl overflow-hidden animate-in zoom-in-95 duration-700"
            style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
        >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${HORIZON.background}` }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: HORIZON.textSecondary }}>
                    AI Видимість
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: HORIZON.background, color: HORIZON.textPrimary }}>
                    Рейтинг
                </span>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className="p-8 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 animate-spin mb-4" 
                        style={{ borderColor: HORIZON.background, borderTopColor: HORIZON.primary }} 
                    />
                    <p className="text-sm font-medium" style={{ color: HORIZON.textSecondary }}>
                        Аналізуємо конкурентів...
                    </p>
                </div>
            ) : (
                <div className="p-4">
                    {rankings.map((item, i) => (
                        <div
                            key={item.rank}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl mb-2 last:mb-0 transition-all",
                                "animate-in fade-in slide-in-from-left-4",
                                item.isCurrent && "ring-2"
                            )}
                            style={{
                                animationDelay: `${i * 100}ms`,
                                backgroundColor: item.isCurrent ? HORIZON.primaryLight : HORIZON.background,
                                ...(item.isCurrent && { ringColor: HORIZON.primary })
                            }}
                        >
                            {/* Rank */}
                            <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                style={{ 
                                    backgroundColor: item.isCurrent ? HORIZON.primary : 'white',
                                    color: item.isCurrent ? 'white' : HORIZON.textPrimary
                                }}
                            >
                                {item.rank}
                            </div>

                            {/* Name and progress */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span 
                                        className={cn("text-sm truncate", item.isCurrent ? "font-bold" : "font-medium")}
                                        style={{ color: item.isCurrent ? HORIZON.primary : HORIZON.textPrimary }}
                                    >
                                        {item.name}
                                    </span>
                                    <span className="text-sm font-bold ml-2" style={{ color: HORIZON.textPrimary }}>
                                        {item.score}%
                                    </span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'white' }}>
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ 
                                            width: `${item.score}%`,
                                            backgroundColor: item.isCurrent ? HORIZON.warning : HORIZON.success
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
