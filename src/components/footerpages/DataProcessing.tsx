import React from 'react';
import { Shield, FileText, Lock, Database, AlertCircle, CheckCircle, Mail, Server } from 'lucide-react';

function DataProcessing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 py-20">
        <div className="container mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full mb-6 font-medium">
            <Shield className="h-4 w-4" />
            Legal
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Data Processing Agreement</h1>
          <p className="text-xl text-cyan-50 max-w-2xl mx-auto">
            GDPR Article 28 Compliance
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* DPA Scope Notice */}
        <div className="bg-white border-l-4 border-primary rounded-xl shadow-md p-6 md:p-8 mb-8">
          <p className="text-gray-800 text-lg font-medium">
            This Data Processing Agreement applies to customers using SnappArchive as a data processor under the GDPR.
          </p>
        </div>

        {/* What is a DPA */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            What is a Data Processing Agreement?
          </h2>
          <p className="text-gray-700 text-lg mb-4">
            A Data Processing Agreement (DPA) is a legally required contract under GDPR Article 28 between a Data Controller (you, the customer) and a Data Processor (SnappArchive). It outlines how personal data is handled, protected, and processed when you use our Services.
          </p>
          <p className="text-gray-700 text-lg">
            Our DPA ensures full compliance with European data protection laws, including GDPR and Belgian privacy regulations.
          </p>
        </div>

        {/* Key DPA Terms */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Key DPA Terms
          </h2>

          <div className="space-y-8">
            {/* 1. Processing Instructions */}
            <div className="border-l-4 border-primary pl-6">
              <div className="flex items-start gap-3 mb-3">
                <FileText className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <h3 className="text-xl font-bold text-gray-900">1. Processing Instructions</h3>
              </div>
              <p className="text-gray-700 mb-2">
                SnappArchive processes personal data solely on your documented instructions and only for the purpose of delivering the Services.
              </p>
              <p className="text-gray-700">
                We will promptly inform you if any instruction appears to violate GDPR or applicable law.
              </p>
            </div>

            {/* 2. Data Security */}
            <div className="border-l-4 border-primary pl-6">
              <div className="flex items-start gap-3 mb-3">
                <Lock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <h3 className="text-xl font-bold text-gray-900">2. Data Security (Technical & Organizational Measures)</h3>
              </div>
              <p className="text-gray-700 mb-4">
                We implement strong security measures in accordance with GDPR Article 32, including:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">TLS 1.3 encryption for data in transit</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">AES-256 encryption for data at rest</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Role-based access control (RBAC)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Multi-factor authentication where supported.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Audit logging and monitoring where applicable.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Encrypted, geo-redundant EU backups</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Periodic security testing and reviews.</span>
                </div>
              </div>
              <p className="text-gray-600 italic mt-4 text-sm">
                A detailed list of Technical and Organizational Measures (TOMs) is included in the signed DPA.
              </p>
            </div>


            {/* 3. EU Data Residency */}
            <div className="border-l-4 border-primary pl-6">
              <div className="flex items-start gap-3 mb-3">
                <Server className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <h3 className="text-xl font-bold text-gray-900">3. EU Data Residency</h3>
              </div>
              <p className="text-gray-700 mb-2">
                All data is stored and processed exclusively within the European Union.
              </p>
              <p className="text-gray-700">
                Documents, metadata, and backups never leave EU infrastructure.
              </p>
            </div>

            {/* 4. Sub-Processors */}
            <div className="border-l-4 border-primary pl-6">
              <div className="flex items-start gap-3 mb-3">
                <Database className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <h3 className="text-xl font-bold text-gray-900">4. Sub-Processors</h3>
              </div>
              <p className="text-gray-700 mb-3">
                We only work with carefully vetted, GDPR-compliant sub-processors.
              </p>
              <p className="text-gray-700 mb-3">Each sub-processor:</p>
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">is bound by a Data Processing Agreement</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">may process data only according to our instructions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">must meet our technical and organizational security standards</span>
                </div>
              </div>
              <p className="text-gray-700 mb-2">
                A full sub-processor list is available upon request at hello@snapparchive.eu.
              </p>
              <p className="text-gray-700">
                Customers will be notified prior to the addition or replacement of sub-processors.
              </p>
            </div>

            {/* 5. Confidentiality */}
            <div className="border-l-4 border-primary pl-6">
              <div className="flex items-start gap-3 mb-3">
                <Lock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <h3 className="text-xl font-bold text-gray-900">5. Confidentiality</h3>
              </div>
              <p className="text-gray-700 mb-2">
                All SnappArchive personnel are subject to strict confidentiality obligations.
              </p>
              <p className="text-gray-700">
                Access to customer data is restricted and granted only when necessary for support or security purposes, and only under controlled conditions.
              </p>
            </div>

            {/* 6. Data Breach Notification */}
            <div className="border-l-4 border-primary pl-6">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <h3 className="text-xl font-bold text-gray-900">6. Data Breach Notification</h3>
              </div>
              <p className="text-gray-700 mb-3">
                If a personal data breach affecting your documents occurs, we will notify you:
              </p>
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">without undue delay and, where applicable, within 72 hours, as required by GDPR Articles 33–34.</span>
                </div>
              </div>
              <p className="text-gray-700">
                The notification includes the nature of the breach, its potential impact, and the measures taken.
              </p>
            </div>


            {/* 7. Data Subject Rights Support */}
            <div className="border-l-4 border-primary pl-6">
              <div className="flex items-start gap-3 mb-3">
                <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <h3 className="text-xl font-bold text-gray-900">7. Data Subject Rights Support</h3>
              </div>
              <p className="text-gray-700 mb-3">
                We assist you in fulfilling all GDPR data subject rights requests, including:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Access</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Rectification</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Erasure</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Restriction</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Objection</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Data portability</span>
                </div>
              </div>
              <p className="text-gray-700 mt-3">
                We provide support in accordance with your obligations as Data Controller.
              </p>
            </div>

            {/* 8. Data Return & Deletion */}
            <div className="border-l-4 border-primary pl-6">
              <div className="flex items-start gap-3 mb-3">
                <FileText className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <h3 className="text-xl font-bold text-gray-900">8. Data Return & Deletion</h3>
              </div>
              <p className="text-gray-700 mb-3">
                Upon termination or at your request:
              </p>
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">All documents are permanently deleted within 30 days</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Backups are also erased according to their standard 30-day cycle</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">You may request a full export or return of your data before deletion</span>
                </div>
              </div>
              <p className="text-gray-700">
                No customer data is retained beyond the agreed retention periods.
              </p>
            </div>

            {/* 9. Audit Rights */}
            <div className="border-l-4 border-primary pl-6">
              <div className="flex items-start gap-3 mb-3">
                <FileText className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <h3 className="text-xl font-bold text-gray-900">9. Audit Rights</h3>
              </div>
              <p className="text-gray-700 mb-2">
                You may audit SnappArchive's compliance with the DPA, subject to reasonable notice, scope, and confidentiality requirements, and typically fulfilled through documentation or third-party reports. Subject to reasonable notice and confidentiality requirements.
              </p>
              <p className="text-gray-700">
                We also provide third-party audit documentation upon request.
              </p>
            </div>
          </div>
        </div>

        {/* Data Controller vs Data Processor */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Data Controller vs. Data Processor
          </h2>

          {/* You - Data Controller */}
          <div className="bg-blue-50 border-2 border-primary rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
              <h3 className="text-2xl font-bold text-gray-900">You (The Customer) — Data Controller</h3>
            </div>
            <p className="text-gray-700 mb-3">
              You determine the purposes and means of processing the personal data contained in your uploaded documents.
            </p>
            <p className="text-gray-700">
              You are responsible for ensuring your use of the Services complies with GDPR and other applicable laws.
            </p>
          </div>

          {/* SnappArchive - Data Processor */}
          <div className="bg-gray-50 border-2 border-primary rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <FileText className="h-8 w-8 text-gray-600 mt-1 flex-shrink-0" />
              <h3 className="text-2xl font-bold text-gray-900">SnappArchive — Data Processor</h3>
            </div>
            <p className="text-gray-700 mb-3">
              We process your documents exclusively:
            </p>
            <div className="space-y-2 mb-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">in accordance with your instructions</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">under GDPR Article 28</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  without using your documents for AI training or any other purpose unless you explicitly opt-in or provide written consent
                </span>
              </div>
            </div>
            <p className="text-gray-700">
              We do not act as a joint controller.
            </p>
          </div>
        </div>

        {/* Request a Signed DPA */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-primary rounded-2xl p-8 md:p-12 text-center">
          <Mail className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Request a Signed DPA
          </h2>
          <p className="text-gray-700 text-lg mb-4 max-w-2xl mx-auto">
            Enterprise customers requiring a fully executed DPA can request a signed agreement.
          </p>
          <p className="text-gray-700 text-lg mb-8 max-w-2xl mx-auto">
            We typically aim to provide executed DPAs within approximately 5 business days.
          </p>
          <a
            href="mailto:hello@snapparchive.eu"
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg shadow-lg"
          >
            <Mail className="h-5 w-5" />
            hello@snapparchive.eu
          </a>
        </div>

        {/* Important Notes */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mt-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Important Notes
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-1">•</span>
              <span>A DPA is required under GDPR when using SaaS platforms that process personal data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-1">•</span>
              <span>Our DPA is based on EU Standard Contractual Clauses (SCCs) and GDPR Article 28 requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-1">•</span>
              <span>The DPA complements our Privacy Policy and Terms of Service</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-1">•</span>
              <span>All processing activities are logged, documented, and auditable</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DataProcessing;