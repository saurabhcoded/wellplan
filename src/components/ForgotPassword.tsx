import { useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, ArrowLeft, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl mb-4">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Reset Password
            </h1>
            <p className="text-slate-400 text-center">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {emailSent ? (
            <div className="space-y-6">
              <div className="p-6 bg-green-500/10 border border-green-500/50 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                    <Mail className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-green-400 font-semibold text-lg">
                      Check Your Email
                    </h3>
                  </div>
                </div>
                <p className="text-green-300 text-sm mb-4">
                  We've sent a password reset link to:
                </p>
                <p className="text-white font-medium mb-4 bg-slate-900 p-3 rounded-lg">
                  {email}
                </p>
                <p className="text-slate-300 text-sm mb-2">
                  📧 Click the link in the email to reset your password.
                </p>
                <p className="text-slate-400 text-xs">
                  Don't see the email? Check your spam folder or{" "}
                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setError("");
                    }}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Email Address
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Dumbbell className="w-5 h-5 animate-bounce" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

