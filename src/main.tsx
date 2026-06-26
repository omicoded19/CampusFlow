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
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
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
        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/services/:serviceId"
          element={<ServiceDetailsPage />}
        />

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
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);