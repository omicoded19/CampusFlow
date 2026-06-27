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
import AdminDashboardPage from "./pages/staff/AdminDashboardPage";
import AdminSectionPage from "./pages/staff/AdminSectionPage";
import StaffDashboardPage from "./pages/staff/StaffDashboardPage";
import StaffSectionPage from "./pages/staff/StaffSectionPage";
import MyQueuePage from "./pages/student/MyQueuePage";
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
          path="/dashboard/queue"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT"]}
            >
              {(user) => (
                <MyQueuePage user={user} />
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
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
              loginPath="/login?role=staff"
            >
              {(user) => (
                <AdminDashboardPage user={user} />
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

        <Route
          path="/staff/current"
          element={
            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]} loginPath="/login?role=staff">
              {(user) => <StaffSectionPage user={user} section="current" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/queues"
          element={
            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]} loginPath="/login?role=staff">
              {(user) => <StaffSectionPage user={user} section="queues" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/history"
          element={
            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]} loginPath="/login?role=staff">
              {(user) => <StaffSectionPage user={user} section="history" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/transfers"
          element={
            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]} loginPath="/login?role=staff">
              {(user) => <StaffSectionPage user={user} section="transfers" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/announcements"
          element={
            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]} loginPath="/login?role=staff">
              {(user) => <StaffSectionPage user={user} section="announcements" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/profile"
          element={
            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]} loginPath="/login?role=staff">
              {(user) => <StaffSectionPage user={user} section="profile" />}
            </ProtectedRoute>
          }
        />

        {([
          ["departments", "departments"],
          ["services", "services"],
          ["counters", "counters"],
          ["analytics", "analytics"],
          ["logs", "logs"],
          ["settings", "settings"],
          ["profile", "profile"],
        ] as const).map(([path, section]) => (
          <Route
            key={path}
            path={`/admin/${path}`}
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]} loginPath="/login?role=staff">
                {(user) => <AdminSectionPage user={user} section={section} />}
              </ProtectedRoute>
            }
          />
        ))}

      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
