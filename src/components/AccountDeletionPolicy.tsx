import { Link } from "react-router-dom";
import { Dumbbell, ArrowLeft, AlertTriangle } from "lucide-react";

export default function AccountDeletionPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">WellPlan</span>
            </Link>
            <Link
              to="/home"
              className="text-slate-300 hover:text-white transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
          <h1 className="text-4xl font-bold text-white mb-4">
            Account Deletion Policy
          </h1>
          <p className="text-slate-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                1. Your Right to Delete
              </h2>
              <p className="mb-4">
                At WellPlan, we respect your right to control your personal
                data. You can request deletion of your account and all
                associated data at any time. This policy explains how the
                deletion process works and what happens to your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                2. How to Delete Your Account
              </h2>
              <p className="mb-4">You can delete your account in two ways:</p>

              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">
                    Option 1: Through the App
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Log in to your WellPlan account</li>
                    <li>Navigate to Settings → Account</li>
                    <li>Scroll to the bottom and click "Delete Account"</li>
                    <li>Confirm your decision</li>
                  </ol>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">
                    Option 2: Contact Us
                  </h3>
                  <p className="mb-2">
                    Send an email to{" "}
                    <span className="text-blue-400">
                      saurabhcoded@gmail.com
                    </span>{" "}
                    with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Subject line: "Account Deletion Request"</li>
                    <li>Your registered email address</li>
                    <li>
                      A brief confirmation that you want to delete your account
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                3. What Gets Deleted
              </h2>
              <p className="mb-4">
                When you delete your account, the following data will be
                permanently removed:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your profile information (name, email, health metrics)</li>
                <li>All workout logs and exercise history</li>
                <li>Workout plans and schedules</li>
                <li>Progress tracking data and statistics</li>
                <li>Personal records and achievements</li>
                <li>Account settings and preferences</li>
              </ul>
            </section>

            <section>
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-semibold text-red-400 mb-2">
                      Important: This Action is Permanent
                    </h2>
                    <p className="text-red-200 mb-3">
                      Once your account is deleted, this action cannot be
                      undone. All your data will be permanently removed from our
                      systems and cannot be recovered.
                    </p>
                    <p className="text-red-200">
                      We recommend exporting your workout data before deleting
                      your account if you want to keep a copy for your records.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                4. Deletion Timeline
              </h2>
              <p className="mb-4">
                The account deletion process follows this timeline:
              </p>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Immediate</p>
                    <p className="text-sm">
                      Your account is deactivated and you can no longer log in
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">Within 24 Hours</p>
                    <p className="text-sm">
                      Your personal data is removed from active databases
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">Within 30 Days</p>
                    <p className="text-sm">
                      All data is purged from backup systems
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                5. Data Retention Exceptions
              </h2>
              <p className="mb-4">
                In some cases, we may be required to retain certain information
                for legal or regulatory purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Transaction records (if applicable) for accounting and tax
                  purposes
                </li>
                <li>Data necessary to comply with legal obligations</li>
                <li>
                  Information needed to resolve disputes or enforce agreements
                </li>
              </ul>
              <p className="mt-4">
                Any retained data will be kept in a secure, isolated manner and
                will not be used for any other purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                6. Reactivation
              </h2>
              <p className="mb-4">
                Once your account is deleted, it cannot be reactivated. If you
                wish to use WellPlan again, you will need to create a new
                account. Your previous data will not be recoverable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                7. Alternative: Account Deactivation
              </h2>
              <p className="mb-4">
                If you're not ready for permanent deletion, consider temporarily
                deactivating your account instead. Contact us at{" "}
                <span className="text-blue-400">saurabhcoded@gmail.com</span> to
                discuss this option.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                8. Questions or Concerns
              </h2>
              <p className="mb-4">
                If you have any questions about our account deletion policy or
                need assistance with the deletion process, please contact us:
              </p>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <p className="text-blue-400 font-semibold">
                  saurabhcoded@gmail.com
                </p>
                <p className="text-sm mt-2">
                  We typically respond within 24-48 hours
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                9. Your Privacy Rights
              </h2>
              <p className="mb-4">
                This policy is part of our commitment to your privacy rights.
                For more information about how we handle your data, please
                review our{" "}
                <Link
                  to="/privacy-policy"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

