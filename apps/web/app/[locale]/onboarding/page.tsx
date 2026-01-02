'use client';

import React, { useState, useMemo } from 'react';
import { OnboardingLayout } from '~/components/onboarding/OnboardingLayout';
import { StepDomain, VisualDomain } from '~/components/onboarding/StepDomain';
import { StepBenchmark, VisualBenchmark } from '~/components/onboarding/StepBenchmark';
import { StepTopics, VisualTopics } from '~/components/onboarding/StepTopics';
import { StepAnalysis, VisualAnalysis } from '~/components/onboarding/StepAnalysis';
import { StepRegion, VisualRegion } from '~/components/onboarding/StepRegion';
import { StepCity, VisualCity } from '~/components/onboarding/StepCity';
import { StepPricing } from '~/components/onboarding/StepPricing';
import { useRouter } from '~/lib/navigation';

type OnboardingStep = 'domain' | 'benchmark' | 'topics' | 'analysis' | 'region' | 'city' | 'pricing';

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
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('region');
    const [onboardingData, setOnboardingData] = useState({
        domain: '',
        clinicName: '', // Store found clinic name for Ukraine
        topics: [] as string[],
        region: 'US',
        language: 'en',
        city: '',
        competitors: [] as Array<{ name: string; url: string }>, // Competitors for Ukraine
        planId: '',
        interval: 'month' as 'month' | 'year'
    });
    // Store selected region separately to ensure it's available immediately
    const [selectedRegion, setSelectedRegion] = useState<string>('US');

    const router = useRouter();
    
    // Extract clinic name from domain or use found clinic name for Ukraine
    const clinicName = useMemo(() => {
        // If we have a found clinic name for Ukraine (from database lookup), use it
        if (onboardingData.region === 'UA' && onboardingData.clinicName) {
            return onboardingData.clinicName;
        }
        // Otherwise, extract from domain (fallback for all cases)
        return extractClinicName(onboardingData.domain);
    }, [onboardingData.domain, onboardingData.clinicName, onboardingData.region]);

    // Determine steps based on region selection
    // New order: 1) region (country) 2) city (for all countries) 3) domain (URL) 4) other steps
    const getSteps = (): OnboardingStep[] => {
        // All countries have city selection step
        return ['region', 'city', 'domain', 'benchmark', 'topics', 'analysis', 'pricing'];
    };

    const steps = useMemo(() => getSteps(), []);
    const currentIndex = steps.indexOf(currentStep);


    const handleNext = () => {
        const nextStep = steps[currentIndex + 1];
        if (nextStep) {
            setCurrentStep(nextStep);
        }
    };

    const handleBack = () => {
        // Recalculate steps in case region changed
        const currentSteps = getSteps();
        const currentIdx = currentSteps.indexOf(currentStep);
        const prevStep = currentSteps[currentIdx - 1];
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
                        region={selectedRegion || onboardingData.region}
                        city={onboardingData.city}
                        onContinue={(domain, clinicName, competitors) => {
                            setOnboardingData(prev => ({ 
                                ...prev, 
                                domain,
                                // Only set clinicName if found in database, otherwise leave empty to use domain extraction
                                clinicName: clinicName || '',
                                // Store competitors for Ukraine
                                competitors: competitors || []
                            }));
                            handleNext();
                        }}
                    />
                );
            case 'benchmark':
                return <StepBenchmark onContinue={handleNext} clinicName={clinicName} competitors={onboardingData.competitors} />;
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
                            // Store region immediately for use in next step
                            setSelectedRegion(region);
                            // Update state
                            setOnboardingData(prev => ({ ...prev, region, language }));
                            // Navigate to city step for all countries
                            setCurrentStep('city');
                        }}
                    />
                );
            case 'city':
                return (
                    <StepCity
                        countryCode={selectedRegion || 'UA'}
                        onContinue={(city) => {
                            setOnboardingData(prev => ({ ...prev, city }));
                            // After city selection, go to domain step
                            setCurrentStep('domain');
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
                return <VisualBenchmark clinicName={clinicName} competitors={onboardingData.competitors} />;
            case 'domain':
                return <VisualDomain />;
            case 'topics':
                return <VisualTopics />;
            case 'analysis':
                return <VisualAnalysis />;
            case 'region':
                return <VisualRegion />;
            case 'city':
                return <VisualCity />;
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
