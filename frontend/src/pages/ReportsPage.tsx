import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  DownloadCloud, TrendingUp, DollarSign, Route, Users,
  CheckCircle2, XCircle, Clock, Star, Trophy, Target, Activity,
  ArrowUpRight, ArrowDownRight, Truck, MapPin, Zap, ChevronDown
} from "lucide-react";

import PageHeader from "../components/shared/PageHeader";
import { routesApi, usersApi } from "../services/api";
import { formatCurrency } from "../lib/utils";

// ─── Extended Data for Reports ─────────────────────────────────────────────────

const monthlyRevenueExtended = [
  { month: "Jan", revenue: 241000, target: 250000, lastYear: 198000 },
  { month: "Feb", revenue: 284000, target: 270000, lastYear: 220000 },
  { month: "Mar", revenue: 312000, target: 300000, lastYear: 248000 },
  { month: "Apr", revenue: 298000, target: 310000, lastYear: 260000 },
  { month: "May", revenue: 345000, target: 320000, lastYear: 282000 },
  { month: "Jun", revenue: 389000, target: 350000, lastYear: 310000 },
  { month: "Jul", revenue: 421000, target: 380000, lastYear: 340000 },
];

const revenueByCustomer = [
  { name: "Infosys Ltd", value: 238700, color: "#2563EB" },
  { name: "Phoenix Mills", value: 308700, color: "#10B981" },
  { name: "Reliance Ind.", value: 159300, color: "#F59E0B" },
  { name: "L&T Infra", value: 109300, color: "#8B5CF6" },
  { name: "Hiranandani", value: 84400, color: "#EF4444" },
];

const revenueByMachineType = [
  { type: "Coffee", revenue: 312000, stops: 48, avgPerStop: 6500 },
  { type: "Snack", revenue: 198000, stops: 62, avgPerStop: 3194 },
  { type: "Beverage", revenue: 145000, stops: 35, avgPerStop: 4143 },
  { type: "Combo", revenue: 228000, stops: 52, avgPerStop: 4385 },
];

const weeklyStopDetailed = [
  { day: "Mon", completed: 42, missed: 2, pending: 5, onTime: 38 },
  { day: "Tue", completed: 38, missed: 1, pending: 8, onTime: 35 },
  { day: "Wed", completed: 51, missed: 3, pending: 3, onTime: 46 },
  { day: "Thu", completed: 45, missed: 0, pending: 6, onTime: 44 },
  { day: "Fri", completed: 60, missed: 4, pending: 2, onTime: 55 },
  { day: "Sat", completed: 30, missed: 1, pending: 4, onTime: 29 },
  { day: "Sun", completed: 20, missed: 0, pending: 2, onTime: 20 },
];

const driverPerformanceData = [
  { name: "Arjun Sharma", routes: 312, stops: 2840, rating: 4.8, onTime: 96, revenue: 89400, color: "#2563EB" },
  { name: "Priya Patel",  routes: 278, stops: 2511, rating: 4.9, onTime: 98, revenue: 82100, color: "#10B981" },
  { name: "Sneha Joshi",  routes: 401, stops: 3620, rating: 4.7, onTime: 94, revenue: 112000, color: "#8B5CF6" },
  { name: "Rahul Verma",  routes: 195, stops: 1780, rating: 4.5, onTime: 90, revenue: 64200, color: "#F59E0B" },
  { name: "Karan Mehta",  routes: 167, stops: 1540, rating: 4.6, onTime: 92, revenue: 55800, color: "#EC4899" },
  { name: "Dev Singh",    routes: 98,  stops: 890,  rating: 4.3, onTime: 88, revenue: 31200, color: "#64748B" },
];

const radarData = [
  { metric: "On-Time", Arjun: 96, Priya: 98, Sneha: 94, Rahul: 90 },
  { metric: "Revenue", Arjun: 88, Priya: 81, Sneha: 100, Rahul: 63 },
  { metric: "Stops",   Arjun: 94, Priya: 84, Sneha: 100, Rahul: 59 },
  { metric: "Rating",  Arjun: 96, Priya: 98, Sneha: 94, Rahul: 90 },
  { metric: "Routes",  Arjun: 78, Priya: 69, Sneha: 100, Rahul: 49 },
];

