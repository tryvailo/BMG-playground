'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Plus, X, Check } from 'lucide-react';
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

interface StepTopicsProps {
    onContinue: (topics: string[]) => void;
}

export function StepTopics({ onContinue }: StepTopicsProps) {
    const [topics, setTopics] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');

    const addTopic = () => {
        if (inputValue.trim() && !topics.includes(inputValue.trim())) {
            setTopics([...topics, inputValue.trim()]);
            setInputValue('');
        }
    };

    const removeTopic = (index: number) => {
        setTopics(topics.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: HORIZON.textPrimary }}>
                Which topics do you want to create prompts for?
            </h1>

            <p className="text-lg mb-8 font-medium" style={{ color: HORIZON.textSecondary }}>
                Select up to 10 topics
            </p>

            <div className="space-y-6 mb-10">
                <div className="relative group">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                        placeholder="e.g. dental implants, laser surgery"
                        className="h-14 bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 text-xl px-0 pb-4 transition-all placeholder:opacity-30"
                        style={{
                            borderColor: inputValue ? HORIZON.primary : HORIZON.secondary + '40',
                            color: HORIZON.textPrimary
                        }}
                    />
                </div>

                <button
                    onClick={addTopic}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-sm font-semibold hover:-translate-y-0.5"
                    style={{
                        borderColor: HORIZON.primary + '40',
                        color: HORIZON.primary
                    }}
                >
                    <Plus size={16} />
                    Add custom
                </button>

                {/* Selected Topics List */}
                <div className="flex flex-wrap gap-2">
                    {topics.map((topic, i) => (
                        <div
                            key={i}
                            className="px-4 py-2 rounded-full flex items-center gap-2 group animate-in zoom-in-90 duration-300"
                            style={{
                                backgroundColor: HORIZON.primaryLight,
                                border: `1px solid ${HORIZON.primary}30`
                            }}
                        >
                            <span className="text-sm font-medium" style={{ color: HORIZON.textPrimary }}>{topic}</span>
                            <button
                                onClick={() => removeTopic(i)}
                                className="hover:opacity-60 transition-opacity"
                                style={{ color: HORIZON.secondary }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <Button
                disabled={topics.length === 0}
                onClick={() => onContinue(topics)}
                className={cn(
                    "w-full lg:w-fit px-12 py-6 text-lg rounded-xl transition-all font-semibold",
                    topics.length > 0
                        ? "text-white hover:-translate-y-0.5"
                        : "cursor-not-allowed opacity-50"
                )}
                style={{
                    backgroundColor: topics.length > 0 ? HORIZON.primary : HORIZON.secondary,
                    boxShadow: topics.length > 0 ? `0 15px 30px ${HORIZON.primary}30` : 'none'
                }}
            >
                Looks good
            </Button>
        </div>
    );
}

export function VisualTopics() {
    const tips = [
        {
            title: 'Each topic generates 5 prompts to track',
            description: "We'll start you off with 5 topics and 25 prompts total — you can always add more later."
        },
        {
            title: 'Try using keywords from traditional search tools',
            description: "Pick common words or phrases that represent key parts of your brand, or that you use for your SEO."
        },
        {
            title: 'Avoid long phrases',
            description: "Remember these are topics not prompts! Keep them short."
        }
    ];

    return (
        <div
            className="rounded-[20px] p-8 animate-in zoom-in-95 duration-700"
            style={{
                backgroundColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(67, 24, 255, 0.15)'
            }}
        >
            <h3 className="text-sm font-bold text-center mb-6" style={{ color: HORIZON.textPrimary }}>
                Topic Selection Tips
            </h3>
            <div className="space-y-6">
                {tips.map((tip, i) => (
                    <div key={i} className="flex gap-4 group">
                        <div
                            className="mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors group-hover:scale-110"
                            style={{ backgroundColor: HORIZON.primaryLight }}
                        >
                            <Check size={12} style={{ color: HORIZON.primary }} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold mb-1 leading-snug" style={{ color: HORIZON.textPrimary }}>{tip.title}</h4>
                            <p className="text-xs leading-relaxed font-medium" style={{ color: HORIZON.textSecondary }}>{tip.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
