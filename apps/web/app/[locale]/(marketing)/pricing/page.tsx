'use client';

import React, { useState } from 'react';
import { Link } from '~/lib/navigation';
import { CheckCircle2, Zap, Rocket, Crown } from 'lucide-react';

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
  shadowLg: '0 25px 50px rgba(67, 24, 255, 0.15)',
};

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: { month: 99, year: 79 },
    icon: Zap,
    description: 'Perfect for small clinics getting started',
    features: [
      'Up to 50 pages per audit',
      'Basic AI visibility tracking',
      'Monthly reports',
      'Email support',
      '1 project',
    ],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: { month: 149, year: 119 },
    icon: Rocket,
    description: 'Best for growing medical practices',
    features: [
      'Up to 200 pages per audit',
      'Advanced AI visibility tracking',
      'Weekly reports',
      'Priority email support',
      '5 projects',
      'Custom alerts',
      'API access',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { month: 499, year: 399 },
    icon: Crown,
    description: 'For large clinics and medical groups',
    features: [
      'Unlimited pages per audit',
      'Premium AI visibility tracking',
      'Real-time reports',
      '24/7 phone & email support',
      'Unlimited projects',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: HORIZON.background, color: HORIZON.textPrimary }}>
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: `${HORIZON.primary}20` }}></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px]" style={{ backgroundColor: '#7551FF20' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6" style={{ color: HORIZON.textPrimary }}>
              Simple, Transparent{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #4318FF, #7551FF)' }}>
                Pricing
              </span>
            </h1>
            <p className="text-xl mb-10" style={{ color: HORIZON.textSecondary }}>
              Choose the perfect plan for your clinic. All plans include a 14-day free trial.
            </p>

            {/* Interval Toggle */}
            <div 
              className="inline-flex items-center p-1 rounded-xl mb-12"
              style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
            >
              <button
                onClick={() => setInterval('month')}
                className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all"
                style={{ 
                  backgroundColor: interval === 'month' ? HORIZON.primary : 'transparent',
                  color: interval === 'month' ? 'white' : HORIZON.textSecondary
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval('year')}
                className="px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                style={{ 
                  backgroundColor: interval === 'year' ? HORIZON.primary : 'transparent',
                  color: interval === 'year' ? 'white' : HORIZON.textSecondary
                }}
              >
                Yearly
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-tight font-bold"
                  style={{ 
                    backgroundColor: interval === 'year' ? 'rgba(255,255,255,0.2)' : HORIZON.primaryLight, 
                    color: interval === 'year' ? 'white' : HORIZON.primary
                  }}
                >
                  2 months free
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-[20px] transition-all duration-300 hover:-translate-y-2 ${
                    plan.popular ? 'scale-105 md:scale-110 z-10' : ''
                  }`}
                  style={{ 
                    backgroundColor: 'white',
                    boxShadow: plan.popular ? HORIZON.shadowLg : HORIZON.shadow,
                    border: plan.popular ? `2px solid ${HORIZON.primary}` : '2px solid transparent'
                  }}
                >
                  {plan.popular && (
                    <div 
                      className="absolute -top-4 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-sm font-bold"
                      style={{ backgroundColor: HORIZON.primary }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{ 
                          backgroundColor: plan.popular ? HORIZON.primaryLight : HORIZON.background,
                          color: plan.popular ? HORIZON.primary : HORIZON.textSecondary
                        }}
                      >
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold" style={{ color: HORIZON.textPrimary }}>{plan.name}</h3>
                        <p className="text-sm" style={{ color: HORIZON.textSecondary }}>{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="my-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold" style={{ color: HORIZON.textPrimary }}>${plan.price[interval]}</span>
                        <span style={{ color: HORIZON.textSecondary }}>/month</span>
                      </div>
                      {interval === 'year' && (
                        <p className="text-sm mt-1" style={{ color: HORIZON.success }}>
                          Save ${(plan.price.month - plan.price.year) * 12}/year
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2
                            size={20}
                            className="flex-shrink-0 mt-0.5"
                            style={{ color: plan.popular ? HORIZON.primary : HORIZON.success }}
                          />
                          <span style={{ color: HORIZON.textSecondary }}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link
                      href="/onboarding"
                      className="block w-full text-center py-4 px-6 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                      style={{ 
                        backgroundColor: plan.popular ? HORIZON.primary : HORIZON.textPrimary,
                        color: 'white',
                        boxShadow: plan.popular ? `0 15px 30px ${HORIZON.primary}30` : 'none'
                      }}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ or Additional Info */}
      <section className="pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="mb-4" style={{ color: HORIZON.textSecondary }}>
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm" style={{ color: HORIZON.textSecondary }}>
            Cancel anytime. Questions?{' '}
            <a href="mailto:support@example.com" style={{ color: HORIZON.primary }} className="hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
