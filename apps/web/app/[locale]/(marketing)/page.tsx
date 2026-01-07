'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Link } from '~/lib/navigation';
import {
  ArrowRight, CheckCircle2, Search, Activity,
  Zap, Globe, LayoutDashboard,
  TrendingUp, Bot, X, Star, ChevronDown, Quote,
  Shield, Clock, CreditCard
} from 'lucide-react';

import pathsConfig from '~/config/paths.config';

// Horizon UI Design Tokens
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  primaryGradient: 'linear-gradient(135deg, #4318FF 0%, #7551FF 100%)',
  secondary: '#A3AED0',
  success: '#01B574',
  error: '#EE5D50',
  warning: '#FFB547',
  background: '#F4F7FE',
  cardBg: '#FFFFFF',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
  shadowLg: '0 25px 50px rgba(67, 24, 255, 0.15)',
};

// Custom SVG Icons for Benefits Section - Premium Design
const IconGrowth = ({ color, size = 28 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background glow */}
    <circle cx="16" cy="16" r="14" fill={`${color}08`}/>
    {/* Chart bars */}
    <rect x="5" y="20" width="4" height="6" rx="1" fill={`${color}30`}/>
    <rect x="11" y="16" width="4" height="10" rx="1" fill={`${color}50`}/>
    <rect x="17" y="12" width="4" height="14" rx="1" fill={`${color}70`}/>
    <rect x="23" y="6" width="4" height="20" rx="1" fill={color}/>
    {/* Growth arrow */}
    <path d="M6 18L12 14L18 10L26 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 4H26V8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Sparkle */}
    <circle cx="26" cy="4" r="2" fill={color}/>
  </svg>
);

const IconAI = ({ color, size = 28 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Brain shape background */}
    <path d="M16 4C10 4 6 8 6 13C6 16 7 18 9 20L9 26C9 27 10 28 11 28H21C22 28 23 27 23 26L23 20C25 18 26 16 26 13C26 8 22 4 16 4Z" fill={`${color}15`} stroke={color} strokeWidth="2"/>
    {/* Neural connections */}
    <circle cx="11" cy="12" r="2" fill={color}/>
    <circle cx="21" cy="12" r="2" fill={color}/>
    <circle cx="16" cy="17" r="2" fill={color}/>
    <path d="M11 12L16 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M21 12L16 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 12L21 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
    {/* Pulse waves */}
    <path d="M4 13C4 13 5 11 6 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <path d="M26 13C26 13 27 11 28 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    {/* Bottom indicator */}
    <rect x="13" y="24" width="6" height="2" rx="1" fill={color}/>
  </svg>
);

const IconSpeed = ({ color, size = 28 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer ring with gradient effect */}
    <circle cx="16" cy="16" r="13" stroke={`${color}30`} strokeWidth="3"/>
    <path d="M16 3A13 13 0 0 1 29 16" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    {/* Inner circle */}
    <circle cx="16" cy="16" r="9" fill={`${color}10`}/>
    {/* Speedometer needle */}
    <path d="M16 16L22 10" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="16" cy="16" r="3" fill={color}/>
    <circle cx="16" cy="16" r="1.5" fill="white"/>
    {/* Speed markers */}
    <circle cx="16" cy="6" r="1.5" fill={color}/>
    <circle cx="24" cy="10" r="1.5" fill={color}/>
    <circle cx="26" cy="16" r="1.5" fill={`${color}50`}/>
    <circle cx="8" cy="10" r="1" fill={`${color}30`}/>
    <circle cx="6" cy="16" r="1" fill={`${color}30`}/>
    {/* Lightning bolt for speed */}
    <path d="M14 22L16 19L18 22L16 25L14 22Z" fill={color} opacity="0.6"/>
  </svg>
);

