'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Check, ChevronRight, Target, BarChart3, Lightbulb } from 'lucide-react';
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

// Preset topics for medical clinics
const PRESET_TOPICS = [
    { id: 'dentistry', label: 'Стоматологія', labelEn: 'Dentistry' },
    { id: 'implants', label: 'Імплантація', labelEn: 'Dental Implants' },
    { id: 'orthodontics', label: 'Ортодонтія', labelEn: 'Orthodontics' },
    { id: 'surgery', label: 'Хірургія', labelEn: 'Surgery' },
    { id: 'cosmetology', label: 'Косметологія', labelEn: 'Cosmetology' },
    { id: 'diagnostics', label: 'Діагностика', labelEn: 'Diagnostics' },
    { id: 'pediatrics', label: 'Педіатрія', labelEn: 'Pediatrics' },
    { id: 'therapy', label: 'Терапія', labelEn: 'Therapy' },
    { id: 'ophthalmology', label: 'Офтальмологія', labelEn: 'Ophthalmology' },
    { id: 'dermatology', label: 'Дерматологія', labelEn: 'Dermatology' },
];

interface StepTopicsProps {
    onContinue: (topics: string[]) => void;
    locale?: string;
}

export function StepTopics({ onContinue, locale = 'ukr' }: StepTopicsProps) {
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const isUkrainian = locale === 'ukr' || locale === 'uk';

    const toggleTopic = (topicId: string) => {
        setSelectedTopics(prev => 
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };

    const handleContinue = () => {
        // Convert topic IDs to labels for storage
        const topicLabels = selectedTopics.map(id => {
            const topic = PRESET_TOPICS.find(t => t.id === id);
            return topic ? (isUkrainian ? topic.label : topic.labelEn) : id;
        });
        onContinue(topicLabels);
    };

    const handleSkip = () => {
        onContinue([]);
    };

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: HORIZON.textPrimary }}>
                {isUkrainian ? 'Які послуги відстежувати?' : 'Which services to track?'}
            </h1>

            <p className="text-lg mb-8 font-medium" style={{ color: HORIZON.textSecondary }}>
                {isUkrainian 
                    ? 'Можна вибрати пізніше в дашборді' 
                    : 'You can choose later in the dashboard'}
            </p>

            {/* Topics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-10">
                {PRESET_TOPICS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                        <button
                            key={topic.id}
                            onClick={() => toggleTopic(topic.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all text-left hover:-translate-y-0.5",
                                isSelected ? "border-transparent" : "border-slate-200 hover:border-slate-300"
                            )}
                            style={{
                                backgroundColor: isSelected ? HORIZON.primaryLight : 'white',
                                borderColor: isSelected ? HORIZON.primary : undefined,
                            }}
                        >
                            <div 
                                className={cn(
                                    "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all",
                                    isSelected ? "" : "border-2 border-slate-300"
                                )}
                                style={{
                                    backgroundColor: isSelected ? HORIZON.primary : 'transparent',
                                }}
                            >
                                {isSelected && <Check size={14} className="text-white" />}
                            </div>
                            <span 
                                className="font-semibold text-sm"
                                style={{ color: HORIZON.textPrimary }}
                            >
                                {isUkrainian ? topic.label : topic.labelEn}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="px-8 py-6 text-lg rounded-xl font-semibold border-2 hover:-translate-y-0.5 transition-all"
                    style={{
                        borderColor: HORIZON.secondary + '60',
                        color: HORIZON.textSecondary,
                    }}
                >
                    {isUkrainian ? 'Пропустити' : 'Skip'}
                </Button>
                
                <Button
                    onClick={handleContinue}
                    className={cn(
                        "flex-1 px-12 py-6 text-lg rounded-xl transition-all font-semibold flex items-center justify-center gap-2",
                        selectedTopics.length > 0
                            ? "text-white hover:-translate-y-0.5"
                            : "text-white hover:-translate-y-0.5"
                    )}
                    style={{
                        backgroundColor: HORIZON.primary,
                        boxShadow: `0 15px 30px ${HORIZON.primary}30`
                    }}
                >
                    {isUkrainian ? 'Продовжити' : 'Continue'}
                    <ChevronRight size={20} />
                </Button>
            </div>

            {/* Selected count hint */}
            {selectedTopics.length > 0 && (
                <p className="mt-4 text-sm font-medium animate-in fade-in duration-300" style={{ color: HORIZON.success }}>
                    {isUkrainian 
                        ? `Вибрано: ${selectedTopics.length}` 
                        : `Selected: ${selectedTopics.length}`}
                </p>
            )}
        </div>
    );
}

export function VisualTopics() {
    const [activeIndex, setActiveIndex] = useState(0);
    
    // Animate through features
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: Target,
            title: 'Моніторинг',
            value: '24/7',
            color: HORIZON.primary,
        },
        {
            icon: BarChart3,
            title: 'Конкуренти',
            value: '10+',
            color: HORIZON.success,
        },
        {
            icon: Lightbulb,
            title: 'Рекомендації',
            value: '5+',
            color: '#FFB547',
        },
    ];

    return (
        <div
            className="rounded-[20px] overflow-hidden animate-in zoom-in-95 duration-700"
            style={{
                backgroundColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(67, 24, 255, 0.15)'
            }}
        >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${HORIZON.background}` }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: HORIZON.textSecondary }}>
                    Що ви отримаєте
                </span>
                <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                        <div 
                            key={i}
                            className="w-2 h-2 rounded-full transition-all duration-300"
                            style={{ 
                                backgroundColor: i === activeIndex ? HORIZON.primary : HORIZON.background,
                                transform: i === activeIndex ? 'scale(1.2)' : 'scale(1)'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Features Grid */}
            <div className="p-6 space-y-4">
                {features.map((feature, i) => {
                    const Icon = feature.icon;
                    const isActive = i === activeIndex;
                    
                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl transition-all duration-500",
                                isActive && "scale-[1.02]"
                            )}
                            style={{
                                backgroundColor: isActive ? `${feature.color}10` : HORIZON.background,
                                border: isActive ? `2px solid ${feature.color}30` : '2px solid transparent',
                            }}
                        >
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                                style={{ 
                                    backgroundColor: isActive ? feature.color : `${feature.color}20`,
                                }}
                            >
                                <Icon 
                                    size={24} 
                                    style={{ color: isActive ? 'white' : feature.color }}
                                    className="transition-all duration-300"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span 
                                        className="text-sm font-bold"
                                        style={{ color: HORIZON.textPrimary }}
                                    >
                                        {feature.title}
                                    </span>
                                    <span 
                                        className="text-lg font-black"
                                        style={{ color: feature.color }}
                                    >
                                        {feature.value}
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: `${feature.color}20` }}>
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ 
                                            width: isActive ? '100%' : '30%',
                                            backgroundColor: feature.color,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer hint */}
            <div 
                className="px-6 py-4 text-center"
                style={{ borderTop: `1px solid ${HORIZON.background}` }}
            >
                <p className="text-xs font-medium" style={{ color: HORIZON.textSecondary }}>
                    Оберіть послуги для персоналізованого моніторингу
                </p>
            </div>
        </div>
    );
}
