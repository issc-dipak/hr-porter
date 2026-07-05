"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText, Check } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export default function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
  const isTerms = type === 'terms';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-[550px] max-h-[85vh] bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/25">
                  {isTerms ? (
                    <FileText className="w-4.5 h-4.5 text-indigo-400" />
                  ) : (
                    <Shield className="w-4.5 h-4.5 text-indigo-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">
                    {isTerms ? 'Terms of Service' : 'Privacy Policy'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Last updated: May 2026
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center border border-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-350 text-[10px] font-medium leading-relaxed custom-scrollbar">
              {isTerms ? (
                <>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">1. Agreement to Terms</h4>
                    <p>
                      By creating an account on HR CORE, you acknowledge that you are an authorized representative of your organization. You agree to be bound by these Terms of Service and all applicable local, national, and international laws.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">2. Account Responsibility</h4>
                    <p>
                      You are solely responsible for maintaining the confidentiality of your credentials (including passwords and admin security keys). Any activity performed under your account shall be attributed directly to your organization.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">3. Acceptable Use Policy</h4>
                    <p>
                      The workspace must not be used for fraudulent activities, storage of malicious payloads, or violations of privacy guidelines. Corporate directories and employee databases are protected under strict access regulations.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">4. System Administration Rules</h4>
                    <p>
                      Administrators are granted full privileges to create, edit, or terminate accounts. Any misuse of these credentials will result in immediate termination of corporate access without prior notice.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">5. Limitation of Liability</h4>
                    <p>
                      HR CORE provides the platform on an "as-is" basis. We do not guarantee uninterrupted system access or absolute zero-downtime data persistence. Backup management is highly recommended for enterprise teams.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">1. Information Collection</h4>
                    <p>
                      We collect name, corporate email, optional phone number, department data, and custom profile picture coordinates to construct the employee profile. All data points are securely transmitted and stored.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">2. Data Encryption</h4>
                    <p>
                      Sensitive credentials, including passkeys and passwords, are hashed server-side using secure blowfish crypt algorithms (bcryptjs). Plaintext credentials are never saved or visible to system administrators.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">3. Third-Party Disclosures</h4>
                    <p>
                      We do not sell, trade, or distribute your corporate directory data to third parties. Integration details (like Razorpay for sandbox wallets) only process parameters necessary for execution of payouts and transactions.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">4. User Consent and Control</h4>
                    <p>
                      You retain full control over your personal profiles. You can modify notification preferences (email notifications, push updates) or delete profile entries through authorized administration channels.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950/40 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-500/10 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Understand & Agree
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
