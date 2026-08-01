import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Route, Camera, BarChart3, ShieldCheck, Mail, Lock,
  Eye, EyeOff, Loader2, ArrowRight, Building2, Truck
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const demoCredentials = [
  { label: "Admin User", email: "admin@vendroute.com", password: "password123", color: "text-blue-600", bg: "bg-blue-50/80", border: "border-blue-200/60" },
  { label: "Driver User", email: "driver@vendroute.com", password: "password123", color: "text-emerald-600", bg: "bg-emerald-50/80", border: "border-emerald-200/60" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("admin@vendroute.com");
  const [password, setPassword] = useState("password123");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        navigate("/dashboard");
      } else {
        setError("Invalid email or password.");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Ensure backend is running on http://localhost:5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (c: typeof demoCredentials[0]) => {
    setEmail(c.email);
    setPassword(c.password);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 lg:p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[700px]"
      >
        {/* ── LEFT PANEL (Dark Blue Banner) ───────────────────────── */}
        <div className="lg:col-span-6 bg-[#0B1536] p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/40">
                <Route className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                  Vend<span className="text-blue-400">Route</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                  Field Operations Management Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-md text-xs font-medium text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Live Database Connected</span>
            </div>
          </div>

          <div className="my-8 z-10 space-y-6">
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Smarter Routes. <br />
                Better Operations. <br />
                <span className="text-blue-400">Stronger Business.</span>
              </h2>
              <p className="text-slate-300 text-xs lg:text-sm mt-3 leading-relaxed max-w-lg">
                Manage vending machines, routes, drivers and field operations in real-time with MySQL Database.
              </p>
            </div>

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

            <div className="relative w-full h-36 bg-gradient-to-r from-blue-950/40 to-slate-900/40 rounded-2xl border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120" fill="none">
                <path d="M 20 100 Q 150 20 250 80 T 380 30" stroke="#2563EB" strokeWidth="3" strokeDasharray="6 6" className="animate-pulse" />
                <path d="M 20 100 Q 150 20 250 80 T 380 30" stroke="#3B82F6" strokeWidth="1.5" />
              </svg>

              <motion.div
                animate={{ x: [0, 120, 240, 0], y: [0, -30, 0, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute z-10 bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/50 flex items-center gap-1 text-xs font-bold"
              >
                <Truck className="w-4 h-4" />
                <span className="text-[10px]">UP-16-AB-2026</span>
              </motion.div>

              <div className="absolute left-8 bottom-3 flex items-center gap-1 text-[11px] bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Noida Hub</span>
              </div>

              <div className="absolute right-12 top-4 flex items-center gap-1 text-[11px] bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Metro Hospital</span>
              </div>
            </div>
          </div>

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
              © 2026 VendRoute Technologies Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL (Form Container) ─────────────────────────── */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome <span className="text-blue-600">Back!</span>
              </h2>
              <p className="text-xs lg:text-sm text-slate-500 mt-1 font-medium">
                Sign in to your VendRoute account (MySQL Connected)
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating DB...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="pt-3">
              <p className="text-[11px] font-semibold text-slate-400 text-center mb-2.5 uppercase tracking-wider">
                Database Seeded Accounts
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoCredentials.map((c, i) => (
                  <button
                    key={i}
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
          </div>
        </div>
      </motion.div>
    </div>
  );
}
