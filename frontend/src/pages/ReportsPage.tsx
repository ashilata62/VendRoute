import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  DownloadCloud, TrendingUp, DollarSign, Route, Users,
  CheckCircle2, Clock, Trophy, Target, Activity,
  Truck, MapPin, Zap, ChevronDown, ArrowUpRight, ArrowDownRight, Star
} from "lucide-react";

import PageHeader from "../components/shared/PageHeader";
import { routesApi, usersApi, reportsApi, stopsApi, vehiclesApi } from "../services/api";
import { formatCurrency } from "../lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// ─── Revenue Tab (Real Backend Data) ─────────────────────────────────────────
function RevenueTab({ routes, stops }: { routes: any[]; stops: any[] }) {
  const totalCash = stops.reduce((s, stop) => s + (stop.cashCollected || 0), 0);
  const completedRoutes = routes.filter(r => r.status === "COMPLETED").length;
  const completedStops = stops.filter(s => s.status === "COMPLETED").length;
  const avgPerStop = completedStops > 0 ? totalCash / completedStops : 0;

  // Group cash collected by date for a chart
  const byDate: Record<string, number> = {};
  stops.forEach(s => {
    if (s.status === "COMPLETED" && s.cashCollected > 0) {
      const dt = s.route?.date || new Date().toISOString().split("T")[0];
      byDate[dt] = (byDate[dt] || 0) + (s.cashCollected || 0);
    }
  });
  const revenueByDate = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([date, cash]) => ({ date: date.slice(5), cash })); // show MM-DD

  // Cash by route
  const cashByRoute = routes
    .map(r => ({
      name: r.name?.split(" ").slice(0, 2).join(" ") || "Route",
      cash: (r.stops || []).reduce((s: number, stop: any) => s + (stop.cashCollected || 0), 0),
    }))
    .filter(r => r.cash > 0)
    .sort((a, b) => b.cash - a.cash)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Cash Collected" value={formatCurrency(totalCash)} sub="From completed stops" color="bg-primary-600" icon={DollarSign} delay={0} />
        <KpiCard label="Avg Per Stop" value={formatCurrency(Math.round(avgPerStop))} sub={`${completedStops} completed stops`} color="bg-emerald-500" icon={TrendingUp} delay={0.05} />
        <KpiCard label="Completed Routes" value={String(completedRoutes)} sub="With cash data" color="bg-violet-500" icon={Target} delay={0.1} />
        <KpiCard label="Total Stops" value={String(stops.length)} sub="Across all routes" color="bg-amber-500" icon={Trophy} delay={0.15} />
      </div>

      {/* Revenue by Date Chart */}
      {revenueByDate.length > 0 ? (
        <ChartCard title="Cash Collected by Date" sub="Revenue trend from completed stops">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueByDate}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CustomTooltipStyle} formatter={(val) => [formatCurrency(Number(val)), "Cash"]} />
              <Area type="monotone" dataKey="cash" stroke="#2563EB" strokeWidth={2.5} fill="url(#revGrad)" name="Cash Collected" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No cash collection data yet</p>
          <p className="text-xs text-slate-400 mt-1">Complete stops with cash collection to see revenue charts here.</p>
        </div>
      )}

      {/* Cash by Route */}
      {cashByRoute.length > 0 && (
        <ChartCard title="Cash Collected by Route" sub="Top routes by cash collected">
          <div className="space-y-3 mt-2">
            {cashByRoute.map((r, i) => {
              const max = cashByRoute[0]?.cash || 1;
              const pct = (r.cash / max) * 100;
              const colors = ["bg-primary-600", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-pink-500", "bg-cyan-500"];
              return (
                <div key={r.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{r.name}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(r.cash)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={`h-full rounded-full ${colors[i % colors.length]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}
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
    .filter(r => r.estimatedTime)
    .slice(0, 8)
    .map(r => ({
      name: r.name.split(" ").slice(0, 2).join(" "),
      estimated: r.estimatedTime,
      actual: r.actualTime || 0,
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

// ─── Stops Tab (Real Backend Data) ───────────────────────────────────────────
function StopsTab({ stats }: { stats: any }) {
  const totalCompleted = stats?.stops?.completed ?? 0;
  const totalAll = stats?.stops?.total ?? 0;
  const totalPending = stats?.stops?.pending ?? 0;
  const totalMissed = 0; // skipped stops - not tracked separately yet
  const completionRate = totalAll > 0 ? ((totalCompleted / totalAll) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Stops" value={String(totalAll)} color="bg-primary-600" icon={MapPin} delay={0} />
        <KpiCard label="Completed" value={String(totalCompleted)} trend={{ pct: `${completionRate}%`, up: true }} color="bg-emerald-500" icon={CheckCircle2} delay={0.05} />
        <KpiCard label="Pending" value={String(totalPending)} color="bg-amber-500" icon={Clock} delay={0.1} />
        <KpiCard label="Completion Rate" value={`${completionRate}%`} sub="of all stops" color="bg-violet-500" icon={Target} delay={0.15} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Completion Rate", value: `${completionRate}%`, desc: `${totalCompleted} of ${totalAll} stops`, color: "border-l-emerald-500" },
          { label: "Total Stops Managed", value: String(totalAll), desc: `${totalPending} pending today`, color: "border-l-blue-500" },
          { label: "Completed Stops", value: String(totalCompleted), desc: `Live from backend DB`, color: "border-l-violet-500" },
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


// ─── Drivers Tab (Real API Data) ──────────────────────────────────────────────
function DriversTab({ drivers, routes }: { drivers: any[]; routes: any[] }) {
  const [metric, setMetric] = useState<"routes" | "stops" | "rating">("routes");

  const metrics = [
    { key: "routes"  as const, label: "Routes" },
    { key: "stops"   as const, label: "Stops" },
    { key: "rating"  as const, label: "Rating" },
  ];

  const COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#64748B"];

  // Build per-driver stats from real routes data
  const driverStats = drivers.map((d: any, i: number) => {
    const driverRoutes = routes.filter((r: any) => r.driverId === d.id || r.driver?.id === d.id);
    
    let totalStopsCount = 0;
    let completedStopsCount = 0;
    let skippedStopsCount = 0;

    driverRoutes.forEach((r: any) => {
      if (r.stops && Array.isArray(r.stops)) {
        totalStopsCount += r.stops.length;
        r.stops.forEach((s: any) => {
          if (s.status === 'COMPLETED') completedStopsCount++;
          if (s.status === 'SKIPPED') skippedStopsCount++;
        });
      }
    });

    let calcRating = 0;
    if (totalStopsCount > 0) {
      // Rating out of 5 based on completion rate, minus penalty for skips
      let baseRating = (completedStopsCount / totalStopsCount) * 5.0;
      baseRating -= (skippedStopsCount * 0.5); // Penalty of 0.5 per skipped stop
      calcRating = Math.max(0, Math.min(5.0, baseRating));
    }

    const completedRoutes = driverRoutes.filter((r: any) => r.status === 'COMPLETED').length;
    return {
      id: d.id,
      name: d.name || 'Unknown',
      routes: driverRoutes.length,
      completedRoutes,
      stops: totalStopsCount,
      rating: calcRating,
      color: COLORS[i % COLORS.length],
    };
  });

  const formatMetric = (val: number, key: string) => {
    if (key === "rating") return val.toFixed(1);
    return String(val);
  };

  const sorted = [...driverStats].sort((a, b) => b[metric] - a[metric]);
  const topDriver = sorted[0];

  if (drivers.length === 0) {
    return <div className="text-center py-12 text-slate-400 text-sm">No drivers found in database.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Drivers" value={String(drivers.length)} color="bg-primary-600" icon={Users} delay={0} />
        <KpiCard label="Total Routes" value={String(routes.length)} sub="All routes" color="bg-emerald-500" icon={CheckCircle2} delay={0.05} />
        <KpiCard label="Total Stops Done" value={driverStats.reduce((s, d) => s + d.stops, 0).toLocaleString()} color="bg-amber-500" icon={MapPin} delay={0.1} />
        <KpiCard label="Top Driver" value={topDriver?.name?.split(' ')[0] || 'N/A'} sub={`${topDriver?.routes || 0} routes`} color="bg-violet-500" icon={Trophy} delay={0.15} />
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
            const maxVal = sorted[0][metric] || 1;
            const pct = (driver[metric] / maxVal) * 100;
            return (
              <div key={driver.id} className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 w-4 flex-shrink-0">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: driver.color }}>
                  {driver.name.charAt(0).toUpperCase()}
                </div>
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

      {/* Stats Table */}
      <ChartCard title="Full Driver Statistics">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Driver", "Total Routes", "Completed", "Stops Done"].map(h => (
                  <th key={h} className="text-left font-semibold text-slate-500 pb-2 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(d => (
                <tr key={d.id} className="border-b border-border/50 last:border-0 hover:bg-slate-50">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="font-medium text-slate-800 whitespace-nowrap">{d.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600">{d.routes}</td>
                  <td className="py-2.5 pr-3">
                    <span className="font-semibold text-emerald-600">{d.completedRoutes}</span>
                  </td>
                  <td className="py-2.5">{d.stops}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Vehicles Tab (Real Backend Data) ────────────────────────────────────────
function VehiclesTab({ vehicles }: { vehicles: any[] }) {
  if (vehicles.length === 0) {
    return <div className="text-center py-12 text-slate-400 text-sm">No vehicles found in database.</div>;
  }

  const inUse = vehicles.filter((v: any) => v.status === 'IN_USE').length;
  const maintenance = vehicles.filter((v: any) => v.status === 'MAINTENANCE').length;
  const idle = vehicles.filter((v: any) => v.status === 'IDLE').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Fleet Size" value={`${vehicles.length} vehicles`} sub={`${inUse} active`} color="bg-primary-600" icon={Truck} delay={0} />
        <KpiCard label="In Use" value={String(inUse)} sub="Currently deployed" color="bg-emerald-500" icon={Activity} delay={0.05} />
        <KpiCard label="Maintenance" value={String(maintenance)} sub="Under service" color="bg-amber-500" icon={Zap} delay={0.1} />
        <KpiCard label="Idle" value={String(idle)} sub="Available" color="bg-violet-500" icon={CheckCircle2} delay={0.15} />
      </div>

      {/* Vehicle Status Table */}
      <ChartCard title="Fleet Health Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v: any) => {
            const fuel = v.currentFuelLevel ?? 100;
            const needsAttention = v.status === 'MAINTENANCE' || fuel < 25;
            return (
              <div key={v.id} className={`rounded-lg border p-4 ${needsAttention ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-800">{v.plateNumber}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    v.status === 'IN_USE' ? "bg-emerald-100 text-emerald-700"
                    : v.status === 'MAINTENANCE' ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                  }`}>{v.status?.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{v.model} · {v.type}</p>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Fuel</span>
                  <span className={`font-semibold ${fuel < 25 ? "text-red-600" : "text-slate-700"}`}>{Math.round(fuel)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${fuel > 50 ? "bg-emerald-500" : fuel > 20 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(fuel, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">Next Maintenance: {v.nextMaintenance || 'Not scheduled'}</p>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("routes");
  const [dateRange, setDateRange] = useState("This Month");

  // Real API data
  const [routes, setRoutes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
    routesApi.getAll().then(res => { 
      if (res.success) {
        const mappedRoutes = res.data.map((r: any) => ({
          ...r,
          stops: r.routestop || r.stops || [],
          driver: r.user || r.driver || null
        }));
        setRoutes(mappedRoutes);
      } 
    }).catch(() => {});
    usersApi.getAll("DRIVER").then(res => { if (res.success) setDrivers(res.data); }).catch(() => {});
    reportsApi.getDashboard().then(res => { if (res.success) setDashboardStats(res.data); }).catch(() => {});
    stopsApi.getAll().then(res => { if (res.success) setStops(res.data); }).catch(() => {});
    vehiclesApi.getAll().then(res => { if (res.success) setVehicles(res.data); }).catch(() => {});
  }, []);

  const handleExport = () => {
    let rows: string[][] = [];
    let filename = "report.csv";

    if (activeTab === "revenue") {
      filename = "revenue_report.csv";
      rows = [["Route Name", "Driver", "Status", "Date", "Cash Collected"]];
      stops.forEach((s: any) => {
        rows.push([
          s.route?.name || s.routeId || "",
          s.route?.driver?.name || "",
          s.status || "",
          s.route?.date ? new Date(s.route.date).toLocaleDateString() : "",
          String(s.cashCollected || 0),
        ]);
      });
    } else if (activeTab === "routes") {
      filename = "routes_report.csv";
      rows = [["Route Name", "Driver", "Status", "Total Stops", "Date"]];
      routes.forEach((r: any) => {
        rows.push([
          r.name || "",
          r.driver?.name || "",
          r.status || "",
          String(r.stops?.length || 0),
          r.date ? new Date(r.date).toLocaleDateString() : "",
        ]);
      });
    } else if (activeTab === "stops") {
      filename = "stops_report.csv";
      rows = [["Location", "Status", "Cash Collected", "Checked In At"]];
      stops.forEach((s: any) => {
        rows.push([
          s.location?.name || s.locationId || "",
          s.status || "",
          String(s.cashCollected || 0),
          s.checkedInAt ? new Date(s.checkedInAt).toLocaleString() : "",
        ]);
      });
    } else if (activeTab === "drivers") {
      filename = "drivers_report.csv";
      rows = [["Driver Name", "Email", "Phone", "Total Routes", "Completed Routes"]];
      drivers.forEach((d: any) => {
        const driverRoutes = routes.filter((r: any) => r.driverId === d.id || r.driver?.id === d.id);
        const completed = driverRoutes.filter((r: any) => r.status === "COMPLETED").length;
        rows.push([
          d.name || "",
          d.email || "",
          d.phone || "",
          String(driverRoutes.length),
          String(completed),
        ]);
      });
    } else if (activeTab === "vehicles") {
      filename = "vehicles_report.csv";
      rows = [["Vehicle Number", "Type", "Status", "Driver"]];
      vehicles.forEach((v: any) => {
        rows.push([
          v.plateNumber || "",
          v.type || "",
          v.status || "",
          v.driver?.name || "",
        ]);
      });
    }

    // Build CSV string
    const csvContent = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // Trigger CSV download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    let head: string[][] = [];
    let body: any[][] = [];
    let title = "Report";

    if (activeTab === "revenue") {
      title = "Revenue Report";
      head = [["Route Name", "Driver", "Status", "Date", "Cash Collected"]];
      stops.forEach((s: any) => {
        body.push([
          s.route?.name || s.routeId || "",
          s.route?.driver?.name || "",
          s.status || "",
          s.route?.date ? new Date(s.route.date).toLocaleDateString() : "",
          String(s.cashCollected || 0),
        ]);
      });
    } else if (activeTab === "routes") {
      title = "Routes Report";
      head = [["Route Name", "Driver", "Status", "Total Stops", "Date"]];
      routes.forEach((r: any) => {
        body.push([
          r.name || "",
          r.driver?.name || "",
          r.status || "",
          String(r.stops?.length || 0),
          r.date ? new Date(r.date).toLocaleDateString() : "",
        ]);
      });
    } else if (activeTab === "stops") {
      title = "Stops Report";
      head = [["Location", "Status", "Cash Collected", "Checked In At"]];
      stops.forEach((s: any) => {
        body.push([
          s.location?.name || s.locationId || "",
          s.status || "",
          String(s.cashCollected || 0),
          s.checkedInAt ? new Date(s.checkedInAt).toLocaleString() : "",
        ]);
      });
    } else if (activeTab === "drivers") {
      title = "Drivers Report";
      head = [["Driver Name", "Email", "Phone", "Total Routes", "Completed Routes"]];
      drivers.forEach((d: any) => {
        const driverRoutes = routes.filter((r: any) => r.driverId === d.id || r.driver?.id === d.id);
        const completed = driverRoutes.filter((r: any) => r.status === "COMPLETED").length;
        body.push([
          d.name || "",
          d.email || "",
          d.phone || "",
          String(driverRoutes.length),
          String(completed),
        ]);
      });
    } else if (activeTab === "vehicles") {
      title = "Vehicles Report";
      head = [["Vehicle Number", "Type", "Status", "Driver"]];
      vehicles.forEach((v: any) => {
        body.push([
          v.plateNumber || "",
          v.type || "",
          v.status || "",
          v.driver?.name || "",
        ]);
      });
    }

    const doc = new jsPDF();
    doc.text(title, 14, 15);
    autoTable(doc, { head, body, startY: 20 });
    doc.save(`${title.toLowerCase().replace(/ /g, "_")}.pdf`);
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
              className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-border hover:bg-slate-50 transition-colors px-4 py-2 rounded-lg"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors px-4 py-2 rounded-lg"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              PDF
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
        className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl p-5 text-amber-950 flex items-center justify-between border border-yellow-200 shadow-sm"
      >
        <div>
          <p className="text-sm font-bold opacity-90">{currentTab?.label} Overview — {dateRange}</p>
          <p className="text-xs opacity-75 mt-0.5 font-medium text-amber-900">Showing aggregated data. Last refreshed: Just now.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-px h-10 bg-amber-900/20" />
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
          {activeTab === "revenue"  && <RevenueTab routes={routes} stops={stops} />}
          {activeTab === "routes"   && <RoutesTab routes={routes} drivers={drivers} />}
          {activeTab === "stops"    && <StopsTab stats={dashboardStats} />}
          {activeTab === "drivers"  && <DriversTab drivers={drivers} routes={routes} />}
          {activeTab === "vehicles" && <VehiclesTab vehicles={vehicles} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
