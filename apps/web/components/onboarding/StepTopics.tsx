'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Plus, X, Check } from 'lucide-react';
import { cn } from '@kit/ui/utils';

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
            <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
                Which topics do you want to create prompts for?
            </h1>

            <p className="text-lg text-slate-500 mb-8 font-medium">
                Select up to 10 topics
            </p>

            <div className="space-y-6 mb-10">
                <div className="relative group">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                        placeholder="e.g. dental implants, laser surgery"
                        className="h-14 bg-transparent border-0 border-b-2 border-slate-100 rounded-none focus-visible:ring-0 focus-visible:border-teal-500 text-xl px-0 pb-4 transition-all"
                    />
                </div>

                <button
                    onClick={addTopic}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-all text-sm font-semibold"
                >
                    <Plus size={16} />
                    Add custom
                </button>

                {/* Selected Topics List */}
                <div className="flex flex-wrap gap-2">
                    {topics.map((topic, i) => (
                        <div
                            key={i}
                            className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 flex items-center gap-2 group animate-in zoom-in-90 duration-300"
                        >
                            <span className="text-sm font-medium text-slate-700">{topic}</span>
                            <button
                                onClick={() => removeTopic(i)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
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
                    "w-full lg:w-fit px-12 py-6 text-lg rounded-xl transition-all shadow-teal-100",
                    topics.length > 0
                        ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xl hover:shadow-teal-200"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
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
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 animate-in zoom-in-95 duration-700">
            <h3 className="text-sm font-bold text-slate-900 text-center mb-6">Topic Selection Tips</h3>
            <div className="space-y-6">
                {tips.map((tip, i) => (
                    <div key={i} className="flex gap-4 group">
                        <div className="mt-1 w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-50 transition-colors">
                            <Check size={12} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1 leading-snug">{tip.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{tip.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
