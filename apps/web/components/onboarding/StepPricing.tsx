'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Check, Play } from 'lucide-react';
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

interface StepPricingProps {
    onPlanSelect: (planId: string, interval: 'month' | 'year') => void;
}

export function StepPricing({ onPlanSelect }: StepPricingProps) {
    const [interval, setInterval] = useState<'month' | 'year'>('month');
    const [selectedPlan, setSelectedPlan] = useState<'starter' | 'growth'>('starter');

    const plans = [
        {
            id: 'starter',
            name: 'Starter',
            price: { month: 99, year: 79 },
            description: 'For small companies who want to monitor their brand\'s visibility.',
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
            <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: HORIZON.textPrimary }}>
                Subscription Pricing
            </h1>

            {/* Interval Toggle */}
            <div className="flex items-center p-1 rounded-xl mb-12" style={{ backgroundColor: HORIZON.background }}>
                <button
                    onClick={() => setInterval('month')}
                    className={cn(
                        "px-8 py-2.5 rounded-lg text-sm font-bold transition-all",
                        interval === 'month' ? "bg-white shadow-sm" : "hover:opacity-80"
                    )}
                    style={{ color: interval === 'month' ? HORIZON.textPrimary : HORIZON.textSecondary }}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setInterval('year')}
                    className={cn(
                        "px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                        interval === 'year' ? "bg-white shadow-sm" : "hover:opacity-80"
                    )}
                    style={{ color: interval === 'year' ? HORIZON.textPrimary : HORIZON.textSecondary }}
                >
                    Yearly
                    <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-tight font-bold"
                        style={{ backgroundColor: HORIZON.primaryLight, color: HORIZON.primary, border: `1px solid ${HORIZON.primary}30` }}
                    >
                        2 months free
                    </span>
                </button>
            </div>

            {/* Pricing Cards - Both cards side by side with selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
                {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    return (
                        <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id as 'starter' | 'growth')}
                            className={cn(
                                "relative rounded-[20px] p-8 transition-all group overflow-hidden flex flex-col h-full cursor-pointer duration-300",
                                isSelected
                                    ? "z-10 scale-[1.02] -translate-y-2"
                                    : "hover:-translate-y-2"
                            )}
                            style={{
                                backgroundColor: 'white',
                                boxShadow: isSelected 
                                    ? `0 25px 50px ${HORIZON.primary}20` 
                                    : plan.popular 
                                        ? `0 18px 40px ${HORIZON.primary}15`
                                        : HORIZON.shadow,
                                border: isSelected 
                                    ? `2px solid ${HORIZON.primary}` 
                                    : plan.popular 
                                        ? `2px solid ${HORIZON.primary}40`
                                        : '2px solid transparent'
                            }}
                        >
                            {plan.popular && (
                                <div
                                    className="text-white text-[10px] font-bold uppercase tracking-widest py-2 text-center absolute top-0 left-0 right-0"
                                    style={{ backgroundColor: HORIZON.primary }}
                                >
                                    Popular
                                </div>
                            )}

                            {plan.popular && (
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                        <circle cx="60" cy="60" r="60" fill="url(#grad1)" />
                                        <defs>
                                            <linearGradient id="grad1" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                                                <stop stopColor={HORIZON.primary} />
                                                <stop offset="1" stopColor="#7551FF" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                            )}

                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: HORIZON.primary }}>
                                    <Check size={14} className="text-white" />
                                </div>
                            )}

                            <div className={cn("flex flex-col h-full", plan.popular ? "pt-6" : "")}>
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold" style={{ color: HORIZON.textPrimary }}>{plan.name}</h3>
                                        {plan.id === 'starter' ? (
                                            <div className="w-6 h-6 rounded-md flex items-center justify-center p-1" style={{ backgroundColor: HORIZON.textPrimary }}>
                                                <svg viewBox="0 0 24 24" fill="white"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-4.7471-3.124 5.9847 5.9847 0 0 0-5.188-1.5547 6.0462 6.0462 0 0 0-4.667 3.243 5.9847 5.9847 0 0 0-.5157 4.9108 6.0462 6.0462 0 0 0-3.321 4.615 5.9847 5.9847 0 0 0 1.5547 5.188 6.0462 6.0462 0 0 0 3.243 4.667 5.9847 5.9847 0 0 0 4.9108.5157 6.0462 6.0462 0 0 0 4.615 3.321 5.9847 5.9847 0 0 0 5.188-1.5547 6.0462 6.0462 0 0 0 4.667-3.243 5.9847 5.9847 0 0 0 .5157-4.9108 6.0462 6.0462 0 0 0 3.321-4.615 5.9847 5.9847 0 0 0-1.5547-5.188 6.0462 6.0462 0 0 0-3.243-4.667zm-2.127 8.018a4.479 4.479 0 0 1-2.427 2.404l-.147.06-.015.158a4.438 4.438 0 0 1-1.155 2.628 4.479 4.479 0 0 1-3.865 1.155l-.158-.023-.105.12a4.438 4.438 0 0 1-2.427 1.411 4.479 4.479 0 0 1-4.041-2.381l-.098-.165-.181.015a4.438 4.438 0 0 1-2.628-1.155 4.479 4.479 0 0 1-1.155-3.865l.023-.158-.12-.105a4.438 4.438 0 0 1-1.411-2.427 4.479 4.479 0 0 1 2.381-4.041l.165-.098-.015-.181a4.438 4.438 0 0 1 1.155-2.628 4.479 4.479 0 0 1 3.865-1.155l.158.023.105-.12a4.438 4.438 0 0 1 2.427-1.411 4.479 4.479 0 0 1 4.041 2.381l.098.165.181-.015a4.438 4.438 0 0 1 2.628 1.155 4.479 4.479 0 0 1 1.155 3.865l-.023.158.12.105a4.438 4.438 0 0 1 1.411 2.427 4.479 4.479 0 0 1-2.381 4.041l-.165.098.015.181zM11.4785 15.657l-3.321-3.321 1.1325-1.1325 2.1885 2.1885 4.908-4.908 1.1325 1.1325-6.0405 6.0405z" /></svg>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1">
                                                <div className="w-5 h-5 rounded flex items-center justify-center p-0.5" style={{ backgroundColor: HORIZON.textPrimary }}>
                                                    <svg viewBox="0 0 24 24" fill="white"><path d="M22.28 9.82a6 6 0 0 0-.52-4.91 6.05 6.05 0 0 0-4.75-3.12 6 6 0 0 0-5.19-1.55 6.05 6.05 0 0 0-4.67 3.24 6 6 0 0 0-.52 4.91 6.05 6.05 0 0 0-3.32 4.62 6 6 0 0 0 1.55 5.19 6.05 6.05 0 0 0 3.24 4.67 6 6 0 0 0 4.91.52 6.05 6.05 0 0 0 4.62 3.32 6 6 0 0 0 5.19-1.55 6.05 6.05 0 0 0 4.67-3.24 6 6 0 0 0 .52-4.91 6.05 6.05 0 0 0 3.32-4.62 6 6 0 0 0-1.55-5.19z" /></svg>
                                                </div>
                                                <div className="w-5 h-5 rounded flex items-center justify-center p-0.5" style={{ backgroundColor: HORIZON.primary }}>
                                                    <svg viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
                                                </div>
                                                <div className="w-5 h-5 rounded flex items-center justify-center p-0.5" style={{ backgroundColor: HORIZON.success }}>
                                                    <svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-4xl font-bold" style={{ color: HORIZON.textPrimary }}>${plan.price[interval]}</span>
                                        <span className="font-medium" style={{ color: HORIZON.textSecondary }}>/month</span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed" style={{ color: HORIZON.textSecondary }}>{plan.description}</p>
                                </div>

                                <Button
                                    variant={isSelected ? 'default' : 'outline'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPlanSelect(plan.id, interval);
                                    }}
                                    className={cn(
                                        "w-full py-6 rounded-xl font-bold transition-all mb-8 hover:-translate-y-0.5",
                                        isSelected
                                            ? "text-white"
                                            : ""
                                    )}
                                    style={{
                                        backgroundColor: isSelected ? HORIZON.primary : 'transparent',
                                        boxShadow: isSelected ? `0 15px 30px ${HORIZON.primary}30` : 'none',
                                        borderColor: isSelected ? 'transparent' : HORIZON.secondary,
                                        color: isSelected ? 'white' : HORIZON.textPrimary
                                    }}
                                >
                                    Purchase Plan
                                </Button>

                                <div className="space-y-4 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex gap-3">
                                            <Check size={18} style={{ color: HORIZON.success }} className="mt-0.5 flex-shrink-0" />
                                            <span className="text-sm font-medium leading-snug" style={{ color: HORIZON.textSecondary }}>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Product Tour Video Block */}
            <div
                className="w-full rounded-[20px] p-6 flex items-center justify-between group hover:shadow-xl transition-all"
                style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
            >
                <div className="flex items-center gap-6">
                    <div
                        className="relative w-24 h-16 rounded-lg overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: HORIZON.background }}
                    >
                        <Play size={20} style={{ color: HORIZON.textSecondary }} />
                        <div className="absolute inset-0 group-hover:bg-black/5 transition-all" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: HORIZON.textSecondary }}>Product Tour</p>
                        <h4 className="text-lg font-bold leading-tight" style={{ color: HORIZON.textPrimary }}>See How Profound Works</h4>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="rounded-xl font-bold gap-2 px-6 h-12 hover:bg-transparent"
                    style={{ borderColor: HORIZON.secondary, color: HORIZON.textPrimary }}
                >
                    <Play size={16} fill="currentColor" />
                    Watch Video
                </Button>
            </div>

            <div className="mt-8">
                <button
                    className="text-sm font-bold transition-colors uppercase tracking-widest hover:opacity-80"
                    style={{ color: HORIZON.textSecondary }}
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}
