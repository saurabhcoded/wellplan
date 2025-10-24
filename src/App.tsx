import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./contexts/AuthContext";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsConditions from "./components/TermsConditions";
import AccountDeletionPolicy from "./components/AccountDeletionPolicy";
import DailyTracker from "./components/DailyTracker";
import WorkoutPlanner from "./components/WorkoutPlanner";
import ProgressCharts from "./components/ProgressCharts";
import Account from "./components/Account";
import ExerciseLibrary from "./components/ExerciseLibrary";
import AdminPublishedPlans from "./components/AdminPublishedPlans";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              // Default options
              duration: 3000,
              style: {
                background: "#1e293b",
                color: "#fff",
                border: "1px solid #334155",
                padding: "16px",
                borderRadius: "12px",
                fontSize: "14px",
                maxWidth: "500px",
              },
              // Success
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
                style: {
                  border: "1px solid #10b981",
                },
              },
              // Error
              error: {
                duration: 4000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
                style: {
                  border: "1px solid #ef4444",
                },
              },
              // Loading
              loading: {
                iconTheme: {
                  primary: "#3b82f6",
                  secondary: "#fff",
                },
              },
            }}
          />
          <Routes>
            {/* Public landing and info pages */}
            <Route path="/home" element={<Home />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route
              path="/account-deletion-policy"
              element={<AccountDeletionPolicy />}
            />

            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Redirect old /auth route to /login */}
            <Route path="/auth" element={<Navigate to="/login" replace />} />

            {/* Protected routes with Layout */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DailyTracker />} />
              <Route path="planner" element={<WorkoutPlanner />} />
              <Route
                path="admin/published-plans"
                element={<AdminPublishedPlans />}
              />
              <Route path="progress" element={<ProgressCharts />} />
              <Route path="exercises" element={<ExerciseLibrary />} />
              <Route path="account" element={<Account />} />
            </Route>

            {/* Root redirect - logged in users go to app, others to home */}
            <Route path="/" element={<Navigate to="/app" replace />} />

            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
