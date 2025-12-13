'use client';

import React from 'react';
import { Link } from '~/lib/navigation';
import { 
  ArrowRight, CheckCircle2, Search, Activity, 
  Zap, Globe, LayoutDashboard,
  TrendingUp, Bot, X
} from 'lucide-react';

import pathsConfig from '~/config/paths.config';

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/20 blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-400/20 blur-[120px]"></div>
          <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-blue-400/20 blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Hero Content */}
            <div className="lg:w-1/2 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-8 animate-fade-in-up">
                <Zap size={14} className="fill-indigo-700" />
                <span>The Future of Medical SEO</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Make Your Clinic <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">
                  AI-Recommended
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Patients are asking AI for medical advice. ClinicBoost.AI helps you rank #1 in ChatGPT, Perplexity, and Gemini search results.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href={pathsConfig.auth.signUp}
                  className="group bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Check My Visibility
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-8 py-4 rounded-xl text-lg font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                  Watch Demo
                </button>
              </div>

              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" /> No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" /> GDPR Compliant
                </div>
              </div>
            </div>

            {/* Hero Visual - Live Scanner Simulation */}
            <div className="lg:w-1/2 w-full perspective-1000">
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 rotate-y-[-5deg] rotate-x-[5deg] transform transition-transform hover:rotate-0 duration-500">
                {/* Floating Badge */}
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 z-20 animate-bounce-slow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">AI Visibility</p>
                      <p className="text-lg font-bold text-slate-900">+42% <span className="text-xs font-normal text-slate-400">this week</span></p>
                    </div>
                  </div>
                </div>

                {/* Mock UI Header */}
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="bg-slate-100 h-6 rounded-md w-64 ml-4"></div>
                </div>

                {/* Mock UI Body - Chat Interface */}
                <div className="space-y-6">
                  {/* User Query */}
                  <div className="flex gap-4 justify-end">
                    <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md">
                      <p className="text-sm font-medium">"Where is the best place to get dental implants in New York?"</p>
                    </div>
                    <div className="w-8 h-8 bg-indigo-200 rounded-full flex-shrink-0"></div>
                  </div>

                  {/* AI Response with Scanner Overlay */}
                  <div className="flex gap-4 relative">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center text-white">
                      <Bot size={16} />
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl rounded-tl-sm w-full border border-slate-100 relative overflow-hidden">
                      {/* Scanning Line Animation */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 animate-scan-down z-10"></div>
                      
                      <p className="text-slate-800 text-sm leading-relaxed mb-4">
                        Based on patient reviews and advanced technology, <span className="bg-yellow-100 px-1 rounded font-semibold border-b-2 border-yellow-300">Smile Experts NY</span> and <span className="bg-indigo-100 text-indigo-700 px-1 rounded font-bold border-b-2 border-indigo-300">Your Clinic Name</span> are highly recommended.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs font-bold">1</div>
                            <span className="text-sm font-medium">Your Clinic Name</span>
                          </div>
                          <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 opacity-60">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-slate-100 text-slate-500 rounded flex items-center justify-center text-xs font-bold">2</div>
                            <span className="text-sm font-medium">Competitor A</span>
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
      <section className="py-10 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-8">Trusted by forward-thinking healthcare providers</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Logos with simple text representation for now */}
             <h3 className="text-2xl font-bold font-serif text-slate-800">Medi<span className="text-indigo-600">Care</span></h3>
             <h3 className="text-2xl font-bold text-slate-800 italic">DENTAL<span className="text-blue-500">+</span></h3>
             <h3 className="text-xl font-black text-slate-800 tracking-tighter">ORTHO<span className="font-light">PRO</span></h3>
             <h3 className="text-2xl font-semibold text-slate-800">Pure<span className="text-green-600">Skin</span></h3>
             <h3 className="text-2xl font-bold text-slate-800">Health<span className="text-red-500">First</span></h3>
          </div>
        </div>
      </section>

      {/* --- How it Works Section --- */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How ClinicBoost.AI Works</h2>
            <p className="text-lg text-slate-600">
              Get started in minutes. Monitor your AI visibility, optimize your content, and dominate AI search results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Scan Your Keywords</h3>
              <p className="text-slate-600">
                Enter your medical keywords and we'll check your visibility across ChatGPT, Perplexity, and Gemini.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Activity size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Get Real-Time Insights</h3>
              <p className="text-slate-600">
                See exactly where you rank, who your competitors are, and what opportunities you're missing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Optimize & Dominate</h3>
              <p className="text-slate-600">
                Follow our AI-powered recommendations to improve your rankings and capture more qualified leads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Problem / Comparison Section --- */}
      <section id="comparison" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">SEO is changing. <br/>Don't get left behind.</h2>
            <p className="text-lg text-slate-600">
              Traditional blue links are disappearing. Generative Engine Optimization (GEO) is the new battleground for patient acquisition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Old Way */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>
               <h3 className="text-xl font-bold text-slate-400 mb-4 flex items-center gap-2">
                 <Search size={20} /> Traditional SEO
               </h3>
               <ul className="space-y-4">
                 <li className="flex items-center gap-3 text-slate-500">
                   <X size={18} /> Fighting for 10 blue links
                 </li>
                 <li className="flex items-center gap-3 text-slate-500">
                   <X size={18} /> Keywords stuffing
                 </li>
                 <li className="flex items-center gap-3 text-slate-500">
                   <X size={18} /> Ignore brand sentiment
                 </li>
                 <li className="flex items-center gap-3 text-slate-500">
                   <X size={18} /> Traffic declines as AI answers increase
                 </li>
               </ul>
            </div>

            {/* New Way */}
            <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden transform md:-translate-y-4 border border-indigo-700">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
               <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-600 rounded-full blur-3xl opacity-50"></div>
               
               <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 <Bot size={20} className="text-indigo-300" /> ClinicBoost.AI (New Era)
               </h3>
               <ul className="space-y-4 relative z-10">
                 <li className="flex items-center gap-3 text-indigo-100">
                   <CheckCircle2 size={18} className="text-green-400" /> Be the distinct AI recommendation
                 </li>
                 <li className="flex items-center gap-3 text-indigo-100">
                   <CheckCircle2 size={18} className="text-green-400" /> Optimization for Natural Language
                 </li>
                 <li className="flex items-center gap-3 text-indigo-100">
                   <CheckCircle2 size={18} className="text-green-400" /> Track Brand Citations & Sentiment
                 </li>
                 <li className="flex items-center gap-3 text-indigo-100">
                   <CheckCircle2 size={18} className="text-green-400" /> Capture high-intent qualified leads
                 </li>
               </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Features (Bento Grid) --- */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
             <h2 className="text-3xl font-bold text-slate-900">Everything you need to dominate AI Search</h2>
             <p className="text-slate-500 mt-2 text-lg">A complete toolkit for modern medical marketing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Large */}
            <div className="md:col-span-2 bg-slate-50 rounded-3xl p-8 border border-slate-100 relative overflow-hidden hover:border-indigo-200 transition-colors group">
              <div className="relative z-10 max-w-md">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-6">
                   <Activity size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Real-Time Visibility Monitor</h3>
                <p className="text-slate-600">
                  Stop guessing. We track your "Share of Voice" across ChatGPT, Claude, and Perplexity for hundreds of medical keywords daily.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-48 bg-white rounded-tl-2xl border-t border-l border-slate-200 shadow-sm p-4 translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform">
                  {/* Mini Chart */}
                  <div className="flex items-end gap-2 h-full pb-2">
                     <div className="w-1/5 h-[40%] bg-slate-100 rounded-t-sm"></div>
                     <div className="w-1/5 h-[60%] bg-slate-200 rounded-t-sm"></div>
                     <div className="w-1/5 h-[50%] bg-slate-100 rounded-t-sm"></div>
                     <div className="w-1/5 h-[85%] bg-indigo-500 rounded-t-sm"></div>
                     <div className="w-1/5 h-[95%] bg-indigo-600 rounded-t-sm"></div>
                  </div>
              </div>
            </div>

            {/* Feature 2: Tall */}
            <div className="md:col-span-1 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shadow-sm mb-6">
                 <Search size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Keyword Explorer</h3>
              <p className="text-slate-600 text-sm mb-6">
                Discover the exact questions patients are asking AI. Find high-opportunity "long-tail" prompts that competitors ignore.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                   <div className="w-2 h-2 bg-green-500 rounded-full"></div> "cost of veneers nyc"
                </div>
                <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                   <div className="w-2 h-2 bg-green-500 rounded-full"></div> "pain free dentist near me"
                </div>
              </div>
            </div>

            {/* Feature 3: Standard */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-6">
                 <Globe size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Tech GEO Audit</h3>
               <p className="text-slate-600 text-sm">
                 Ensure your site is crawlable by LLMs. We check schema markup, `llms.txt`, and core web vitals specifically for AI bots.
               </p>
            </div>

            {/* Feature 4: Wide */}
            <div className="md:col-span-2 bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white shadow-sm mb-6">
                       <LayoutDashboard size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Competitive Intelligence</h3>
                    <p className="text-indigo-100">
                      See exactly who is being recommended instead of you, and why. Reverse engineer their AI strategy in one click.
                    </p>
                  </div>
                  <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                     <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold">Competitor Gap</span>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">-12%</span>
                     </div>
                     <div className="space-y-2">
                        <div className="h-2 bg-white/20 rounded-full w-full overflow-hidden">
                           <div className="h-full bg-white w-[70%]"></div>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full w-full overflow-hidden">
                           <div className="h-full bg-green-400 w-[82%]"></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] overflow-hidden relative text-center px-6 py-20 md:p-24 shadow-2xl">
          {/* Decorative Blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-40 translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              Ready to future-proof your <br/>patient acquisition?
            </h2>
            <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto">
              Join 500+ forward-thinking clinics monitoring their AI presence. Start your free visibility audit today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <Link 
                 href={pathsConfig.auth.signUp}
                 className="bg-white text-slate-900 px-10 py-4 rounded-xl text-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg hover:scale-105 transform duration-200"
               >
                 Start Free Trial
               </Link>
               <Link 
                 href={pathsConfig.marketing.pricing}
                 className="px-10 py-4 rounded-xl text-lg font-bold text-white border border-slate-700 hover:bg-slate-800 transition-colors"
               >
                 View Pricing
               </Link>
            </div>
            <p className="mt-8 text-sm text-slate-500">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Custom Animations Styles */}
      <style jsx>{`
        @keyframes scan-down {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-down {
          animation: scan-down 3s linear infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-y-5 {
          transform: rotateY(-5deg) rotateX(5deg);
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
