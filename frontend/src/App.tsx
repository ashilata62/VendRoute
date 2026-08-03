import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import LandingPage from "./pages/LandingPage";

export default function App() {
  useEffect(() => {
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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LandingPage />} />
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
  );
}
