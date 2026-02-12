import React from 'react';
import { Shield, Lock, Key, Server, AlertCircle, Database, CheckCircle, Award, Mail } from 'lucide-react';

function Security() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* HERO */}
      <div className="relative overflow-hidden bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full mb-6 font-medium">
            <Shield className="h-4 w-4" />
            Security & Infrastructure
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Security at SnappArchive
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            SnappArchive is built with security, privacy, and GDPR compliance at its core. We apply industry-leading security practices, EU-only infrastructure, and strict data protection controls to ensure that all documents and personal data remain protected at every stage.
          </p>
        </div>
      </div>

      {/* CORE SECURITY PRINCIPLES */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Core Security Principles
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our security framework is built on multiple layers of protection, ensuring your documents remain safe at every stage of processing, storage, and transmission.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Encryption Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <Lock className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Encryption</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">TLS 1.3 encryption for all data in transit</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">AES-256 encryption for all data at rest</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Encrypted backups stored exclusively in the EU</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Industry-standard cryptography aligned with ISO/IEC 27001 principles</span>
              </div>
            </div>
          </div>

          {/* Access Control Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <Key className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Access Control & Authentication
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Role-based access control (RBAC)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Multi-Factor Authentication (MFA) is supported for accounts where available.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Strict least-privilege access enforcement</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Zero-trust security principles are applied across our access control model.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Customer documents are not accessed by staff except where strictly necessary for support, security, or legal obligations, and always under controlled conditions.
                </span>
              </div>
            </div>
          </div>


          {/* Infrastructure Security Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <Server className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Infrastructure Security</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Hosted in EU-based data centers operated by providers with ISO 27001-certified facilities.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Firewalls, intrusion detection, and automated threat monitoring</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Geo-redundant storage and failover capabilities</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Continuous infrastructure monitoring</span>
              </div>
            </div>
          </div>
        </div>

        {/* Application Security */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-16">
          <div className="flex items-start gap-4 mb-6">
            <Shield className="h-10 w-10 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Security</h3>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Periodic internal security testing and reviews.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Vulnerability scanning and dependency analysis as part of the development process.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Secure development lifecycle following OWASP standards</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Automated dependency scanning and code auditing</span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLIANCE & CERTIFICATIONS */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Compliance & Certifications
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              SnappArchive is committed to meeting the highest security and compliance standards recognized across Europe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* GDPR Compliant */}
            <div className="bg-blue-50 border-2 border-cyan-200 rounded-2xl p-8 text-center">
              <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">GDPR Compliant</h3>
              <p className="text-gray-700 mb-6">
                Fully aligned with the EU General Data Protection Regulation and Belgian data protection law.
              </p>
              <div className="space-y-2">
                <a href="/privacy" className="block text-primary hover:text-cyan-700 font-medium">
                  Privacy Policy →
                </a>
                <a href="/gdpr-compliance" className="block text-primary hover:text-cyan-700 font-medium">
                  GDPR Compliance →
                </a>
                <a href="/data-processing" className="block text-primary hover:text-cyan-700 font-medium">
                  Data Processing Agreement →
                </a>
              </div>
            </div>

            {/* ISO 27001 */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8 text-center">
              <Award className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">ISO 27001 (In Progress)</h3>
              <p className="text-gray-700">
                We are actively aligning our security controls with ISO/IEC 27001 standards. Formal certification is part of our ongoing roadmap.
              </p>

            </div>

            {/* EU-Based Infrastructure */}
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
              <Database className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">EU-Based Infrastructure</h3>
              <p className="text-gray-700">
                100% EU data residency — documents, metadata, backups, and logs never leave the European Union. All infrastructure runs inside certified European data centers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* INCIDENT RESPONSE & MONITORING */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="h-10 w-10 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                Incident Response & Monitoring
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                SnappArchive maintains comprehensive security monitoring and incident response capabilities to detect, respond to, and mitigate security threats in real-time.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Continuous monitoring of infrastructure and security events.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">GDPR-compliant breach notification (Breach notification without undue delay and, where applicable, within 72 hours.)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Formal incident response plan</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Logged events, audit trails, and forensic-ready monitoring</span>
            </div>
          </div>
        </div>

        {/* BACKUPS & DISASTER RECOVERY */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
          <div className="flex items-start gap-4 mb-6">
            <Database className="h-10 w-10 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                Backups & Disaster Recovery
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                We implement robust backup and disaster recovery procedures to ensure business continuity and data availability in the event of system failures or emergencies.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Automated encrypted backups</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">30-day rolling retention</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Disaster recovery procedures are documented and periodically reviewed.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">EU-only redundant storage locations</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUESTIONS ABOUT SECURITY */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white border-2 border-primary rounded-2xl p-8 md:p-12 text-center">
            <Mail className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Questions About Security?
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              Have questions about our security, compliance, or infrastructure?
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Our team is available to support enterprise assessments or compliance reviews.
            </p>
            <a
              href="mailto:hello@snapparchive.eu"
              className="inline-flex items-center gap-3 bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg shadow-lg"
            >
              <Mail className="h-5 w-5" />
              hello@snapparchive.eu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Security;