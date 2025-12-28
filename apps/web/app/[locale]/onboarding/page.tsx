'use client';

import React, { useState, useMemo } from 'react';
import { OnboardingLayout } from '~/components/onboarding/OnboardingLayout';
import { StepDomain, VisualDomain } from '~/components/onboarding/StepDomain';
import { StepBenchmark, VisualBenchmark } from '~/components/onboarding/StepBenchmark';
import { StepTopics, VisualTopics } from '~/components/onboarding/StepTopics';
import { StepAnalysis, VisualAnalysis } from '~/components/onboarding/StepAnalysis';
import { StepRegion, VisualRegion } from '~/components/onboarding/StepRegion';
import { StepPricing } from '~/components/onboarding/StepPricing';
import { useRouter } from '~/lib/navigation';

type OnboardingStep = 'domain' | 'benchmark' | 'topics' | 'analysis' | 'region' | 'pricing';

/**
 * Extract clinic name from domain
 * Examples:
 * - "complimed.com" -> "Complimed"
 * - "my-clinic.com" -> "My Clinic"
 * - "dental-care.com" -> "Dental Care"
 */
function extractClinicName(domain: string): string {
    if (!domain) return 'My Clinic';
    
    // Remove protocol and www
    const cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .toLowerCase();
    
    // Extract the main domain part (before TLD)
    const parts = cleanDomain.split('.');
    const mainPart = parts[0] || cleanDomain;
    
    // Convert to readable name
    // Replace hyphens and underscores with spaces, then capitalize
    const name = mainPart
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    return name || 'My Clinic';
}

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('domain');
    const [onboardingData, setOnboardingData] = useState({
        domain: '',
        topics: [] as string[],
        region: 'US',
        language: 'en',
        planId: '',
        interval: 'month' as 'month' | 'year'
    });

    const router = useRouter();
    
    // Extract clinic name from domain
    const clinicName = useMemo(() => extractClinicName(onboardingData.domain), [onboardingData.domain]);

    const steps: OnboardingStep[] = ['domain', 'benchmark', 'topics', 'analysis', 'region', 'pricing'];
    const currentIndex = steps.indexOf(currentStep);

    const handleNext = () => {
        const nextStep = steps[currentIndex + 1];
        if (nextStep) {
            setCurrentStep(nextStep);
        }
    };

    const handleBack = () => {
        const prevStep = steps[currentIndex - 1];
        if (prevStep) {
            setCurrentStep(prevStep);
        } else {
            router.back();
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'domain':
                return (
                    <StepDomain
                        onContinue={(domain) => {
                            setOnboardingData({ ...onboardingData, domain });
                            handleNext();
                        }}
                    />
                );
            case 'benchmark':
                return <StepBenchmark onContinue={handleNext} clinicName={clinicName} />;
            case 'topics':
                return (
                    <StepTopics
                        onContinue={(topics) => {
                            setOnboardingData({ ...onboardingData, topics });
                            handleNext();
                        }}
                    />
                );
            case 'analysis':
                return <StepAnalysis onContinue={handleNext} />;
            case 'region':
                return (
                    <StepRegion
                        onContinue={(region, language) => {
                            setOnboardingData({ ...onboardingData, region, language });
                            handleNext();
                        }}
                    />
                );
            case 'pricing':
                return (
                    <StepPricing
                        onPlanSelect={(planId, interval) => {
                            setOnboardingData({ ...onboardingData, planId, interval });
                            // Here we would typically redirect to checkout
                            router.push(`/checkout/${planId}`);
                        }}
                    />
                );
            default:
                return null;
        }
    };

    // Special case for pricing page which is full width
    if (currentStep === 'pricing') {
        return (
            <div className="min-h-screen bg-white p-6 lg:p-20">
                <header className="flex items-center justify-between mb-20 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <div className="w-5 h-5 text-indigo-600">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                        </div>
                        <span className="font-bold text-slate-900 text-lg">{clinicName}</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-slate-500 font-medium">{onboardingData.domain || 'yourclinic.com'}</span>
                    </div>
                    <button onClick={handleBack} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                        Back
                    </button>
                </header>
                <main className="max-w-7xl mx-auto w-full">
                    <StepPricing
                        onPlanSelect={(planId, interval) => {
                            setOnboardingData({ ...onboardingData, planId, interval });
                            router.push(`/checkout/${planId}`);
                        }}
                    />
                </main>
            </div>
        );
    }

    const renderVisualWithProps = () => {
        switch (currentStep) {
            case 'benchmark':
                return <VisualBenchmark clinicName={clinicName} />;
            case 'domain':
                return <VisualDomain />;
            case 'topics':
                return <VisualTopics />;
            case 'analysis':
                return <VisualAnalysis />;
            case 'region':
                return <VisualRegion />;
            default:
                return null;
        }
    };

    return (
        <OnboardingLayout
            step={currentIndex}
            totalSteps={steps.length}
            onBack={handleBack}
            visual={renderVisualWithProps()}
            domain={onboardingData.domain}
            clinicName={clinicName}
        >
            {renderStep()}
        </OnboardingLayout>
    );
}
