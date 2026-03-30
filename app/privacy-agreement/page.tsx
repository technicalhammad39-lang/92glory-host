'use client';

import React from 'react';
import { Header } from '@/components/Header';

export default function PrivacyAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack title="Privacy Agreement" />
      <div className="p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 text-sm leading-relaxed text-gray-600">
          <p className="font-bold text-gray-800">Privacy Agreement</p>
          <p>
            We collect only the information needed to create and secure your account, including phone/email, login
            activity, and transaction records.
          </p>
          <p>
            Your credentials are stored securely, and account data is used only for authentication, gameplay records,
            and support requests.
          </p>
          <p>
            We do not sell personal data. Data may be shared only when required for legal compliance, fraud prevention,
            or payment processing.
          </p>
          <p>
            By using this platform, you agree to this policy and to periodic updates made for security and compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
