import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, LogOut, Save, Loader2 } from 'lucide-react';

interface HealthMetrics {
  age: number | null;
  height_cm: number | null;
  body_fat_percentage: number | null;
  gender: string | null;
  full_name: string;
}

export default function Account() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [metrics, setMetrics] = useState<HealthMetrics>({
    age: null,
    height_cm: null,
    body_fat_percentage: null,
    gender: null,
    full_name: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, age, height_cm, body_fat_percentage, gender")
        .eq("id", user!.id)
        .maybeSingle();

      // If profile doesn't exist, create it
      if (!data && !error) {
        console.log("Profile not found, creating new profile...");
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user!.id,
          email: user!.email || "",
          full_name: user!.user_metadata?.full_name || "",
          age: user!.user_metadata?.age || null,
          height_cm: user!.user_metadata?.height_cm || null,
          body_fat_percentage: user!.user_metadata?.body_fat_percentage || null,
          gender: user!.user_metadata?.gender || null,
        });

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        }

        // Set metrics from user metadata
        setMetrics({
          age: user!.user_metadata?.age || null,
          height_cm: user!.user_metadata?.height_cm || null,
          body_fat_percentage: user!.user_metadata?.body_fat_percentage || null,
          gender: user!.user_metadata?.gender || null,
          full_name: user!.user_metadata?.full_name || "",
        });
      } else if (error) {
        throw error;
      } else if (data) {
        setMetrics({
          age: data.age,
          height_cm: data.height_cm,
          body_fat_percentage: data.body_fat_percentage,
          gender: data.gender,
          full_name: data.full_name || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setMessage({
        type: "error",
        text: "Failed to load profile data. Please try refreshing the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: metrics.full_name,
          age: metrics.age,
          height_cm: metrics.height_cm,
          body_fat_percentage: metrics.body_fat_percentage,
          gender: metrics.gender,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);

      if (error) throw error;

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Account Settings
              </h1>
              <p className="text-blue-100 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mx-6 mt-6">
            <div
              className={`p-4 rounded-lg border ${
                message.type === "success"
                  ? "bg-green-500/10 border-green-500/50 text-green-400"
                  : "bg-red-500/10 border-red-500/50 text-red-400"
              }`}
            >
              {message.text}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={metrics.full_name}
                  onChange={(e) =>
                    setMetrics({ ...metrics, full_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="age"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  value={metrics.age || ""}
                  onChange={(e) =>
                    setMetrics({
                      ...metrics,
                      age: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="25"
                  min="10"
                  max="120"
                />
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  value={metrics.gender || ""}
                  onChange={(e) =>
                    setMetrics({ ...metrics, gender: e.target.value || null })
                  }
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Health Metrics */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Health Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="height_cm"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Height (cm)
                </label>
                <input
                  id="height_cm"
                  type="number"
                  step="0.01"
                  value={metrics.height_cm || ""}
                  onChange={(e) =>
                    setMetrics({
                      ...metrics,
                      height_cm: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="175.5"
                  min="50"
                  max="300"
                />
              </div>

              <div>
                <label
                  htmlFor="body_fat_percentage"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Body Fat Percentage (%)
                </label>
                <input
                  id="body_fat_percentage"
                  type="number"
                  step="0.01"
                  value={metrics.body_fat_percentage || ""}
                  onChange={(e) =>
                    setMetrics({
                      ...metrics,
                      body_fat_percentage: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="15.5"
                  min="2"
                  max="70"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400">
                <strong className="text-slate-300">Note:</strong> These metrics
                help us provide better personalized recommendations for your
                fitness journey. All fields are optional.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 font-semibold rounded-lg hover:bg-red-500/20 border border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

