'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Check, Play } from 'lucide-react';
import { cn } from '@kit/ui/utils';

interface StepPricingProps {
    onPlanSelect: (planId: string, interval: 'month' | 'year') => void;
}

export function StepPricing({ onPlanSelect }: StepPricingProps) {
    const [interval, setInterval] = useState<'month' | 'year'>('month');

    const plans = [
        {
            id: 'starter',
            name: 'Starter',
            price: { month: 99, year: 79 },
            description: 'For small companies who want to monitor their brand&apos;s visibility.',
            features: [
                '50 unique prompts',
                '1 answer engine — ChatGPT',
                '1 seat'
            ],
            popular: false
        },
        {
            id: 'growth',
            name: 'Growth',
            price: { month: 399, year: 319 },
            description: 'For growing companies who want to monitor visibility and create AEO optimized content',
            features: [
                '100 unique prompts',
                '3 answer engines — ChatGPT, Perplexity, Google AI Overviews',
                '3 seats',
                '6 optimized articles per month'
            ],
            popular: true
        }
    ];

    return (
        <div className="flex flex-col items-center w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h1 className="text-4xl font-bold text-slate-900 mb-8 text-center">Subscription Pricing</h1>

            {/* Interval Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-12">
                <button
                    onClick={() => setInterval('month')}
                    className={cn(
                        "px-8 py-2.5 rounded-lg text-sm font-bold transition-all",
                        interval === 'month' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setInterval('year')}
                    className={cn(
                        "px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                        interval === 'year' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Yearly
                    <span className="text-[10px] bg-teal-100 text-teal-600 border border-teal-200 px-1.5 py-0.5 rounded-md uppercase tracking-tight">2 months free</span>
                </button>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative bg-white rounded-2xl p-8 border-2 transition-all group overflow-hidden flex flex-col h-full hover:-translate-y-2 duration-300",
                            plan.popular
                                ? "border-slate-900 shadow-2xl scale-[1.02] z-10"
                                : "border-slate-100 shadow-xl hover:border-slate-200"
                        )}
                    >
                        {plan.popular && (
                            <div className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest py-2 text-center absolute top-0 left-0 right-0">
                                Popular
                            </div>
                        )}

                        {plan.popular && (
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                    <circle cx="60" cy="60" r="60" fill="url(#grad1)" />
                                    <defs>
                                        <linearGradient id="grad1" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#0d9488" />
                                            <stop offset="1" stopColor="#10b981" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        )}

                        <div className={cn("flex flex-col h-full", plan.popular ? "pt-6" : "")}>
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                    {plan.id === 'starter' ? (
                                        <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center p-1">
                                            <svg viewBox="0 0 24 24" fill="white"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-4.7471-3.124 5.9847 5.9847 0 0 0-5.188-1.5547 6.0462 6.0462 0 0 0-4.667 3.243 5.9847 5.9847 0 0 0-.5157 4.9108 6.0462 6.0462 0 0 0-3.321 4.615 5.9847 5.9847 0 0 0 1.5547 5.188 6.0462 6.0462 0 0 0 3.243 4.667 5.9847 5.9847 0 0 0 4.9108.5157 6.0462 6.0462 0 0 0 4.615 3.321 5.9847 5.9847 0 0 0 5.188-1.5547 6.0462 6.0462 0 0 0 4.667-3.243 5.9847 5.9847 0 0 0 .5157-4.9108 6.0462 6.0462 0 0 0 3.321-4.615 5.9847 5.9847 0 0 0-1.5547-5.188 6.0462 6.0462 0 0 0-3.243-4.667zm-2.127 8.018a4.479 4.479 0 0 1-2.427 2.404l-.147.06-.015.158a4.438 4.438 0 0 1-1.155 2.628 4.479 4.479 0 0 1-3.865 1.155l-.158-.023-.105.12a4.438 4.438 0 0 1-2.427 1.411 4.479 4.479 0 0 1-4.041-2.381l-.098-.165-.181.015a4.438 4.438 0 0 1-2.628-1.155 4.479 4.479 0 0 1-1.155-3.865l.023-.158-.12-.105a4.438 4.438 0 0 1-1.411-2.427 4.479 4.479 0 0 1 2.381-4.041l.165-.098-.015-.181a4.438 4.438 0 0 1 1.155-2.628 4.479 4.479 0 0 1 3.865-1.155l.158.023.105-.12a4.438 4.438 0 0 1 2.427-1.411 4.479 4.479 0 0 1 4.041 2.381l.098.165.181-.015a4.438 4.438 0 0 1 2.628 1.155 4.479 4.479 0 0 1 1.155 3.865l-.023.158.12.105a4.438 4.438 0 0 1 1.411 2.427 4.479 4.479 0 0 1-2.381 4.041l-.165.098.015.181zM11.4785 15.657l-3.321-3.321 1.1325-1.1325 2.1885 2.1885 4.908-4.908 1.1325 1.1325-6.0405 6.0405z" /></svg>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            <div className="w-5 h-5 rounded bg-zinc-900 flex items-center justify-center p-0.5">
                                                <svg viewBox="0 0 24 24" fill="white"><path d="M22.28 9.82a6 6 0 0 0-.52-4.91 6.05 6.05 0 0 0-4.75-3.12 6 6 0 0 0-5.19-1.55 6.05 6.05 0 0 0-4.67 3.24 6 6 0 0 0-.52 4.91 6.05 6.05 0 0 0-3.32 4.62 6 6 0 0 0 1.55 5.19 6.05 6.05 0 0 0 3.24 4.67 6 6 0 0 0 4.91.52 6.05 6.05 0 0 0 4.62 3.32 6 6 0 0 0 5.19-1.55 6.05 6.05 0 0 0 4.67-3.24 6 6 0 0 0 .52-4.91 6.05 6.05 0 0 0 3.32-4.62 6 6 0 0 0-1.55-5.19z" /></svg>
                                            </div>
                                            <div className="w-5 h-5 rounded bg-teal-500 flex items-center justify-center p-0.5">
                                                <svg viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
                                            </div>
                                            <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center p-0.5">
                                                <svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-bold text-slate-900">${plan.price[interval]}</span>
                                    <span className="text-slate-500 font-medium">/month</span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{plan.description}</p>
                            </div>

                            <Button
                                variant={plan.popular ? 'default' : 'outline'}
                                onClick={() => onPlanSelect(plan.id, interval)}
                                className={cn(
                                    "w-full py-6 rounded-xl font-bold transition-all mb-8 shadow-teal-100",
                                    plan.popular
                                        ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xl hover:shadow-teal-200"
                                        : "border-slate-200 hover:border-teal-600 hover:text-teal-600 hover:bg-transparent"
                                )}
                            >
                                Purchase Plan
                            </Button>

                            <div className="space-y-4 flex-1">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex gap-3">
                                        <Check size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm font-medium text-slate-600 leading-snug">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Product Tour Video Block */}
            <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-lg p-6 flex items-center justify-between group hover:shadow-xl transition-all">
                <div className="flex items-center gap-6">
                    <div className="relative w-24 h-16 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                        <Play size={20} className="text-slate-400" />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Product Tour</p>
                        <h4 className="text-lg font-bold text-slate-900 leading-tight">See How Profound Works</h4>
                    </div>
                </div>
                <Button variant="outline" className="rounded-xl font-bold gap-2 px-6 h-12 border-slate-200 hover:bg-slate-50">
                    <Play size={16} fill="currentColor" />
                    Watch Video
                </Button>
            </div>

            <div className="mt-8">
                <button className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                    Log Out
                </button>
            </div>
        </div>
    );
}
