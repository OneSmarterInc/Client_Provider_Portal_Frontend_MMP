import React, { useState } from "react";
import { ShieldCheck, FileText, Scale, Globe, AlertTriangle, UserCheck, Loader2 } from "lucide-react";

const DisclaimerModal = ({ isOpen, onAccept, onDecline, context = "login" }) => {
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);

  if (!isOpen) return null;

  const isLogin = context === "login";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-lg border-2 border-sky-300 w-[92%] max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 p-4 border-b-2 border-sky-300 bg-gradient-to-r from-[#0486A5]/5 to-transparent">
          <div className="w-10 h-10 bg-[#0486A5]/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#0486A5]" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">
            Terms of Use / Disclaimer
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5">
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            The Masters, Mates &amp; Pilots Health and Benefit Plan
            (&ldquo;Plan&rdquo;) offers this provider portal website to medical
            providers as a means to provide information regarding claims. Please
            read these Terms of Use in their entirety since they constitute a
            binding agreement between you and the Plan, but are not intended to
            amend or replace or amend any other agreement(s).
          </p>

          {/* Section: Protected Health Information */}
          <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <FileText className="w-4 h-4 text-[#0486A5]" />
              <h3 className="text-sm font-semibold text-gray-800">
                Protected Health Information
              </h3>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                By{" "}
                <span className="font-semibold text-[#0486A5]">
                  {isLogin
                    ? "logging into or accessing"
                    : "registering to access"}
                </span>{" "}
                this website, you represent that you have been authorized by the
                medical provider whose Tax ID or NPI is used to{" "}
                <span className="font-semibold text-[#0486A5]">
                  {isLogin ? "log into" : "register for"}
                </span>{" "}
                the website, to view and access protected health information
                (&ldquo;PHI&rdquo;) as defined under the provisions of the Health
                Insurance Portability and Accountability Act of 1996
                (&ldquo;HIPAA&rdquo;), and you will adhere to all requirements
                under HIPAA regarding all PHI you view, receive or otherwise access
                on the website.
              </p>
            </div>
          </div>

          {/* Section: Medical Provider's Responsibilities */}
          <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <UserCheck className="w-4 h-4 text-[#0486A5]" />
              <h3 className="text-sm font-semibold text-gray-800">
                Medical Provider&rsquo;s Responsibilities
              </h3>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                As a medical provider or authorized representative of a medical
                provider, you agree to protect your log-in information and password
                for this website from any unauthorized use and notify us immediately
                if you suspect or become aware of any unauthorized use or access to
                this website or the information contained therein. You agree not to
                use this website in any manner that may adversely affect this
                website&rsquo;s resources or its availability to others, or that
                violates U.S., local, state, or other applicable law.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                The Plan has the right to discontinue your access to this website
                for any reason.
              </p>
            </div>
          </div>

          {/* Section: Website Information */}
          <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <Globe className="w-4 h-4 text-[#0486A5]" />
              <h3 className="text-sm font-semibold text-gray-800">
                Website Information
              </h3>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                The Plan makes reasonable efforts to present accurate and current
                information on this website. However, no guarantee is given that the
                information contained in the website is accurate, complete, or
                up-to-date. The Plan is not responsible for, and expressly disclaims
                all liability for, damages of any kind arising out of the use of,
                reference to, or reliance on any information contained within this
                website. Use of the content on this website is permitted solely for
                the medical provider&rsquo;s non-commercial use.
              </p>
            </div>
          </div>

          {/* Section: Governing Law */}
          <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <Scale className="w-4 h-4 text-[#0486A5]" />
              <h3 className="text-sm font-semibold text-gray-800">
                Governing Law
              </h3>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                To the extent not preempted by federal law, these Terms of Use are
                governed exclusively by the laws of the State of Maryland, without
                reference to its rules regarding choice of law.
              </p>
            </div>
          </div>

          {/* Section: Limitation of Liability */}
          <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <AlertTriangle className="w-4 h-4 text-[#0486A5]" />
              <h3 className="text-sm font-semibold text-gray-800">
                Limitation of Liability
              </h3>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                You, as an authorized representative of the medical provider, agree
                that you will use this website at your own risk. The Plan and its
                Trustees and representatives have no liability for any damages
                (whether direct or indirect, special, incidental, consequential or
                punitive) incurred by you as a result of your use of this website or
                the information you receive from or submit to this website.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with checkboxes and buttons */}
        <div className="border-t-2 border-sky-300 p-4 bg-gray-50 rounded-b-lg">
          <div className="space-y-2 mb-4">
            <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#0486A5]/30 transition-colors">
              <input
                type="checkbox"
                checked={accepted}
                onChange={() => {
                  setAccepted(!accepted);
                  if (declined) setDeclined(false);
                }}
                className="mt-0.5 w-4 h-4 accent-[#0486A5]"
              />
              <span className="text-sm text-gray-700">
                I have read the above Terms of Use and Disclaimer and accept and
                agree to their terms as a condition of using this website.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg border border-gray-200 bg-white hover:border-red-300 transition-colors">
              <input
                type="checkbox"
                checked={declined}
                onChange={() => {
                  setDeclined(!declined);
                  if (accepted) setAccepted(false);
                }}
                className="mt-0.5 w-4 h-4 accent-red-500"
              />
              <span className="text-sm text-gray-700">
                No thanks, I do not wish to{" "}
                {isLogin
                  ? "access"
                  : "complete my registration to use"}{" "}
                this website.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onDecline}
              disabled={!declined}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                declined
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Decline
            </button>
            <button
              onClick={async () => {
                setAcceptLoading(true);
                try { await onAccept(); } finally { setAcceptLoading(false); }
              }}
              disabled={!accepted || acceptLoading}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                accepted && !acceptLoading
                  ? "bg-[#0486A5] hover:bg-[#047B95] text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {acceptLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </span>
              ) : (
                "Accept & Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