const locationRankings: any[] = [];

const fuelCostData = [
  { month: "Feb", liters: 290, cost: 26100 },
  { month: "Mar", liters: 350, cost: 31500 },
  { month: "Apr", liters: 310, cost: 27900 },
  { month: "May", liters: 380, cost: 34200 },
  { month: "Jun", liters: 410, cost: 36900 },
  { month: "Jul", liters: 445, cost: 40050 },
];

// ─── Tab Definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "revenue",     label: "Revenue",     icon: DollarSign },
  { id: "routes",      label: "Routes",      icon: Route },
  { id: "stops",       label: "Stops",       icon: MapPin },
  { id: "drivers",     label: "Drivers",     icon: Users },
  { id: "vehicles",    label: "Vehicles",    icon: Truck },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, trend, color, icon: Icon, delay = 0,
}: {
  label: string; value: string; sub?: string;
  trend?: { pct: string; up: boolean };
  color: string; icon: any; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card rounded-xl border border-border shadow-sm p-5 flex items-start gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
            {trend.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.pct} vs last month
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Chart Card Wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, sub, children, className = "" }: {
  title: string; sub?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-card rounded-xl border border-border shadow-sm p-6 ${className}`}>
      <SectionHeader title={title} sub={sub} />
      {children}
    </div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltipStyle = {
  fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff",
};

// ─── Revenue Tab ──────────────────────────────────────────────────────────────
function RevenueTab() {
  const totalRev = monthlyRevenueExtended.reduce((s, d) => s + d.revenue, 0);
  const totalTarget = monthlyRevenueExtended.reduce((s, d) => s + d.target, 0);
  const lastYearTotal = monthlyRevenueExtended.reduce((s, d) => s + d.lastYear, 0);
  const growth = (((totalRev - lastYearTotal) / lastYearTotal) * 100).toFixed(1);
  const attainment = ((totalRev / totalTarget) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue (YTD)" value={formatCurrency(totalRev)} trend={{ pct: `+${growth}%`, up: true }} color="bg-primary-600" icon={DollarSign} delay={0} />
        <KpiCard label="Monthly Avg" value={formatCurrency(Math.round(totalRev / 7))} sub="Last 7 months" color="bg-emerald-500" icon={TrendingUp} delay={0.05} />
        <KpiCard label="Target Attainment" value={`${attainment}%`} sub={`Target: ${formatCurrency(totalTarget)}`} trend={{ pct: "+3.2%", up: true }} color="bg-violet-500" icon={Target} delay={0.1} />
        <KpiCard label="Best Month" value="July 2026" sub={formatCurrency(421000)} color="bg-amber-500" icon={Trophy} delay={0.15} />
      </div>

      {/* Revenue Area Chart */}
      <ChartCard title="Monthly Revenue vs Target vs Last Year" sub="Area trend with year-over-year comparison">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyRevenueExtended}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={CustomTooltipStyle} formatter={(val) => [formatCurrency(Number(val)), ""]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="lastYear" stroke="#10B981" strokeWidth={2} fill="url(#lyGrad)" name="Last Year" strokeDasharray="5 5" />
            <Area type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={1.5} fill="none" name="Target" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Revenue Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Customer */}
        <ChartCard title="Revenue by Customer" sub="Top 5 corporate accounts">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={revenueByCustomer} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                {revenueByCustomer.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={CustomTooltipStyle} formatter={(val) => [formatCurrency(Number(val)), "Revenue"]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* By Machine Type */}
        <ChartCard title="Revenue by Machine Type" sub="Avg revenue per stop included">
          <div className="space-y-3 mt-2">
            {revenueByMachineType.map((d, i) => {
              const max = Math.max(...revenueByMachineType.map(x => x.revenue));
              const pct = (d.revenue / max) * 100;
              const colors = ["bg-primary-600", "bg-emerald-500", "bg-amber-500", "bg-violet-500"];
              return (
                <div key={d.type}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{d.type}</span>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>{d.stops} stops</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(d.revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={`h-full rounded-full ${colors[i]}`}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Avg {formatCurrency(d.avgPerStop)} / stop</p>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Top Locations Table */}
      <ChartCard title="Top Revenue Locations" sub="Ranked by total lifetime revenue">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4">#</th>
                <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4">Location</th>
                <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4">Machine</th>
                <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4">Frequency</th>
                <th className="text-right text-xs font-semibold text-slate-500 pb-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {locationRankings.map((loc, i) => (
                <tr key={loc.id} className="border-b border-border/50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-bold ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-slate-400"}`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-900 text-xs">{loc.customerName}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[160px]">{loc.address}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{loc.machineType}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-600">{loc.visitFrequency}</td>
                  <td className="py-3 text-right font-bold text-slate-900 text-sm">{formatCurrency(loc.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Routes Tab ────────────────────────────────────────────────────────────────
function RoutesTab({ routes, drivers }: { routes: any[]; drivers: any[] }) {
  const total = routes.length;
  const completed = routes.filter(r => r.status === "COMPLETED").length;
  const active = routes.filter(r => r.status === "IN_PROGRESS").length;
  const scheduled = routes.filter(r => r.status === "PENDING").length;
  const totalKm = routes.reduce((s, r) => s + (r.totalDistance || 0), 0);
  const routesWithTime = routes.filter(r => r.actualTime && r.estimatedTime);
  const avgTime = routesWithTime.length > 0
    ? routesWithTime.reduce((s, r) => s + (r.actualTime || 0), 0) / routesWithTime.length
    : 0;

  const statusPie = [
    { name: "Completed", value: completed, fill: "#10B981" },
    { name: "Active", value: active, fill: "#2563EB" },
    { name: "Scheduled", value: scheduled, fill: "#64748B" },
  ];

  const routeTimingData = routes
    .filter(r => r.estimatedTime && r.actualTime)
    .slice(0, 8)
    .map(r => ({
      name: r.name.split(" ").slice(0, 2).join(" "),
      estimated: r.estimatedTime,
      actual: r.actualTime,
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Routes" value={String(total)} color="bg-primary-600" icon={Route} delay={0} />
        <KpiCard label="Completed" value={String(completed)} trend={{ pct: `${total > 0 ? Math.round((completed/total)*100) : 0}%`, up: true }} color="bg-emerald-500" icon={CheckCircle2} delay={0.05} />
        <KpiCard label="Total Distance" value={`${totalKm.toFixed(1)} km`} sub="This period" color="bg-amber-500" icon={Activity} delay={0.1} />
        <KpiCard label="Avg Duration" value={avgTime > 0 ? `${Math.round(avgTime)} min` : "N/A"} sub="Completed routes" color="bg-violet-500" icon={Clock} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Route Status Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusPie} cx="50%" cy="50%" innerRadius={70} outerRadius={105} dataKey="value" paddingAngle={4} label={({ name, value }) => `${name}: ${value}`}>
                {statusPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={CustomTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Estimated vs Actual Duration" sub="Minutes per route">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={routeTimingData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} unit=" min" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={CustomTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="estimated" fill="#E2E8F0" radius={[0, 4, 4, 0]} name="Estimated" />
              <Bar dataKey="actual" fill="#2563EB" radius={[0, 4, 4, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Route Detail Table */}
      <ChartCard title="All Routes Summary">
        <div className="overflow-x-auto">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Route", "Date", "Driver", "Distance", "Stops", "Est. Time", "Actual Time", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-xs">No routes found.</td></tr>
              ) : routes.map(r => {
                const driver = drivers.find((d: any) => d.id === r.driverId) || r.driver;
                const driverName = driver?.name || r.driver?.name || 'Unknown';
                const driverAvatar = driver?.photo || driver?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=3B82F6&color=fff&size=24`;
                const statusConfig: Record<string, { label: string; cls: string }> = {
                  IN_PROGRESS: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
                  COMPLETED:   { label: "Completed", cls: "bg-slate-100 text-slate-700" },
                  PENDING:     { label: "Scheduled", cls: "bg-blue-100 text-blue-700" },
                  CANCELLED:   { label: "Cancelled", cls: "bg-red-100 text-red-700" },
                };
                const sc = statusConfig[r.status] || statusConfig.PENDING;
                return (
                  <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-900 text-xs">{r.name}</td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{r.date}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <img src={driverAvatar} alt="" className="w-6 h-6 rounded-full bg-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                        <span className="text-xs text-slate-700">{driverName.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600">{r.totalDistance || 0} km</td>
                    <td className="py-3 pr-4 text-xs text-slate-600">{Array.isArray(r.stops) ? r.stops.length : 0} stops</td>
                    <td className="py-3 pr-4 text-xs text-slate-600">{r.estimatedTime || '—'} {r.estimatedTime ? 'min' : ''}</td>
                    <td className="py-3 pr-4 text-xs text-slate-600">{r.actualTime ? `${r.actualTime} min` : "—"}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Stops Tab ────────────────────────────────────────────────────────────────
function StopsTab() {
  const totalStops = weeklyStopDetailed.reduce((s, d) => s + d.completed + d.missed + d.pending, 0);
  const totalCompleted = weeklyStopDetailed.reduce((s, d) => s + d.completed, 0);
  const totalMissed = weeklyStopDetailed.reduce((s, d) => s + d.missed, 0);
  const totalOnTime = weeklyStopDetailed.reduce((s, d) => s + d.onTime, 0);
  const completionRate = ((totalCompleted / (totalCompleted + totalMissed)) * 100).toFixed(1);
  const onTimeRate = ((totalOnTime / totalCompleted) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Stops" value={String(totalStops)} color="bg-primary-600" icon={MapPin} delay={0} />
        <KpiCard label="Completed" value={String(totalCompleted)} trend={{ pct: `${completionRate}%`, up: true }} color="bg-emerald-500" icon={CheckCircle2} delay={0.05} />
        <KpiCard label="Missed" value={String(totalMissed)} trend={{ pct: `${((totalMissed/totalStops)*100).toFixed(1)}%`, up: false }} color="bg-red-500" icon={XCircle} delay={0.1} />
        <KpiCard label="On-Time Rate" value={`${onTimeRate}%`} sub="of completed stops" color="bg-amber-500" icon={Clock} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily Stop Completion" sub="Completed, Missed, Pending by day">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyStopDetailed}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CustomTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} name="Completed" />
              <Bar dataKey="missed" stackId="a" fill="#EF4444" name="Missed" />
              <Bar dataKey="pending" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="On-Time vs Completed" sub="On-time performance trend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyStopDetailed}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CustomTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="completed" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} name="Completed" />
              <Line type="monotone" dataKey="onTime" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} name="On-Time" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="missed" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} name="Missed" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Stop Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Completion Rate", value: `${completionRate}%`, desc: `${totalCompleted} of ${totalCompleted + totalMissed} stops`, color: "border-l-emerald-500" },
          { label: "On-Time Delivery", value: `${onTimeRate}%`, desc: `${totalOnTime} on-time arrivals`, color: "border-l-blue-500" },
          { label: "Miss Rate", value: `${((totalMissed / totalStops) * 100).toFixed(1)}%`, desc: `${totalMissed} stops missed this week`, color: "border-l-red-500" },
        ].map(card => (
          <div key={card.label} className={`bg-card rounded-xl border border-border border-l-4 ${card.color} p-5 shadow-sm`}>
            <p className="text-xs text-slate-500 font-medium">{card.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Drivers Tab ───────────────────────────────────────────────────────────────
function DriversTab() {
  const [metric, setMetric] = useState<"routes" | "stops" | "revenue" | "rating">("revenue");

  const metrics = [
    { key: "revenue" as const, label: "Revenue" },
    { key: "routes"  as const, label: "Routes" },
    { key: "stops"   as const, label: "Stops" },
    { key: "rating"  as const, label: "Rating" },
  ];

  const sorted = [...driverPerformanceData].sort((a, b) => b[metric] - a[metric]);

  const formatMetric = (val: number, key: string) => {
    if (key === "revenue") return formatCurrency(val);
    if (key === "rating") return val.toFixed(1);
    return String(val);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Drivers" value={String(driverPerformanceData.length)} color="bg-primary-600" icon={Users} delay={0} />
        <KpiCard label="Avg Rating" value={(driverPerformanceData.reduce((s, d) => s + d.rating, 0) / driverPerformanceData.length).toFixed(2)} sub="Fleet average" color="bg-amber-500" icon={Star} delay={0.05} />
        <KpiCard label="Total Stops Done" value={driverPerformanceData.reduce((s, d) => s + d.stops, 0).toLocaleString()} color="bg-emerald-500" icon={CheckCircle2} delay={0.1} />
        <KpiCard label="Top Earner" value="Sneha Joshi" sub={formatCurrency(112000)} color="bg-violet-500" icon={Trophy} delay={0.15} />
      </div>

      {/* Leaderboard */}
      <ChartCard title="Driver Leaderboard" sub="Ranked by selected metric">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-5">
          {metrics.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${metric === m.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {sorted.map((driver, i) => {
            const maxVal = sorted[0][metric];
            const pct = (driver[metric] / maxVal) * 100;
            return (
              <div key={driver.name} className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 w-4 flex-shrink-0">#{i + 1}</span>
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=${driver.color.replace("#", "")}&color=fff&size=32`} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 truncate">{driver.name}</span>
                    <span className="text-xs font-bold text-slate-900 ml-2 whitespace-nowrap">
                      {formatMetric(driver[metric], metric)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: driver.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Driver Radar Comparison" sub="Top 4 drivers across key metrics">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#64748B" }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Arjun" dataKey="Arjun" stroke="#2563EB" fill="#2563EB" fillOpacity={0.1} />
              <Radar name="Priya" dataKey="Priya" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
              <Radar name="Sneha" dataKey="Sneha" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} />
              <Radar name="Rahul" dataKey="Rahul" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={CustomTooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Stats Table */}
        <ChartCard title="Full Driver Statistics">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Driver", "Routes", "Stops", "Rating", "On-Time"].map(h => (
                    <th key={h} className="text-left font-semibold text-slate-500 pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {driverPerformanceData.map(d => (
                  <tr key={d.name} className="border-b border-border/50 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="font-medium text-slate-800 whitespace-nowrap">{d.name.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">{d.routes}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{d.stops.toLocaleString()}</td>
                    <td className="py-2.5 pr-3">
                      <span className="font-bold text-amber-600">★ {d.rating}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`font-semibold ${d.onTime >= 95 ? "text-emerald-600" : d.onTime >= 90 ? "text-blue-600" : "text-amber-600"}`}>
                        {d.onTime}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Vehicles Tab ─────────────────────────────────────────────────────────────
function VehiclesTab() {
  const avgFuel = 445; // July liters
  const totalFuelCost = fuelCostData.reduce((s, d) => s + d.cost, 0);
  const avgMonthlyCost = Math.round(totalFuelCost / fuelCostData.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Fleet Size" value="6 vehicles" sub="4 active today" color="bg-primary-600" icon={Truck} delay={0} />
        <KpiCard label="Total Fuel (Jul)" value={`${avgFuel}L`} trend={{ pct: "+8.5%", up: false }} color="bg-amber-500" icon={Zap} delay={0.05} />
        <KpiCard label="Monthly Fuel Cost" value={formatCurrency(avgMonthlyCost)} sub="Rolling avg" color="bg-red-500" icon={DollarSign} delay={0.1} />
        <KpiCard label="Maintenance Due" value="2 vehicles" sub="Within 30 days" color="bg-violet-500" icon={Activity} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Fuel Consumption" sub="Liters used per month">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={fuelCostData}>
              <defs>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} unit="L" />
              <Tooltip contentStyle={CustomTooltipStyle} />
              <Area type="monotone" dataKey="liters" stroke="#F59E0B" strokeWidth={2.5} fill="url(#fuelGrad)" name="Liters" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Fuel Cost (₹)" sub="Expenditure trend">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={fuelCostData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CustomTooltipStyle} formatter={(v) => [formatCurrency(Number(v)), "Fuel Cost"]} />
              <Bar dataKey="cost" fill="#2563EB" radius={[4, 4, 0, 0]} name="Fuel Cost" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Vehicle Status Table */}
      <ChartCard title="Fleet Health Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "MH-01-AB-1234", type: "Tata Ace", fuel: 72, status: "Active", maint: "2026-10-01", ok: true },
            { name: "MH-01-CD-5678", type: "Force Traveller", fuel: 45, status: "Active", maint: "2026-08-20", ok: true },
            { name: "MH-03-GH-3456", type: "Maruti Eeco", fuel: 18, status: "Active", maint: "2026-09-15", ok: false },
            { name: "MH-04-JK-7890", type: "Mahindra Bolero", fuel: 61, status: "Active", maint: "2026-11-05", ok: true },
            { name: "MH-02-EF-2345", type: "Tata Ace Gold", fuel: 0, status: "In Service", maint: "2026-08-01", ok: false },
            { name: "MH-05-LM-4567", type: "Force Traveller", fuel: 88, status: "Idle", maint: "2026-12-01", ok: true },
          ].map(v => (
            <div key={v.name} className={`rounded-lg border p-4 ${!v.ok ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-800">{v.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  v.status === "Active" ? "bg-emerald-100 text-emerald-700"
                  : v.status === "In Service" ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600"
                }`}>{v.status}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{v.type}</p>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">Fuel</span>
                <span className={`font-semibold ${v.fuel < 25 ? "text-red-600" : "text-slate-700"}`}>{v.fuel}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                <div
                  className={`h-full rounded-full transition-all ${v.fuel > 50 ? "bg-emerald-500" : v.fuel > 20 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${v.fuel}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">Maintenance: {v.maint}</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("revenue");
  const [dateRange, setDateRange] = useState("This Month");

  // Real API data
  const [routes, setRoutes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    routesApi.getAll().then(res => { if (res.success) setRoutes(res.data); }).catch(() => {});
    usersApi.getAll("driver").then(res => { if (res.success) setDrivers(res.data); }).catch(() => {});
  }, []);

  const handleExport = () => {
    alert("Exporting report as PDF… (demo)");
  };

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Reports & Analytics"
        description="Business intelligence across revenue, routes, stops, drivers, and fleet operations."
        action={
          <div className="flex items-center gap-2">
            {/* Date Range */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-medium border border-border rounded-lg bg-card text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600/20 cursor-pointer"
              >
                {["Today", "This Week", "This Month", "Last Quarter", "This Year"].map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors px-4 py-2 rounded-lg"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              Export PDF
            </button>
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Summary Banner */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-primary-600 to-blue-500 rounded-xl p-5 text-white flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-semibold opacity-90">{currentTab?.label} Overview — {dateRange}</p>
          <p className="text-xs opacity-70 mt-0.5">Showing aggregated data. Last refreshed: Just now.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-px h-10 bg-white/20" />
          <div className="text-right">
            <p className="text-2xl font-bold">
              {activeTab === "revenue" && formatCurrency(2049000)}
              {activeTab === "routes"  && `${routes.length} Routes`}
              {activeTab === "stops"   && "Live Stops"}
              {activeTab === "drivers" && `${drivers.length} Drivers`}
              {activeTab === "vehicles" && "Fleet"}
            </p>
            <p className="text-xs opacity-70">Total this period</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "revenue"  && <RevenueTab />}
          {activeTab === "routes"   && <RoutesTab routes={routes} drivers={drivers} />}
          {activeTab === "stops"    && <StopsTab />}
          {activeTab === "drivers"  && <DriversTab />}
          {activeTab === "vehicles" && <VehiclesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
