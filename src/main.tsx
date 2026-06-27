import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router";

import App from "./App";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ApiStatusPage from "./pages/ApiStatusPage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import StaffDashboardPage from "./pages/staff/StaffDashboardPage";
import NotificationsPage from "./pages/student/NotificationsPage";
import ProfilePage from "./pages/student/ProfilePage";
import QueueHistoryPage from "./pages/student/QueueHistoryPage";
import SettingsPage from "./pages/student/SettingsPage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import StudentServicesPage from "./pages/student/StudentServicesPage";
import "./index.css";

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element was not found",
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/register"
          element={<RegisterPage />}
        />
        <Route
          path="/api-status"
          element={<ApiStatusPage />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT"]}
            >
              {(user) => (
                <StudentDashboardPage
                  user={user}
                />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/services"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT"]}
            >
              {(user) => (
                <StudentServicesPage
                  user={user}
                />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/:serviceId"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT"]}
            >
              {(user) => (
                <ServiceDetailsPage
                  user={user}
                />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/history"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT"]}
            >
              {(user) => (
                <QueueHistoryPage user={user} />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/notifications"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT"]}
            >
              {(user) => (
                <NotificationsPage user={user} />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT"]}
            >
              {(user) => (
                <ProfilePage user={user} />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT"]}
            >
              {(user) => (
                <SettingsPage user={user} />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <ProtectedRoute
              allowedRoles={["STAFF", "ADMIN"]}
              loginPath="/login?role=staff"
            >
              {(user) => (
                <StaffDashboardPage user={user} />
              )}
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
