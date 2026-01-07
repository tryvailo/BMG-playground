'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingLayout } from '~/components/onboarding/OnboardingLayout';
import { StepDomainGeo, VisualDomainGeo } from '~/components/onboarding/StepDomainGeo';
import { StepBenchmark, VisualBenchmark } from '~/components/onboarding/StepBenchmark';
import { StepTopics, VisualTopics } from '~/components/onboarding/StepTopics';
import { StepAnalysis, VisualAnalysis } from '~/components/onboarding/StepAnalysis';
import { StepPricing } from '~/components/onboarding/StepPricing';
import { StepAccount } from '~/components/onboarding/StepAccount';
import { useRouter } from '~/lib/navigation';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useSignUpWithEmailAndPassword } from '@kit/supabase/hooks/use-sign-up-with-email-password';
import { useSignInWithEmailPassword } from '@kit/supabase/hooks/use-sign-in-with-email-password';

// New flow: domain-geo (combined) -> benchmark -> topics -> analysis -> account -> pricing
type OnboardingStep = 'domain-geo' | 'benchmark' | 'topics' | 'analysis' | 'account' | 'pricing';

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
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('domain-geo');
    const [onboardingData, setOnboardingData] = useState({
        domain: '',
        clinicName: '', // Store found clinic name for Ukraine
        topics: [] as string[],
        region: 'US',
        language: 'en',
        city: '',
        competitors: [] as Array<{ name: string; url: string }>, // Competitors for Ukraine
        totalClinicsInCity: 0, // Total count of clinics in the city
        planId: '',
        interval: 'month' as 'month' | 'year'
    });
    // Store selected region separately to ensure it's available immediately
    const [_selectedRegion, setSelectedRegion] = useState<string>('UA');

    const router = useRouter();
    const client = useSupabase();
    const signUpMutation = useSignUpWithEmailAndPassword();
    const signInMutation = useSignInWithEmailPassword();
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [existingUserId, setExistingUserId] = useState<string | null>(null);

    // Check if user is already logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await client.auth.getSession();
            if (session?.user?.id) {
                console.log('[Onboarding] User already logged in:', session.user.id);
                setExistingUserId(session.user.id);
            }
        };
        checkSession();
    }, [client.auth]);
    
    // Extract clinic name from domain or use found clinic name for Ukraine
    const clinicName = useMemo(() => {
        // If we have a found clinic name for Ukraine (from database lookup), use it
        if (onboardingData.region === 'UA' && onboardingData.clinicName) {
            return onboardingData.clinicName;
        }
        // Otherwise, extract from domain (fallback for all cases)
        return extractClinicName(onboardingData.domain);
    }, [onboardingData.domain, onboardingData.clinicName, onboardingData.region]);

    // New optimized flow: domain-geo -> benchmark -> topics -> analysis -> account -> pricing
    // Account before Pricing to maximize lead capture
    const getSteps = (): OnboardingStep[] => {
        return ['domain-geo', 'benchmark', 'topics', 'analysis', 'account', 'pricing'];
    };

    const steps = useMemo(() => getSteps(), []);
    const currentIndex = steps.indexOf(currentStep);


    const handleNext = () => {
        const nextStep = steps[currentIndex + 1];
        console.log('[OnboardingPage] handleNext called, currentStep:', currentStep, 'currentIndex:', currentIndex, 'nextStep:', nextStep);
        if (nextStep) {
            console.log('[OnboardingPage] Setting currentStep to:', nextStep);
            setCurrentStep(nextStep);
        } else {
            console.log('[OnboardingPage] No next step available');
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

    const _handleCreateAccount = async (email: string, password: string) => {
        setIsCreatingAccount(true);
        try {
            // Create account
            const signUpData = await signUpMutation.mutateAsync({
                email,
                password,
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            });

            // Check if user was created
            if (!signUpData.user?.id) {
                throw new Error('Failed to create account: User ID is missing');
            }

            const userId = signUpData.user.id;
            console.log('[Onboarding] User created:', userId);

            // CRITICAL: Ensure account exists in database
            // The trigger should create it, but we verify and create if needed
            // This prevents the issue where user can login but account doesn't exist
            try {
                const { data: existingAccount, error: _accountCheckError } = await client
                    .from('accounts')
                    .select('id')
                    .eq('id', userId)
                    .maybeSingle();

                if (!existingAccount) {
                    console.log('[Onboarding] Account not found, creating...');
                    const { error: accountError } = await client
                        .from('accounts')
                        .insert({
                            id: userId,
                            name: email.split('@')[0] || 'User',
                            email: email,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });

                    if (accountError) {
                        console.error('[Onboarding] Error creating account:', accountError);
                        // Check if it's a conflict error (account already exists)
                        if (!accountError.message?.includes('duplicate') && !accountError.message?.includes('unique')) {
                            throw new Error(`Failed to create account: ${accountError.message}`);
                        }
                    } else {
                        console.log('[Onboarding] ✅ Account created successfully');
                    }
                } else {
                    console.log('[Onboarding] ✅ Account already exists');
                }
            } catch (accountError) {
                console.error('[Onboarding] Error checking/creating account:', accountError);
                // Continue anyway - account might be created by trigger or API will handle it
            }

            // Best Practice: Give access immediately, even without email confirmation
            // This maximizes conversion - user already went through 8 onboarding steps
            // Email confirmation can be done later (soft reminders)
            // Only require confirmation before payment (security)
            
            // Set the session explicitly if we have one from signup
            // This ensures the client has the correct auth state for database operations
            let currentSession = signUpData.session;
            
            if (currentSession) {
                await client.auth.setSession({
                    access_token: currentSession.access_token,
                    refresh_token: currentSession.refresh_token,
                });
            } else {
                // If no session, try to sign in immediately after signup
                // This works when email confirmation is disabled
                console.log('No session from signup, attempting to sign in...');
                try {
                    const signInData = await signInMutation.mutateAsync({
                        email,
                        password,
                    });
                    
                    if (signInData.session) {
                        currentSession = signInData.session;
                        await client.auth.setSession({
                            access_token: signInData.session.access_token,
                            refresh_token: signInData.session.refresh_token,
                        });
                        console.log('Successfully signed in after registration');
                    }
                } catch (signInError) {
                    console.warn('Could not sign in after registration:', signInError);
                    // Try to refresh session as fallback
                    const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
                    if (refreshData?.session) {
                        currentSession = refreshData.session;
                    } else if (refreshError) {
                        console.warn('Could not refresh session:', refreshError);
                    }
                }
            }

            // Wait a bit for session to be established
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get current session (double-check)
            if (!currentSession) {
                const { data: { session: checkedSession } } = await client.auth.getSession();
                currentSession = checkedSession;
            }
            
            // Create project even without session - API will handle it using user.id
            // This allows onboarding to complete even if email confirmation is required
            const cleanDomain = onboardingData.domain
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .toLowerCase()
                .trim();

            // Create project using API endpoint with user.id in body
            // API will use service role to create project if no session is available
            // Also creates subscription if planId is provided
            const requestBody = {
                userId: signUpData.user.id, // Pass user.id explicitly
                domain: cleanDomain,
                clinicName: clinicName,
                region: onboardingData.region,
                city: onboardingData.city,
                language: onboardingData.language,
                // Pass subscription data for API to create
                planId: onboardingData.planId,
                interval: onboardingData.interval,
            };
            
            console.log('[Onboarding] Sending project creation request:', {
                ...requestBody,
                hasPlanId: !!requestBody.planId,
                planId: requestBody.planId,
                region: requestBody.region,
                fullOnboardingData: onboardingData, // Log full state for debugging
            });
            
            const response = await fetch('/api/projects/create-from-onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(currentSession?.access_token && {
                        'Authorization': `Bearer ${currentSession.access_token}`,
                    }),
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to create/update project:', errorText);
                throw new Error(`Failed to create project: ${response.status} ${errorText}`);
            }

            // Redirect to home
            router.push('/home');
        } catch (error) {
            console.error('Error creating account:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
            alert(errorMessage);
        } finally {
            setIsCreatingAccount(false);
        }
    };

    // Create project for already logged-in user (skip account creation step)
    const _handleCreateProjectForExistingUser = async (planId: string, interval: 'month' | 'year') => {
        if (!existingUserId) {
            console.error('[Onboarding] No existing user ID found');
            return;
        }

        setIsCreatingAccount(true);
        try {
            const { data: { session } } = await client.auth.getSession();
            
            const cleanDomain = onboardingData.domain
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .toLowerCase()
                .trim();

            const requestBody = {
                userId: existingUserId,
                domain: cleanDomain,
                clinicName: clinicName,
                region: onboardingData.region,
                city: onboardingData.city,
                language: onboardingData.language,
                planId: planId,
                interval: interval,
            };
            
            console.log('[Onboarding] Creating project for existing user:', requestBody);
            
            const response = await fetch('/api/projects/create-from-onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token && {
                        'Authorization': `Bearer ${session.access_token}`,
                    }),
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to create project for existing user:', errorText);
                throw new Error(`Failed to create project: ${response.status} ${errorText}`);
            }

            console.log('[Onboarding] Project created successfully for existing user');
            router.push('/home');
        } catch (error) {
            console.error('Error creating project for existing user:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create project. Please try again.';
            alert(errorMessage);
        } finally {
            setIsCreatingAccount(false);
        }
    };

    // New flow: Create account first, then go to pricing step
    const handleCreateAccountThenPricing = async (email: string, password: string) => {
        setIsCreatingAccount(true);
        try {
            // Create account
            const signUpData = await signUpMutation.mutateAsync({
                email,
                password,
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            });

            if (!signUpData.user?.id) {
                throw new Error('Failed to create account: User ID is missing');
            }

            const userId = signUpData.user.id;
            console.log('[Onboarding] User created (then pricing):', userId);

            // CRITICAL: Ensure account exists in database
            // The trigger should create it, but we verify and create if needed
            try {
                const { data: existingAccount2, error: _accountCheckError2 } = await client
                    .from('accounts')
                    .select('id')
                    .eq('id', userId)
                    .maybeSingle();

                if (!existingAccount2) {
                    console.log('[Onboarding] Account not found, creating...');
                    const { error: accountError } = await client
                        .from('accounts')
                        .insert({
                            id: userId,
                            name: email.split('@')[0] || 'User',
                            email: email,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });

                    if (accountError) {
                        console.error('[Onboarding] Error creating account:', accountError);
                        if (!accountError.message?.includes('duplicate') && !accountError.message?.includes('unique')) {
                            throw new Error(`Failed to create account: ${accountError.message}`);
                        }
                    } else {
                        console.log('[Onboarding] ✅ Account created successfully');
                    }
                } else {
                    console.log('[Onboarding] ✅ Account already exists');
                }
            } catch (accountError) {
                console.error('[Onboarding] Error checking/creating account:', accountError);
                // Continue anyway - account might be created by trigger or API will handle it
            }

            // Set session
            let currentSession = signUpData.session;
            if (currentSession) {
                await client.auth.setSession({
                    access_token: currentSession.access_token,
                    refresh_token: currentSession.refresh_token,
                });
            } else {
                // Try to sign in
                try {
                    const signInData = await signInMutation.mutateAsync({ email, password });
                    if (signInData.session) {
                        currentSession = signInData.session;
                        await client.auth.setSession({
                            access_token: signInData.session.access_token,
                            refresh_token: signInData.session.refresh_token,
                        });
                    }
                } catch {
                    console.warn('Could not sign in after registration');
                }
            }

            // Store user ID for later project creation
            setExistingUserId(signUpData.user.id);
            
            console.log('[Onboarding] Account created, moving to pricing step');
            // Move to pricing step
            handleNext();
        } catch (error) {
            console.error('Error creating account:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
            alert(errorMessage);
        } finally {
            setIsCreatingAccount(false);
        }
    };

    // Create project with selected plan (after account is created or for existing user)
    const handleCreateProjectWithPlan = async (planId: string, interval: 'month' | 'year') => {
        const userId = existingUserId;
        if (!userId) {
            console.error('[Onboarding] No user ID found');
            alert('Please create an account first');
            setCurrentStep('account');
            return;
        }

        setIsCreatingAccount(true);
        try {
            const { data: { session } } = await client.auth.getSession();
            
            const cleanDomain = onboardingData.domain
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .toLowerCase()
                .trim();

            const requestBody = {
                userId,
                domain: cleanDomain,
                clinicName: clinicName,
                region: onboardingData.region,
                city: onboardingData.city,
                language: onboardingData.language,
                planId,
                interval,
            };
            
            console.log('[Onboarding] Creating project with plan:', requestBody);
            
            const response = await fetch('/api/projects/create-from-onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token && {
                        'Authorization': `Bearer ${session.access_token}`,
                    }),
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to create project:', errorText);
                throw new Error(`Failed to create project: ${response.status} ${errorText}`);
            }

            console.log('[Onboarding] Project created successfully');
            router.push('/home');
        } catch (error) {
            console.error('Error creating project:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create project. Please try again.';
            alert(errorMessage);
        } finally {
            setIsCreatingAccount(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'domain-geo':
                return (
                    <StepDomainGeo
                        onContinue={(data) => {
                            console.log('[Onboarding] StepDomainGeo completed:', data);
                            setSelectedRegion(data.region);
                            setOnboardingData(prev => ({ 
                                ...prev, 
                                domain: data.domain,
                                region: data.region,
                                city: data.city,
                                language: data.language,
                                clinicName: data.clinicName || '',
                                competitors: data.competitors || [],
                                totalClinicsInCity: data.totalClinicsInCity || 0
                            }));
                            handleNext();
                        }}
                    />
                );
            case 'benchmark':
                return <StepBenchmark onContinue={handleNext} clinicName={clinicName} competitors={onboardingData.competitors} totalClinicsInCity={onboardingData.totalClinicsInCity} />;
            case 'topics':
                return (
                    <StepTopics
                        locale={onboardingData.language === 'uk' ? 'ukr' : 'en'}
                        onContinue={(topics) => {
                            setOnboardingData({ ...onboardingData, topics });
                            handleNext();
                        }}
                    />
                );
            case 'analysis':
                return <StepAnalysis onContinue={handleNext} />;
            case 'account':
                return (
                    <StepAccount
                        defaultEmail={''}
                        isLoading={isCreatingAccount}
                        onContinue={async (email, password) => {
                            // Create account first, then go to pricing
                            await handleCreateAccountThenPricing(email, password);
                        }}
                    />
                );
            case 'pricing':
                return (
                    <StepPricing
                        onPlanSelect={(planId, interval) => {
                            console.log('[Onboarding] Plan selected:', { planId, interval, existingUserId, currentData: onboardingData });
                            // User should be logged in at this point (account created in previous step)
                            // Or existing user who was already logged in
                            setOnboardingData(prev => ({ ...prev, planId, interval }));
                            handleCreateProjectWithPlan(planId, interval);
                        }}
                    />
                );
            default:
                return null;
        }
    };

    // Special case for pricing and account pages which are full width
    if (currentStep === 'pricing' || currentStep === 'account') {
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
                    {currentStep === 'account' ? (
                        <StepAccount
                            defaultEmail={''}
                            isLoading={isCreatingAccount}
                            onContinue={async (email, password) => {
                                await handleCreateAccountThenPricing(email, password);
                            }}
                        />
                    ) : (
                        <StepPricing
                            onPlanSelect={(planId, interval) => {
                                console.log('[Onboarding] Plan selected:', { planId, interval, existingUserId });
                                setOnboardingData(prev => ({ ...prev, planId, interval }));
                                handleCreateProjectWithPlan(planId, interval);
                            }}
                        />
                    )}
                </main>
            </div>
        );
    }

    const renderVisualWithProps = () => {
        switch (currentStep) {
            case 'domain-geo':
                return <VisualDomainGeo />;
            case 'benchmark':
                return <VisualBenchmark clinicName={clinicName} competitors={onboardingData.competitors} totalClinicsInCity={onboardingData.totalClinicsInCity} />;
            case 'topics':
                return <VisualTopics />;
            case 'analysis':
                return <VisualAnalysis />;
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
