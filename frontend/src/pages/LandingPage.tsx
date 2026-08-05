import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, MapPin, BarChart3, Smartphone, 
  ArrowRight, CheckCircle2, Star, Zap, Cpu, Phone, Mail, X
} from 'lucide-react';
import logoImg from '../assets/maryland-logo.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setShowContact(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans selection:bg-red-500/30 text-slate-200">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white shadow-[0_0_15px_rgba(220,38,38,0.3)] overflow-hidden flex items-center justify-center p-1">
                <img src={logoImg} alt="Maryland Vending" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                Maryland Vending
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <a
                href="#features"
                className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all"
              >
                Features
              </a>
              <a
                href="#features"
                className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all"
              >
                Driver App
              </a>
              {/* Contact Support Dropdown */}
              <div className="relative" ref={contactRef}>
                <button
                  onClick={() => setShowContact(!showContact)}
                  className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
                >
                  Contact Support
                </button>

                <AnimatePresence>
                  {showContact && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-[#121827] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-white/5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Get in Touch</p>
                      </div>
                      <div className="p-3 space-y-1">
                        {/* Phone */}
                        <a
                          href="tel:+14437648363"
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-red-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Call us</p>
                            <p className="text-sm font-bold text-white">443-764-8363</p>
                          </div>
                        </a>
                        {/* Email — add here when ready */}
                        {/* 
                        <a
                          href="mailto:your@email.com"
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Email us</p>
                            <p className="text-sm font-bold text-white">your@email.com</p>
                          </div>
                        </a>
                        */}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="hidden md:block text-sm font-bold text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-red-600 to-amber-500 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                Launch Live App <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-red-500/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold mb-8 backdrop-blur-md">
              <Zap className="w-4 h-4 text-amber-400" /> Next-Gen Enterprise Vending Platform
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.2] mb-6">
              Automated Routes, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-amber-500">
                Smart Inventory & 
              </span><br />
              Maximum Revenue
            </h1>
            
            <p className="text-base lg:text-xl text-slate-400 max-w-2xl mx-auto font-medium mb-10 leading-relaxed">
              An all-in-one platform featuring AI route optimization, live machine telemetry, 
              and a powerful driver app to scale your vending business faster than ever.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-red-600 to-amber-500 text-white rounded-2xl text-lg font-bold shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-lg font-bold backdrop-blur-sm transition-all hover:border-white/20"
              >
                Explore Platform
              </button>
            </div>
            
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-amber-500"/> 99.9% Uptime SLA</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-amber-500"/> Enterprise Grade Security</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Advanced Dashboard Preview (Mockup Area) */}
      <section className="pb-24 relative z-10 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto rounded-3xl border border-white/10 bg-[#121827]/80 backdrop-blur-2xl shadow-[0_0_100px_rgba(220,38,38,0.15)] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="ml-4 text-xs font-mono text-slate-400">app.marylandvending.com/dashboard</div>
          </div>
          <div className="p-8 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <div className="h-32 rounded-2xl bg-gradient-to-br from-red-500/10 to-amber-500/5 border border-white/5 p-6 flex flex-col justify-center">
                <div className="text-slate-400 text-sm font-semibold mb-2">Total Revenue</div>
                <div className="text-4xl font-bold text-white">$124,500</div>
                <div className="text-emerald-400 text-sm mt-2 flex items-center gap-1"><ArrowRight className="w-4 h-4 -rotate-45" /> +14.5% this month</div>
              </div>
              <div className="h-32 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-6 flex flex-col justify-center">
                <div className="text-slate-400 text-sm font-semibold mb-2">Active Machines</div>
                <div className="text-4xl font-bold text-white">342</div>
                <div className="text-amber-400 text-sm mt-2">12 need refill</div>
              </div>
            </div>
            <div className="md:col-span-2 h-full rounded-2xl bg-white/5 border border-white/5 p-6 relative overflow-hidden">
              <div className="text-slate-300 font-semibold mb-6 flex justify-between items-center">
                <span>Live Route Tracking</span>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live
                </span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-red-500/10 to-transparent"></div>
              <div className="flex items-end gap-3 h-40 w-full px-4">
                {[40, 70, 45, 90, 65, 85, 120, 100, 140, 110, 160].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-red-600 to-amber-400 rounded-t-md opacity-80" style={{ height: `${h}px` }}></div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative border-t border-white/5 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-black text-white mb-6">Enterprise Capabilities</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to automate your operations and scale your vending business flawlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<MapPin className="w-8 h-8 text-red-500" />}
              title="AI Route Optimization"
              desc="Save fuel and time with dynamic routing algorithms that adapt to live traffic and machine inventory needs."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8 text-amber-500" />}
              title="Driver Mobile App"
              desc="Empower drivers with a sleek, offline-capable app for logging inventory, reporting issues, and checking in."
              delay={0.2}
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-red-400" />}
              title="Live Telemetry"
              desc="Get instant alerts for machine faults and track live sales data across your entire fleet from one dashboard."
              delay={0.3}
            />
            <FeatureCard 
              icon={<Cpu className="w-8 h-8 text-amber-400" />}
              title="Predictive Inventory"
              desc="Our AI predicts when a machine will run out of specific items, preventing stockouts and lost revenue."
              delay={0.4}
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-red-500" />}
              title="Multi-Tenant Architecture"
              desc="Secure portals with granular role-based access control for Admins, Supervisors, and Field Techs."
              delay={0.5}
            />
            <FeatureCard 
              icon={<Star className="w-8 h-8 text-amber-500" />}
              title="Advanced Analytics"
              desc="Generate detailed performance reports, revenue breakdowns, and profitability metrics with a single click."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060913] pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1">
                  <img src={logoImg} alt="Maryland Vending" className="w-full h-full object-contain" />
                </div>
                <span className="font-extrabold text-2xl text-white">Maryland Vending</span>
              </div>
              <p className="text-slate-400 max-w-sm mb-6 text-lg">
                The most advanced field operations and route management platform for the modern vending industry.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white text-lg mb-6">Platform</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#features" className="hover:text-red-400 transition-colors">Core Features</a></li>
                <li><a href="#solutions" className="hover:text-red-400 transition-colors">Driver App</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-lg mb-6">Company</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-red-400 transition-colors">About Us</a></li>
                <li><a href="tel:+14437648363" className="hover:text-red-400 transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-slate-500">
            &copy; {new Date().getFullYear()} Maryland Vending Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] hover:border-red-500/30 hover:shadow-[0_0_30px_rgba(220,38,38,0.1)] transition-all duration-300 group"
    >
      <div className="w-16 h-16 bg-[#121827] rounded-2xl border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-red-500/50 transition-transform duration-300 shadow-lg">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-lg">{desc}</p>
    </motion.div>
  );
}