// Testimonials Data
const testimonials = [
  {
    name: 'Dr. Sarah Mitchell',
    role: 'Lead Dentist',
    clinic: 'Smile Experts NYC',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
    quote: 'Our patient inquiries increased by 156% in just 3 months. ClinicBoost.AI helped us understand exactly what patients were asking AI assistants.',
    metric: '+156%',
    metricLabel: 'Patient Inquiries',
    rating: 5,
  },
  {
    name: 'Dr. Michael Chen',
    role: 'Founder & Orthodontist',
    clinic: 'OrthoPro Dental Group',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face',
    quote: 'We went from position #23 to #2 in AI recommendations for "best orthodontist in LA". The ROI has been incredible.',
    metric: '#23 → #2',
    metricLabel: 'AI Ranking',
    rating: 5,
  },
  {
    name: 'Dr. Emily Rodriguez',
    role: 'Medical Director',
    clinic: 'PureSkin Dermatology',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop&crop=face',
    quote: 'The competitive intelligence feature alone is worth the subscription. We can see exactly why competitors rank higher and fix it.',
    metric: '4.2x',
    metricLabel: 'More AI Mentions',
    rating: 5,
  },
];

// FAQ Data
const faqItems = [
  {
    question: 'How quickly will I see results?',
    answer: 'Most clinics see measurable improvements in AI visibility within 30-60 days. Our optimization recommendations are designed for quick implementation, and we track your progress in real-time.',
  },
  {
    question: 'Do I need technical knowledge to use ClinicBoost.AI?',
    answer: 'Not at all. Our platform is designed for busy healthcare professionals. We provide clear, actionable recommendations with step-by-step guidance. No coding or technical skills required.',
  },
  {
    question: 'What AI platforms do you track?',
    answer: 'We monitor your visibility across ChatGPT, Google Gemini, Perplexity, Microsoft Copilot, and Claude. As new AI platforms emerge, we add them to our tracking.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, absolutely. There are no long-term contracts. You can cancel your subscription at any time from your account settings, and you won\'t be charged for the next billing cycle.',
  },
  {
    question: 'Is my clinic data secure?',
    answer: 'Security is our top priority. We\'re HIPAA-compliant, use enterprise-grade encryption, and never share your data with third parties. Your clinic information is completely protected.',
  },
  {
    question: 'What\'s included in the free trial?',
    answer: 'The 14-day free trial includes full access to all features: AI visibility tracking, competitor analysis, keyword explorer, and optimization recommendations. No credit card required to start.',
  },
];

