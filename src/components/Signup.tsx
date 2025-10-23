import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Dumbbell } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [bodyFatPercentage, setBodyFatPercentage] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!fullName.trim()) {
        throw new Error("Please enter your full name");
      }
      const { error } = await signUp(email, password, {
        fullName,
        age: age ? parseInt(age) : null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        bodyFatPercentage: bodyFatPercentage
          ? parseFloat(bodyFatPercentage)
          : null,
        gender: gender || null,
      });
      if (error) throw error;

      // Show success message after signup
      setSignupSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[95vh] overflow-y-auto">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl mb-4">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Join WellPlan
            </h1>
            <p className="text-slate-400 text-center">
              Start your fitness journey today
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {signupSuccess ? (
            <div className="mb-6 p-6 bg-green-500/10 border border-green-500/50 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-green-400 font-semibold text-lg">
                    Account Created!
                  </h3>
                </div>
              </div>
              <p className="text-green-300 text-sm mb-4">
                Thank you for signing up! We've sent a confirmation email to:
              </p>
              <p className="text-white font-medium mb-4 bg-slate-900 p-3 rounded-lg">
                {email}
              </p>
              <p className="text-slate-300 text-sm mb-2">
                📧 Please check your email inbox and click the confirmation link
                to activate your account.
              </p>
              <p className="text-slate-400 text-xs">
                Don't see the email? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setSignupSuccess(false);
                  }}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  try signing up again
                </button>
                .
              </p>
              <div className="mt-4 pt-4 border-t border-green-500/20">
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  ← Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="heightCm"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Height (cm)
                    </label>
                    <input
                      id="heightCm"
                      type="number"
                      step="0.01"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="175"
                      min="50"
                      max="300"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bodyFatPercentage"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Body Fat (%)
                    </label>
                    <input
                      id="bodyFatPercentage"
                      type="number"
                      step="0.01"
                      value={bodyFatPercentage}
                      onChange={(e) => setBodyFatPercentage(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="15"
                      min="2"
                      max="70"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400">
                    Health metrics are optional but help us provide better
                    recommendations
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Must be at least 6 characters long
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Dumbbell className="w-5 h-5 animate-bounce" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-blue-400 hover:text-blue-300 font-medium transition"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

