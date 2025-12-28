'use client';

import React from 'react';
import { Link } from '~/lib/navigation';
import { CheckCircle2, Zap, Rocket, Crown } from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    period: 'month',
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
    price: 149,
    period: 'month',
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
    price: 499,
    period: 'month',
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
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/20 blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-400/20 blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              Simple, Transparent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
                Pricing
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10">
              Choose the perfect plan for your clinic. All plans include a 14-day free trial.
            </p>
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
                  className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${plan.popular
                      ? 'border-indigo-500 shadow-xl scale-105 md:scale-110'
                      : 'border-slate-200 shadow-lg'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`p-3 rounded-xl ${plan.popular
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                        <p className="text-sm text-slate-500">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="my-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-slate-900">${plan.price}</span>
                        <span className="text-slate-500">/{plan.period}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2
                            size={20}
                            className={`flex-shrink-0 mt-0.5 ${plan.popular ? 'text-indigo-600' : 'text-green-500'
                              }`}
                          />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link
                      href="/onboarding"
                      className={`block w-full text-center py-4 px-6 rounded-xl font-semibold transition-all ${plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
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
          <p className="text-slate-600 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-slate-500">
            Cancel anytime. Questions?{' '}
            <a href="mailto:support@example.com" className="text-indigo-600 hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

