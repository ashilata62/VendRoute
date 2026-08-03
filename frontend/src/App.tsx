import { useEffect, Component, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RoutesPage from "./pages/RoutesPage";
import RouteCreatePage from "./pages/RouteCreatePage";
import TrackingPage from "./pages/TrackingPage";
import LocationsPage from "./pages/LocationsPage";
import LocationDetailPage from "./pages/LocationDetailPage";
import StopsPage from "./pages/StopsPage";
import DriversPage from "./pages/DriversPage";
import DriverProfilePage from "./pages/DriverProfilePage";
import VehiclesPage from "./pages/VehiclesPage";
import CustomersPage from "./pages/CustomersPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import { useAuthStore } from "./store/authStore";

// --- Global Error Boundary to prevent blank white screens ---
interface EBState { hasError: boolean; error: Error | null; }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("🔴 React Error Boundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "700px", margin: "60px auto" }}>
          <h2 style={{ color: "#DC2626", marginBottom: "12px" }}>⚠️ Something went wrong</h2>
          <p style={{ color: "#475569", marginBottom: "16px" }}>The page crashed. Check the browser console (F12) for details.</p>
          <pre style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "16px", fontSize: "12px", whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#7F1D1D" }}>
            {this.state.error?.message}
            {"\n"}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/dashboard"; }}
            style={{ marginTop: "20px", padding: "10px 24px", background: "#2563EB", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    // Validate existing session on app startup
    fetchMe();

    const applyTheme = () => {
      const theme = localStorage.getItem("app-theme") || "Light";
      const root = document.documentElement;
      if (theme === "Dark") {
        root.classList.add("dark");
      } else if (theme === "Light") {
        root.classList.remove("dark");
      } else {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (systemPrefersDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme();

    // Listen to changes in localStorage
    window.addEventListener("storage", applyTheme);
    
    // Also listen to system prefers changes
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      if (localStorage.getItem("app-theme") === "System") {
        applyTheme();
      }
    };
    media.addEventListener("change", handleMediaChange);

    return () => {
      window.removeEventListener("storage", applyTheme);
      media.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/routes/create" element={<RouteCreatePage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/locations/:id" element={<LocationDetailPage />} />
            <Route path="/stops" element={<StopsPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/drivers/:id" element={<DriverProfilePage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
