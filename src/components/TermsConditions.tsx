import { Link } from "react-router-dom";
import { Dumbbell, ArrowLeft } from "lucide-react";

export default function TermsConditions() {
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
          <h1 className="text-4xl font-bold text-white mb-4">Terms & Conditions</h1>
          <p className="text-slate-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using WellPlan, you accept and agree to be bound by the terms and provision of 
                this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="mb-4">
                WellPlan provides a fitness tracking and workout planning platform that allows users to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Track daily workouts and exercises</li>
                <li>Plan and schedule workout routines</li>
                <li>Monitor fitness progress over time</li>
                <li>Access an exercise library</li>
                <li>Store health and fitness metrics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Account</h2>
              <p className="mb-4">
                To use certain features of the service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Medical Disclaimer</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-4">
                <p className="text-yellow-200 font-semibold mb-2">Important Notice:</p>
                <p className="text-yellow-100">
                  WellPlan is not a medical service and does not provide medical advice. Always consult with a 
                  qualified healthcare professional before starting any fitness program. We are not responsible 
                  for any injuries or health issues that may result from using our service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. User Conduct</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the service for any illegal purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe on the rights of others</li>
                <li>Transmit any malicious code or viruses</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
              <p className="mb-4">
                All content, features, and functionality of WellPlan are owned by us and are protected by 
                copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, 
                or reproduce any content without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
              <p className="mb-4">
                To the maximum extent permitted by law, WellPlan shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Service Availability</h2>
              <p className="mb-4">
                We strive to maintain service availability but do not guarantee uninterrupted access. We reserve 
                the right to modify, suspend, or discontinue the service at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account and access to the service immediately, without prior 
                notice, for any reason, including breach of these Terms. You may also terminate your account at 
                any time by contacting us or using the account deletion feature.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any material 
                changes by posting the new terms on this page with an updated "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law</h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard 
                to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms & Conditions, please contact us at:
              </p>
              <p className="text-blue-400">support@wellplan.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

