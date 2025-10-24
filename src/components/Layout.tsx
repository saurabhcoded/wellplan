import { NavLink, Outlet } from "react-router-dom";
import {
  Dumbbell,
  Home,
  Calendar,
  TrendingUp,
  User,
  Library,
  Shield,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
  const { userRole } = useAuth();
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
      isActive
        ? "bg-blue-500 text-white"
        : "text-slate-400 hover:text-white hover:bg-slate-700"
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 py-2 rounded-lg font-medium transition ${
      isActive ? "text-blue-400" : "text-slate-400 active:bg-slate-700"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20 md:pb-0">
      {/* Top Navigation - Desktop */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">WellPlan</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/app" className={navLinkClass} end>
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/app/planner" className={navLinkClass}>
                <Calendar className="w-4 h-4" />
                <span>Planner</span>
              </NavLink>

              <NavLink to="/app/progress" className={navLinkClass}>
                <TrendingUp className="w-4 h-4" />
                <span>Progress</span>
              </NavLink>

              <NavLink to="/app/exercises" className={navLinkClass}>
                <Library className="w-4 h-4" />
                <span>Exercises</span>
              </NavLink>

              {userRole === "admin" && (
                <NavLink
                  to="/app/admin/published-plans"
                  className={navLinkClass}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Plans</span>
                </NavLink>
              )}

              <NavLink to="/app/account" className={navLinkClass}>
                <User className="w-4 h-4" />
                <span>Account</span>
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 z-40">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          <NavLink to="/app" className={mobileNavLinkClass} end>
            {({ isActive }) => (
              <>
                <Home
                  className={`w-5 h-5 ${isActive ? "text-blue-400" : ""}`}
                />
                <span className="text-xs">Home</span>
              </>
            )}
          </NavLink>

          <NavLink to="/app/planner" className={mobileNavLinkClass}>
            {({ isActive }) => (
              <>
                <Calendar
                  className={`w-5 h-5 ${isActive ? "text-blue-400" : ""}`}
                />
                <span className="text-xs">Planner</span>
              </>
            )}
          </NavLink>

          <NavLink to="/app/progress" className={mobileNavLinkClass}>
            {({ isActive }) => (
              <>
                <TrendingUp
                  className={`w-5 h-5 ${isActive ? "text-blue-400" : ""}`}
                />
                <span className="text-xs">Progress</span>
              </>
            )}
          </NavLink>

          <NavLink to="/app/account" className={mobileNavLinkClass}>
            {({ isActive }) => (
              <>
                <User
                  className={`w-5 h-5 ${isActive ? "text-blue-400" : ""}`}
                />
                <span className="text-xs">Account</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