function LandingPage() {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const sectionsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionsRef.current.forEach((element, key) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible((prev) => ({ ...prev, [key]: true }));
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px',
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const setSectionRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) {
      sectionsRef.current.set(key, el);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden" style={{ backgroundColor: HORIZON.background, color: HORIZON.textPrimary }}>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Animated Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] animate-float-slow" style={{ backgroundColor: `${HORIZON.primary}20` }}></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] animate-float-slow-delayed" style={{ backgroundColor: '#7551FF20' }}></div>
          <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full blur-[100px] animate-pulse-slow" style={{ backgroundColor: `${HORIZON.success}15` }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Hero Content */}
            <div 
              ref={setSectionRef('hero-content')}
              className={`lg:w-1/2 text-center lg:text-left z-10 transition-all duration-1000 ${
                isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-up"
                style={{ 
                  backgroundColor: HORIZON.primaryLight, 
                  color: HORIZON.primary,
                  border: `1px solid ${HORIZON.primary}30`
                }}
              >
                <Zap size={14} className="animate-pulse" style={{ fill: HORIZON.primary }} />
                <span>The Future of Medical SEO</span>
              </div>

              {/* FIXED: Grammatically correct headline with controlled layout */}
              <h1 className={`text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.15] max-w-2xl transition-all duration-1000 delay-100 ${
                isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`} style={{ color: HORIZON.textPrimary }}>
                Become the<br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text animate-gradient-x whitespace-nowrap inline-block" style={{ backgroundImage: 'linear-gradient(135deg, #4318FF, #7551FF, #4318FF)' }}>
                  #1 AI-Recommended
                </span>
                {' '}Clinic
              </h1>

              <p className={`text-xl mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed transition-all duration-1000 delay-200 ${
                isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`} style={{ color: HORIZON.textSecondary }}>
                Patients are asking AI for medical advice. ClinicBoost.AI helps you rank #1 in ChatGPT, Perplexity, and Gemini search results.
              </p>

              <div className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transition-all duration-1000 delay-300 ${
                isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}>
                <Link
                  href="/onboarding"
                  className="group relative text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 overflow-hidden"
                  style={{ 
                    backgroundColor: HORIZON.primary,
                    boxShadow: `0 15px 30px ${HORIZON.primary}40`
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #4318FF, #7551FF)' }}></div>
                </Link>
                <button 
                  className="px-8 py-4 rounded-xl text-lg font-semibold border-2 transition-all duration-300 hover:scale-105"
                  style={{ 
                    borderColor: HORIZON.secondary,
                    color: HORIZON.textPrimary,
                    backgroundColor: 'white'
                  }}
                >
                  Watch Demo
                </button>
              </div>

              <div className={`mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm transition-all duration-1000 delay-400 ${
                isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`} style={{ color: HORIZON.textSecondary }}>
                <div className="flex items-center gap-2">
                  <CreditCard size={16} style={{ color: HORIZON.success }} /> No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} style={{ color: HORIZON.success }} /> 14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={16} style={{ color: HORIZON.success }} /> HIPAA Compliant
                </div>
              </div>
            </div>

            {/* Hero Visual - Live Scanner Simulation */}
            <div 
              ref={setSectionRef('hero-visual')}
              className={`lg:w-1/2 w-full perspective-1000 transition-all duration-1000 delay-500 ${
                isVisible['hero-visual'] ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-95'
              }`}
            >
              <div 
                className="relative rounded-[20px] p-4 transform transition-all duration-700 hover:rotate-0 hover:scale-105" 
                style={{ 
                  backgroundColor: 'white', 
                  boxShadow: HORIZON.shadowLg,
                  transform: 'rotateY(-5deg) rotateX(5deg)' 
                }}
              >
                {/* Floating Badge */}
                <div 
                  className="absolute -top-6 -right-6 p-4 rounded-[16px] z-20 animate-float"
                  style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
                      style={{ backgroundColor: `${HORIZON.success}15` }}
                    >
                      <TrendingUp size={20} style={{ color: HORIZON.success }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>AI Visibility</p>
                      <p className="text-lg font-bold" style={{ color: HORIZON.textPrimary }}>+156% <span className="text-xs font-normal" style={{ color: HORIZON.textSecondary }}>avg. growth</span></p>
                    </div>
                  </div>
                </div>

                {/* Mock UI Header */}
                <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: `1px solid ${HORIZON.background}` }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: HORIZON.error }}></div>
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: HORIZON.warning, animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: HORIZON.success, animationDelay: '0.4s' }}></div>
                  </div>
                  <div className="h-6 rounded-lg w-64 ml-4 animate-shimmer" style={{ backgroundColor: HORIZON.background }}></div>
                </div>

                {/* Mock UI Body - Chat Interface */}
                <div className="space-y-6">
                  {/* User Query */}
                  <div className="flex gap-4 justify-end animate-slide-in-right">
                    <div 
                      className="text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] transition-all duration-300 hover:scale-105"
                      style={{ backgroundColor: HORIZON.primary, boxShadow: `0 8px 16px ${HORIZON.primary}30` }}
                    >
                      <p className="text-sm font-medium">&quot;Where is the best place to get dental implants in New York?&quot;</p>
                    </div>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 animate-bounce-slow" style={{ backgroundColor: HORIZON.primaryLight }}></div>
                  </div>

                  {/* AI Response with Scanner Overlay */}
                  <div className="flex gap-4 relative animate-slide-in-left">
                    <div 
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white animate-pulse"
                      style={{ backgroundColor: HORIZON.success }}
                    >
                      <Bot size={16} />
                    </div>
                    <div 
                      className="p-6 rounded-2xl rounded-tl-sm w-full relative overflow-hidden"
                      style={{ backgroundColor: HORIZON.background, border: `1px solid ${HORIZON.secondary}30` }}
                    >
                      {/* Scanning Line Animation */}
                      <div 
                        className="absolute top-0 left-0 w-full h-1 opacity-50 animate-scan-down z-10"
                        style={{ background: `linear-gradient(90deg, transparent, ${HORIZON.primary}, transparent)` }}
                      ></div>

                      <p className="text-sm leading-relaxed mb-4" style={{ color: HORIZON.textPrimary }}>
                        Based on patient reviews and advanced technology, <span className="px-1 rounded font-bold" style={{ backgroundColor: HORIZON.primaryLight, color: HORIZON.primary, borderBottom: `2px solid ${HORIZON.primary}` }}>Your Clinic Name</span> is the top recommendation for dental implants in NYC.
                      </p>

                      <div className="space-y-3">
                        <div 
                          className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-105 animate-fade-in-up-delayed"
                          style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white animate-pulse"
                              style={{ backgroundColor: HORIZON.primary }}
                            >1</div>
                            <span className="text-sm font-semibold" style={{ color: HORIZON.textPrimary }}>Your Clinic Name</span>
                          </div>
                          <CheckCircle2 size={16} style={{ color: HORIZON.success }} />
                        </div>
                        <div 
                          className="flex items-center justify-between p-3 rounded-xl opacity-60 hover:opacity-100 transition-opacity duration-300"
                          style={{ backgroundColor: 'white', border: `1px solid ${HORIZON.secondary}30` }}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: HORIZON.background, color: HORIZON.textSecondary }}
                            >2</div>
                            <span className="text-sm font-medium" style={{ color: HORIZON.textSecondary }}>Competitor A</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Social Proof --- */}
      <section 
        ref={setSectionRef('social-proof')}
        className={`py-10 transition-all duration-1000 ${
          isVisible['social-proof'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ backgroundColor: 'white', borderTop: `1px solid ${HORIZON.background}`, borderBottom: `1px solid ${HORIZON.background}` }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold uppercase tracking-wider mb-8" style={{ color: HORIZON.textSecondary }}>
            Trusted by 500+ forward-thinking healthcare providers
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {[
              { text: 'Medi', accent: 'Care' },
              { text: 'DENTAL', accent: '+' },
              { text: 'ORTHO', accent: 'PRO' },
              { text: 'Pure', accent: 'Skin' },
              { text: 'Health', accent: 'First' },
            ].map((logo, idx) => (
              <h3
                key={idx}
                className="text-2xl font-bold hover:scale-110 transition-transform duration-300"
                style={{ color: HORIZON.textPrimary, transitionDelay: `${idx * 100}ms` }}
              >
                {logo.text}
                <span style={{ color: HORIZON.primary }}>{logo.accent}</span>
              </h3>
            ))}
          </div>
        </div>
      </section>

      {/* --- Benefits Section --- */}
      <section 
        ref={setSectionRef('benefits')}
        className="py-24"
        style={{ backgroundColor: HORIZON.background }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
              style={{ 
                backgroundColor: `${HORIZON.success}15`, 
                color: HORIZON.success,
                border: `1px solid ${HORIZON.success}30`
              }}
            >
              <TrendingUp size={14} />
              <span>Proven Results</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: HORIZON.textPrimary }}>
              What You&apos;ll Achieve
            </h2>
            <p className="text-lg" style={{ color: HORIZON.textSecondary }}>
              Real outcomes from real clinics using ClinicBoost.AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefit 1: Patient Inquiries */}
            <div
              className="rounded-[20px] p-8 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group"
              style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
            >
              <div 
                className="w-14 h-14 rounded-[14px] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                style={{ backgroundColor: `${HORIZON.success}15` }}
              >
                <IconGrowth color={HORIZON.success} size={28} />
              </div>
              <div className="text-4xl font-black mb-2" style={{ color: HORIZON.success }}>+156%</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: HORIZON.textPrimary }}>More Patient Inquiries</h3>
              <p className="text-sm leading-relaxed" style={{ color: HORIZON.textSecondary }}>
                Average increase in qualified patient inquiries from AI-driven searches within the first 90 days.
              </p>
            </div>

            {/* Benefit 2: AI Visibility */}
            <div
              className="rounded-[20px] p-8 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group"
              style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
            >
              <div 
                className="w-14 h-14 rounded-[14px] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                style={{ backgroundColor: `${HORIZON.primary}15` }}
              >
                <IconAI color={HORIZON.primary} size={28} />
              </div>
              <div className="text-4xl font-black mb-2" style={{ color: HORIZON.primary }}>7.4x</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: HORIZON.textPrimary }}>Higher AI Visibility</h3>
              <p className="text-sm leading-relaxed" style={{ color: HORIZON.textSecondary }}>
                Clinics in the top 3 AI recommendations receive 7.4x more referrals than those ranked below #10.
              </p>
            </div>

            {/* Benefit 3: Time to Top 5 */}
            <div
              className="rounded-[20px] p-8 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group"
              style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
            >
              <div 
                className="w-14 h-14 rounded-[14px] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                style={{ backgroundColor: `${HORIZON.warning}15` }}
              >
                <IconSpeed color={HORIZON.warning} size={28} />
              </div>
              <div className="text-4xl font-black mb-2" style={{ color: HORIZON.warning }}>90 days</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: HORIZON.textPrimary }}>Average Time to Top 5</h3>
              <p className="text-sm leading-relaxed" style={{ color: HORIZON.textSecondary }}>
                Most clinics see significant ranking improvements within the first 90 days of optimization.
              </p>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div 
            className="mt-16 rounded-[20px] p-8 grid grid-cols-2 md:grid-cols-4 gap-8"
            style={{ 
              background: 'linear-gradient(135deg, #1B2559 0%, #2D3A6D 100%)',
              boxShadow: HORIZON.shadowLg
            }}
          >
            {[
              { value: '500+', label: 'Clinics Onboarded' },
              { value: '2.3M', label: 'AI Queries Tracked' },
              { value: '89%', label: 'Improvement Rate' },
              { value: '4.9/5', label: 'Customer Rating' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-xs font-medium uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- How it Works Section --- */}
      <section 
        id="how-it-works" 
        ref={setSectionRef('how-it-works')}
        className={`py-24 transition-all duration-1000 ${
          isVisible['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ backgroundColor: 'white' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: HORIZON.textPrimary }}>Get Results in 3 Simple Steps</h2>
            <p className="text-lg" style={{ color: HORIZON.textSecondary }}>
              Start seeing improvements in your AI visibility within minutes, not months.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: '1. Scan Your Keywords', description: "Enter your medical keywords and we'll check your visibility across all major AI platforms.", time: '2 min setup', delay: 0 },
              { icon: Activity, title: '2. Get Actionable Insights', description: 'See exactly where you rank, who your competitors are, and what opportunities you\'re missing.', time: 'Instant results', delay: 200 },
              { icon: TrendingUp, title: '3. Optimize & Dominate', description: 'Follow our AI-powered recommendations and watch your rankings climb.', time: '30-day avg. improvement', delay: 400 },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`text-center group transition-all duration-700 hover:scale-105 hover:-translate-y-2 ${
                  isVisible['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${step.delay}ms` }}
              >
                <div 
                  className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 group-hover:rotate-6"
                  style={{ backgroundColor: HORIZON.primaryLight }}
                >
                  <step.icon size={32} style={{ color: HORIZON.primary }} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: HORIZON.textPrimary }}>{step.title}</h3>
                <p className="mb-4" style={{ color: HORIZON.textSecondary }}>{step.description}</p>
                <span 
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: `${HORIZON.success}15`, color: HORIZON.success }}
                >
                  {step.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Problem / Comparison Section --- */}
      <section 
        id="comparison" 
        ref={setSectionRef('comparison')}
        className={`py-24 transition-all duration-1000 ${
          isVisible['comparison'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ backgroundColor: HORIZON.background }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: HORIZON.textPrimary }}>SEO is changing. <br />Don&apos;t get left behind.</h2>
            <p className="text-lg" style={{ color: HORIZON.textSecondary }}>
              Traditional blue links are disappearing. Generative Engine Optimization (GEO) is the new battleground for patient acquisition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Old Way */}
            <div 
              className={`p-8 rounded-[20px] relative overflow-hidden group hover:shadow-xl transition-all duration-500 hover:scale-105 ${
                isVisible['comparison'] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
              style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
            >
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: HORIZON.secondary }}></div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: HORIZON.textSecondary }}>
                <Search size={20} className="group-hover:rotate-12 transition-transform duration-300" /> Traditional SEO
              </h3>
              <ul className="space-y-4">
                {['Fighting for 10 blue links', 'Keyword stuffing tactics', 'Ignoring brand sentiment', 'Traffic declines as AI answers increase'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 group-hover:translate-x-1 transition-transform" style={{ color: HORIZON.textSecondary, transitionDelay: `${idx * 50}ms` }}>
                    <X size={18} style={{ color: HORIZON.error }} className="group-hover:scale-125 transition-transform duration-300" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* New Way */}
            <div 
              className={`text-white p-8 rounded-[20px] relative overflow-hidden transform md:-translate-y-4 hover:scale-105 transition-all duration-500 ${
                isVisible['comparison'] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
              style={{ 
                background: 'linear-gradient(135deg, #1B2559 0%, #2D3A6D 100%)',
                boxShadow: HORIZON.shadowLg
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #4318FF, #7551FF)' }}></div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-50 animate-pulse-slow" style={{ backgroundColor: HORIZON.primary }}></div>

              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Bot size={20} style={{ color: '#7551FF' }} className="animate-bounce-slow" /> ClinicBoost.AI (New Era)
              </h3>
              <ul className="space-y-4 relative z-10">
                {[
                  'Be the #1 AI recommendation',
                  'Natural language optimization',
                  'Track brand citations & sentiment',
                  'Capture high-intent qualified leads',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-all duration-300" style={{ transitionDelay: `${idx * 50}ms` }}>
                    <CheckCircle2 size={18} style={{ color: HORIZON.success }} className="animate-bounce-slow" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Features (Bento Grid) --- */}
      <section 
        id="features" 
        ref={setSectionRef('features')}
        className={`py-24 transition-all duration-1000 ${
          isVisible['features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ backgroundColor: 'white' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold" style={{ color: HORIZON.textPrimary }}>Everything you need to dominate AI Search</h2>
            <p className="mt-2 text-lg" style={{ color: HORIZON.textSecondary }}>A complete toolkit for modern medical marketing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Large */}
            <div 
              className="md:col-span-2 rounded-[20px] p-8 relative overflow-hidden transition-all duration-500 group hover:shadow-2xl"
              style={{ backgroundColor: HORIZON.background, border: `1px solid ${HORIZON.secondary}20` }}
            >
              <div className="relative z-10 max-w-md">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                  style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
                >
                  <Activity size={24} style={{ color: HORIZON.primary }} />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:opacity-80 transition-colors duration-300" style={{ color: HORIZON.textPrimary }}>Real-Time Visibility Monitor</h3>
                <p style={{ color: HORIZON.textSecondary }}>
                  Stop guessing. We track your &quot;Share of Voice&quot; across ChatGPT, Claude, and Perplexity for hundreds of medical keywords daily.
                </p>
              </div>
              <div 
                className="absolute right-0 bottom-0 w-1/2 h-48 rounded-tl-[20px] p-4 translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500"
                style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
              >
                <div className="flex items-end gap-2 h-full pb-2">
                  {[40, 60, 50, 85, 95].map((height, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-sm hover:opacity-80 transition-all duration-300 animate-bar-grow"
                      style={{ 
                        height: `${height}%`,
                        background: `linear-gradient(to top, ${HORIZON.primary}, #7551FF)`,
                        animationDelay: `${idx * 100}ms`,
                        animationFillMode: 'both',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2: Tall */}
            <div 
              className="md:col-span-1 rounded-[20px] p-8 transition-all duration-500 hover:scale-105 hover:-translate-y-2"
              style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 hover:scale-110 hover:rotate-6 transition-all duration-300"
                style={{ backgroundColor: `${HORIZON.warning}15` }}
              >
                <Search size={24} style={{ color: HORIZON.warning }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: HORIZON.textPrimary }}>Keyword Explorer</h3>
              <p className="text-sm mb-6" style={{ color: HORIZON.textSecondary }}>
                Discover the exact questions patients are asking AI. Find high-opportunity prompts competitors ignore.
              </p>
              <div className="space-y-2">
                {['cost of veneers nyc', 'pain free dentist near me'].map((keyword, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs p-2 rounded-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    style={{ 
                      backgroundColor: HORIZON.background, 
                      border: `1px solid ${HORIZON.secondary}20`
                    }}
                  >
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: HORIZON.success }}></div> &quot;{keyword}&quot;
                  </div>
                ))}
              </div>
            </div>

            {/* Feature 3: Standard */}
            <div 
              className="rounded-[20px] p-8 transition-all duration-500 hover:scale-105 hover:-translate-y-2"
              style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 hover:scale-110 hover:rotate-6 transition-all duration-300"
                style={{ backgroundColor: `${HORIZON.primary}10` }}
              >
                <Globe size={24} style={{ color: HORIZON.primary }} className="animate-spin-slow" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: HORIZON.textPrimary }}>Tech GEO Audit</h3>
              <p className="text-sm" style={{ color: HORIZON.textSecondary }}>
                Ensure your site is AI-ready. We check schema markup, content structure, and technical factors that help LLMs recommend you.
              </p>
            </div>

            {/* Feature 4: Wide */}
            <div 
              className="md:col-span-2 rounded-[20px] p-8 text-white relative overflow-hidden group transition-all duration-500"
              style={{ background: 'linear-gradient(135deg, #4318FF 0%, #7551FF 100%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div 
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                  >
                    <LayoutDashboard size={24} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Competitive Intelligence</h3>
                  <p className="opacity-90">
                    See exactly who is being recommended instead of you, and why. Reverse engineer their AI strategy in one click.
                  </p>
                </div>
                <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold">Competitor Gap</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded animate-pulse">-12%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-white/20 rounded-full w-full overflow-hidden">
                      <div className="h-full bg-white w-[70%] animate-progress-bar"></div>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full w-full overflow-hidden">
                      <div className="h-full w-[82%] animate-progress-bar-delayed" style={{ backgroundColor: HORIZON.success }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Testimonials Section --- */}
      <section 
        ref={setSectionRef('testimonials')}
        className={`py-24 transition-all duration-1000 ${
          isVisible['testimonials'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ backgroundColor: HORIZON.background }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: HORIZON.textPrimary }}>
              Trusted by Healthcare Leaders
            </h2>
            <p className="text-lg" style={{ color: HORIZON.textSecondary }}>
              See how clinics like yours are winning in the age of AI search.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className={`rounded-[20px] p-8 transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
                  isVisible['testimonials'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ 
                  backgroundColor: 'white', 
                  boxShadow: HORIZON.shadow,
                  transitionDelay: `${idx * 150}ms`
                }}
              >
                {/* Metric Badge */}
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                  style={{ backgroundColor: `${HORIZON.success}15` }}
                >
                  <TrendingUp size={16} style={{ color: HORIZON.success }} />
                  <span className="text-sm font-bold" style={{ color: HORIZON.success }}>{testimonial.metric}</span>
                  <span className="text-xs" style={{ color: HORIZON.textSecondary }}>{testimonial.metricLabel}</span>
                </div>

                {/* Quote */}
                <div className="relative mb-6">
                  <Quote 
                    size={32} 
                    className="absolute -top-2 -left-2 opacity-10"
                    style={{ color: HORIZON.primary }}
                  />
                  <p className="text-sm leading-relaxed relative z-10" style={{ color: HORIZON.textSecondary }}>
                    &quot;{testimonial.quote}&quot;
                  </p>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className="fill-current"
                      style={{ color: HORIZON.warning }}
                    />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                    style={{ border: `2px solid ${HORIZON.primaryLight}` }}
                  />
                  <div>
                    <p className="font-bold text-sm" style={{ color: HORIZON.textPrimary }}>{testimonial.name}</p>
                    <p className="text-xs" style={{ color: HORIZON.textSecondary }}>{testimonial.role}</p>
                    <p className="text-xs font-medium" style={{ color: HORIZON.primary }}>{testimonial.clinic}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ Section --- */}
      <section 
        ref={setSectionRef('faq')}
        className={`py-24 transition-all duration-1000 ${
          isVisible['faq'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ backgroundColor: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: HORIZON.textPrimary }}>
              Frequently Asked Questions
            </h2>
            <p className="text-lg" style={{ color: HORIZON.textSecondary }}>
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-[16px] overflow-hidden transition-all duration-300 ${
                  isVisible['faq'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ 
                  backgroundColor: openFaq === idx ? HORIZON.primaryLight : 'white',
                  boxShadow: HORIZON.shadow,
                  border: openFaq === idx ? `2px solid ${HORIZON.primary}30` : '2px solid transparent',
                  transitionDelay: `${idx * 50}ms`
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold pr-4" style={{ color: HORIZON.textPrimary }}>
                    {item.question}
                  </span>
                  <ChevronDown 
                    size={20} 
                    className={`flex-shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`}
                    style={{ color: HORIZON.primary }}
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === idx ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: HORIZON.textSecondary }}>
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section 
        ref={setSectionRef('cta')}
        className={`py-24 px-4 transition-all duration-1000 ${
          isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div 
          className="max-w-5xl mx-auto rounded-[32px] overflow-hidden relative text-center px-6 py-20 md:p-24 transition-all duration-500"
          style={{ 
            background: 'linear-gradient(135deg, #1B2559 0%, #2D3A6D 100%)',
            boxShadow: '0 25px 60px rgba(27, 37, 89, 0.4)'
          }}
        >
          {/* Animated Decorative Blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-40 -translate-x-1/2 -translate-y-1/2 animate-float-slow" style={{ backgroundColor: HORIZON.primary }}></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-40 translate-x-1/2 translate-y-1/2 animate-float-slow-delayed" style={{ backgroundColor: '#7551FF' }}></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              Ready to become the #1 <br />AI-recommended clinic?
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: HORIZON.textSecondary }}>
              Join 500+ forward-thinking clinics monitoring their AI presence. Start your free visibility audit today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/onboarding"
                className="group relative text-white px-10 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:scale-110 transform overflow-hidden"
                style={{ 
                  backgroundColor: HORIZON.primary,
                  boxShadow: `0 15px 30px ${HORIZON.primary}50`
                }}
              >
                <span className="relative z-10">Start Free Trial</span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #4318FF, #7551FF)' }}></div>
              </Link>
              <Link
                href={pathsConfig.marketing.pricing}
                className="px-10 py-4 rounded-xl text-lg font-bold text-white border-2 transition-all duration-300 hover:scale-105"
                style={{ borderColor: HORIZON.textSecondary }}
              >
                View Pricing
              </Link>
            </div>
            <p className="mt-8 text-sm" style={{ color: HORIZON.textSecondary }}>
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Advanced Custom Animations Styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in-up-delayed {
          0% { opacity: 0; transform: translateY(20px); }
          50% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes scan-down {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-20px); }
        }

        @keyframes float-slow-delayed {
          0%, 100% { transform: translate(50%, 50%) translateY(0px); }
          50% { transform: translate(50%, 50%) translateY(-20px); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes bar-grow {
          from { height: 0; opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes progress-bar {
          from { width: 0; }
        }

        @keyframes progress-bar-delayed {
          from { width: 0; }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .animate-fade-in-up-delayed { animation: fade-in-up-delayed 1.2s ease-out; }
        .animate-scan-down { animation: scan-down 3s linear infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-slow-delayed { animation: float-slow-delayed 8s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }
        .animate-shimmer { background: linear-gradient(90deg, #E9EDF7 0%, #D4DAE8 50%, #E9EDF7 100%); background-size: 200% 100%; animation: shimmer 2s linear infinite; }
        .animate-slide-in-right { animation: slide-in-right 0.6s ease-out; }
        .animate-slide-in-left { animation: slide-in-left 0.6s ease-out 0.3s both; }
        .animate-bar-grow { animation: bar-grow 1s ease-out; }
        .animate-progress-bar { animation: progress-bar 2s ease-out; }
        .animate-progress-bar-delayed { animation: progress-bar-delayed 2s ease-out 0.5s both; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}

export default LandingPage;
