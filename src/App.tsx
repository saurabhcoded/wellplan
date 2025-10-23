import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import DailyTracker from "./components/DailyTracker";
import WorkoutPlanner from "./components/WorkoutPlanner";
import ProgressCharts from "./components/ProgressCharts";
import Account from "./components/Account";
import ExerciseLibrary from "./components/ExerciseLibrary";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Redirect old /auth route to /login */}
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* Protected routes with Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DailyTracker />} />
            <Route path="planner" element={<WorkoutPlanner />} />
            <Route path="progress" element={<ProgressCharts />} />
            <Route path="exercises" element={<ExerciseLibrary />} />
            <Route path="account" element={<Account />} />
          </Route>

          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
