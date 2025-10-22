import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import DailyTracker from './components/DailyTracker';
import WorkoutPlanner from './components/WorkoutPlanner';
import ProgressCharts from './components/ProgressCharts';
import Account from './components/Account';
import { Dumbbell, Home, Calendar, TrendingUp, User } from 'lucide-react';

type Tab = 'dashboard' | 'planner' | 'progress' | 'account';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (!user) {
    return <Auth />;
  }

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
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "dashboard"
                    ? "bg-blue-500 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("planner")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "planner"
                    ? "bg-blue-500 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Planner</span>
              </button>

              <button
                onClick={() => setActiveTab("progress")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "progress"
                    ? "bg-blue-500 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Progress</span>
              </button>

              <button
                onClick={() => setActiveTab("account")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "account"
                    ? "bg-blue-500 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Account</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && <DailyTracker />}
        {activeTab === "planner" && <WorkoutPlanner />}
        {activeTab === "progress" && <ProgressCharts />}
        {activeTab === "account" && <Account />}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 z-50">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg font-medium transition ${
              activeTab === "dashboard"
                ? "text-blue-400"
                : "text-slate-400 active:bg-slate-700"
            }`}
          >
            <Home
              className={`w-6 h-6 ${
                activeTab === "dashboard" ? "text-blue-400" : ""
              }`}
            />
            <span className="text-xs">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("planner")}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg font-medium transition ${
              activeTab === "planner"
                ? "text-blue-400"
                : "text-slate-400 active:bg-slate-700"
            }`}
          >
            <Calendar
              className={`w-6 h-6 ${
                activeTab === "planner" ? "text-blue-400" : ""
              }`}
            />
            <span className="text-xs">Planner</span>
          </button>

          <button
            onClick={() => setActiveTab("progress")}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg font-medium transition ${
              activeTab === "progress"
                ? "text-blue-400"
                : "text-slate-400 active:bg-slate-700"
            }`}
          >
            <TrendingUp
              className={`w-6 h-6 ${
                activeTab === "progress" ? "text-blue-400" : ""
              }`}
            />
            <span className="text-xs">Progress</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg font-medium transition ${
              activeTab === "account"
                ? "text-blue-400"
                : "text-slate-400 active:bg-slate-700"
            }`}
          >
            <User
              className={`w-6 h-6 ${
                activeTab === "account" ? "text-blue-400" : ""
              }`}
            />
            <span className="text-xs">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
