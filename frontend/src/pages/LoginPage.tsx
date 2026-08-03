import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Route, Camera, BarChart3, ShieldCheck, Mail, Lock,
  Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Building2, Truck
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types";
import brandLogo from "../assets/maryland-logo.png";

// roles constant removed since role dropdown is removed

const demoCredentials: { role: UserRole; label: string; email: string; color: string; bg: string; border: string }[] = [
  { role: "superadmin", label: "Super Admin", email: "admin@vendroute.in", color: "text-blue-600", bg: "bg-blue-50/80", border: "border-blue-200/60" },
  { role: "supervisor", label: "Supervisor", email: "manager@vendroute.in", color: "text-emerald-600", bg: "bg-emerald-50/80", border: "border-emerald-200/60" },
  { role: "driver", label: "Driver", email: "driver@vendroute.in", color: "text-purple-600", bg: "bg-purple-50/80", border: "border-purple-200/60" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("admin@vendroute.in");
  const [password, setPassword] = useState("password");
  const [role, setRole] = useState<UserRole>("superadmin");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const ok = login(email, password, role);
    if (ok) navigate("/dashboard");
    else {
      setError("Invalid credentials. Try the demo accounts below.");
      setLoading(false);
    }
  };

  const handleDemoSelect = (c: typeof demoCredentials[0]) => {
    setEmail(c.email);
    setPassword("password");
    setRole(c.role);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 lg:p-8 font-sans">
      {/* Outer Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[700px]"
      >
        {/* ── LEFT PANEL (Dark Blue Landing Banner) ───────────────────────── */}
        <div className="lg:col-span-6 bg-[#0B1536] p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Background Grid Pattern & Isometric Highlights */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Brand Logo + Security Badge */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white shadow-lg shadow-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
                <img src={brandLogo} alt="Maryland Vending Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                  Maryland Vending
                </h1>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                  Field Operations Management Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-md text-xs font-medium text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Secure & Reliable</span>
            </div>
          </div>

          {/* Middle Content: Heading + Paragraph + Features List + Isometric Art */}
          <div className="my-8 z-10 space-y-6">
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Smarter Routes. <br />
                Better Operations. <br />
                <span className="text-blue-400">Stronger Business.</span>
              </h2>
              <p className="text-slate-300 text-xs lg:text-sm mt-3 leading-relaxed max-w-lg">
                Manage vending machines, routes, drivers and field operations in real-time.
                Increase efficiency, ensure accountability and grow your business.
              </p>
            </div>

            {/* 4 Feature Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {[
                { icon: MapPin, title: "Live Tracking", desc: "Track drivers and routes in real-time" },
                { icon: Route, title: "Route Management", desc: "Optimize routes and assign with ease" },
                { icon: Camera, title: "Proof of Service", desc: "Capture photos and service details" },
                { icon: BarChart3, title: "Reports & Insights", desc: "Get actionable reports and analytics" },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/60 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                    <feat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{feat.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Isometric Visual Graphic Component */}
            <div className="relative w-full h-36 bg-gradient-to-r from-blue-950/40 to-slate-900/40 rounded-2xl border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
              {/* Animated Road Line */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120" fill="none">
                <path d="M 20 100 Q 150 20 250 80 T 380 30" stroke="#2563EB" strokeWidth="3" strokeDasharray="6 6" className="animate-pulse" />
                <path d="M 20 100 Q 150 20 250 80 T 380 30" stroke="#3B82F6" strokeWidth="1.5" />
              </svg>

              {/* Truck Icon on Map */}
              <motion.div
                animate={{ x: [0, 120, 240, 0], y: [0, -30, 0, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute z-10 bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/50 flex items-center gap-1 text-xs font-bold"
              >
                <Truck className="w-4 h-4" />
                <span className="text-[10px]">MH-01-AB</span>
              </motion.div>

              {/* Isometric Buildings & Pins */}
              <div className="absolute left-8 bottom-3 flex items-center gap-1 text-[11px] bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>HQ Hub</span>
              </div>

              <div className="absolute right-12 top-4 flex items-center gap-1 text-[11px] bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vending Stop</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Stats Bar + Copyright */}
          <div className="z-10 space-y-4">
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-3.5 grid grid-cols-3 divide-x divide-slate-700/60 text-center">
              <div className="px-2">
                <p className="text-base lg:text-lg font-extrabold text-white">2,500+</p>
                <p className="text-[10px] text-slate-400 font-medium">Active Drivers</p>
              </div>
              <div className="px-2">
                <p className="text-base lg:text-lg font-extrabold text-white">15,000+</p>
                <p className="text-[10px] text-slate-400 font-medium">Routes Done</p>
              </div>
              <div className="px-2">
                <p className="text-base lg:text-lg font-extrabold text-white">99.9%</p>
                <p className="text-[10px] text-slate-400 font-medium">System Uptime</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              © 2026 Maryland Vending Service. All rights reserved.
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL (White Form Container) ─────────────────────────── */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            {/* Form Title Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome <span className="text-blue-600">Back!</span>
                </h2>
                <p className="text-xs lg:text-sm text-slate-500 mt-1 font-medium">
                  Sign in to your VendRoute account
                </p>
              </div>
              <button 
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:shadow-sm rounded-lg transition-all border border-blue-100"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Hidden Role Input */}
              <input type="hidden" name="role" value={role} />

              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-9 pr-4 py-2.5 text-xs lg:text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-slate-800 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-xs lg:text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-slate-800 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="font-semibold text-blue-600 hover:underline">
                  Forgot password?
                </button>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl font-medium">
                  {error}
                </motion.p>
              )}

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-semibold uppercase">or</span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-2.5 text-xs shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </button>

            {/* Demo Accounts Section */}
            <div className="pt-3">
              <p className="text-[11px] font-semibold text-slate-400 text-center mb-2.5 uppercase tracking-wider">
                Demo Accounts
              </p>
              <div className="grid grid-cols-3 gap-2">
                {demoCredentials.map((c) => (
                  <button
                    key={c.role}
                    type="button"
                    onClick={() => handleDemoSelect(c)}
                    className={`p-2.5 rounded-xl border ${c.bg} ${c.border} hover:opacity-90 transition-all text-left group cursor-pointer`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <ShieldCheck className={`w-3 h-3 ${c.color}`} />
                      <span className={`text-[11px] font-bold ${c.color}`}>{c.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate font-medium">{c.email}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Contact Note */}
            <p className="text-center text-xs text-slate-500 pt-2 font-medium">
              New to VendRoute?{" "}
              <button type="button" onClick={() => alert("Please contact system admin at admin@vendroute.in")} className="text-blue-600 font-bold hover:underline">
                Contact Administrator
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
