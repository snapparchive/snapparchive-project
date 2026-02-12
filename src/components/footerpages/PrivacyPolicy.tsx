import React from 'react';
import { Shield, Mail, Lock, Eye, AlertCircle } from 'lucide-react';

function PrivacyPolicy() {

  const sections = [
    {
      id: 'intro',
      title: '1. Introduction',
      content: `This Privacy Policy describes how SnappArchive ("we," "our," or "us") collects, uses, processes, and protects your personal data when you use our AI-powered document digitization, OCR, classification, and archiving services (the "Services"). We are committed to protecting your privacy and ensuring compliance with the General Data Protection Regulation (GDPR) and Belgian data protection law.

By using our Services, you agree to the collection and use of information in accordance with this policy. If you do not agree with this policy, please do not use our Services.`
    },
    {
      id: 'controller',
      title: '2. Who We Are (Data Controller)',
      content: `SnappArchive is the data controller responsible for your personal data processed through our Services. We are headquartered in the European Union and operate under EU and Belgian data protection regulations.`,
      subsections: [
        {
          label: 'Contact Information:',
          items: [
            'Email: hello@snapparchive.eu',
            'Data Protection Officer (DPO): To be appointed (contact via hello@snapparchive.eu until formally designated)',
          ]
        }
      ]
    },
    {
      id: 'collection',
      title: '3. What Personal Data We Collect',
      content: 'We collect and process the following categories of personal data:',
      subsections: [
        {
          title: '3.1 Account Information',
          items: [
            'Full name',
            'Email address',
            'Company name, size, and industry',
            'Login credentials (passwords are hashed using industry-standard one-way hashing algorithms such as bcrypt, scrypt, or Argon2. Passwords are never stored in plain text)',
          ]
        },
        {
          title: '3.2 Billing and Payment Information',
          items: [
            'Billing address and company VAT number',
            'Payment information (processed securely through third-party payment processors; we do not store credit card numbers directly)'
          ]
        },
        {
          title: '3.3 Document Data',
          items: [
            'Document files (PDFs, images, scanned documents)',
            'Extracted text from OCR processing',
            'Document metadata (file name, upload date, file size, format)',
            'AI-generated classification tags and categories',
            'Search queries performed within your document archive'
          ]
        },
        {
          title: '3.4 Usage and Technical Data',
          items: [
            'IP address, browser type, operating system, and device information',
            'Audit logs and access records (who accessed what document and when)',
            'Usage analytics (features used, time spent, error logs)',
            'Cookies and similar tracking technologies'
          ]
        }
      ]
    },
    {
      id: 'legal',
      title: '4. Legal Basis for Processing (GDPR Article 6)',
      content: 'We process your personal data based on the following legal grounds:',
      subsections: [
        { text: 'Contract Performance (Art. 6(1)(b)): Processing necessary to provide the Services you requested and perform our contractual obligations.' },
        { text: 'Legitimate Interests (Art. 6(1)(f)): Processing necessary for our legitimate business interests, such as improving our Services, fraud prevention, and system security, provided these interests do not override your fundamental rights.' },
        { text: 'Legal Obligation (Art. 6(1)(c)): Processing necessary to comply with legal obligations, including tax, accounting, and Belgian company law requirements.' },
        { text: 'Consent (Art. 6(1)(a)): Where you have provided explicit consent for specific processing activities (e.g., marketing communications), which you may withdraw at any time.' }
      ]
    },
    {
      id: 'usage',
      title: '5. How We Use Personal Data',
      content: 'We use your personal data for the following purposes:',
      list: [
        'To create, manage, and authenticate your account',
        'To provide, operate, maintain, and improve the Services',
        'To process and digitize your uploaded documents using OCR and AI classification',
        'To enable intelligent search and document retrieval',
        'To process billing and payments',
        'To communicate with you regarding service updates, technical support, security alerts, and account notifications',
        'To prevent fraud, abuse, and unauthorized access',
        'To comply with legal and regulatory obligations',
        'To analyze usage patterns and improve our AI models and Services'
      ]
    },
    {
      id: 'processing',
      title: '6. Document Processing (Processor Role)',
      content: `When you upload documents to SnappArchive, we act as a Data Processor on your behalf (GDPR Article 28). You remain the Data Controller of the documents and any personal data contained within them.
We process customer-uploaded documents solely in accordance with your instructions and our Data Processing Agreement (DPA). We do not use the content of your documents for any purpose other than providing the Services to you.
We do not use customer documents or extracted text to train AI models unless you have explicitly opted-in or provided written consent.
A Data Processing Agreement (DPA) is available upon request for enterprise customers. Contact hello@snapparchive.eu to request a DPA.`
    },
    {
      id: 'security',
      title: '7. Data Storage & Security',
      content: 'We implement technical and organizational measures to protect your data in compliance with GDPR Article 32:',
      subsections: [
        {
          title: '7.1 Encryption',
          items: [
            'Data in Transit: Data transmitted between your device and our servers is encrypted using TLS 1.3.',
            'Data at Rest: Stored data, including documents and databases, is encrypted using AES-256 encryption.'
          ]
        },
        {
          title: '7.2 Access Controls',
          items: [
            'Role-based access control (RBAC) ensuring users only access data they are authorized to view',
            'Multi-factor authentication (MFA) may be enabled for accounts where supported.',
            'Zero-knowledge principles are applied where technically feasible.'
          ]
        },
        {
          title: '7.3 Infrastructure Security',
          items: [
            'EU-based hosting exclusively — all data is stored in secure, geo-redundant data centers located within the European Union',
            'Regular security reviews and testing.',
            'Intrusion detection and prevention systems',
            'Automated backup systems with 30-day retention (also stored exclusively in the EU)'
          ]
        },
        {
          title: '7.4 Employee Access',
          items: [
            'SnappArchive employees cannot access your documents or personal data under normal circumstances.',
            'Access is granted only when absolutely necessary for technical support or security purposes.',
            'Access is only provided with your explicit permission or when required by law.'
          ]
        }
      ]
    },

    {
      id: 'data-sharing',
      title: '8. Data Sharing & Third Parties',
      content: 'We do not sell, rent, or trade your personal data. We may share your data only in the following limited circumstances:',
      subsections: [
        {
          title: '8.1 Service Providers (Data Processors)',
          items: [
            'We engage trusted third-party service providers to assist in operating the Services, including:',
            'Cloud infrastructure providers (EU-based only)',
            'Payment processors (Stripe, Mollie, or similar GDPR-compliant providers)',
            'Email service providers for transactional emails',
            'Analytics and monitoring tools (anonymized data only)',
            'All service providers are bound by data processing agreements and are required to process data only on our instructions and in compliance with GDPR.',
          ]
        },
        {
          title: '8.2 Legal Requirements',
          items: [
            'We may disclose your personal data if required to do so by law, court order, or government authority, or if necessary to protect our legal rights, prevent fraud, or ensure the safety of our users.'
          ]
        },
        {
          title: '8.3 Business Transfers',
          items: [
            'In the event of a merger, acquisition, or sale of assets, your personal data may be transferred to the successor entity. We will notify you of any such change and ensure the successor entity continues to comply with this Privacy Policy and GDPR.'
          ]
        },
      ]
    },
    {
      id: 'rights',
      title: '9. Your GDPR Rights',
      content: 'Under GDPR Articles 13–22 and Belgian data protection law, you have the following rights:',
      list: [
        'Right of Access (Art. 15): Request a copy of the personal data we hold about you.',
        'Right to Rectification (Art. 16): Request correction of inaccurate or incomplete data.',
        'Right to Erasure / "Right to be Forgotten" (Art. 17): Request deletion of your personal data.',
        'Right to Restriction of Processing (Art. 18): Request that we limit how we use your data.',
        'Right to Object (Art. 21): Object to processing based on legitimate interests or for direct marketing purposes.',
        'Right to Data Portability (Art. 20): Request your data in a structured, commonly used, and machine-readable format.',
        'Right to Withdraw Consent: Withdraw consent at any time.'
      ],
      footer: 'To exercise any of these rights, contact us at hello@snapparchive.eu. We will respond within 30 days as required by GDPR Article 12.'
    },
    {
      id: 'retention',
      title: '10. Data Retention',
      content: 'We retain personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy or as required by law:',
      subsections: [
        {
          title: 'Account Data',
          items: [
            'Retained for the duration of your active account.',
            'Upon account deletion, personal data is permanently deleted within 30 days, except where retention is legally required.'
          ]
        },
        {
          title: 'Documents',
          items: [
            'Retained only as long as you choose to store them.',
            'You may delete documents at any time.',
            'Documents are permanently removed from our systems within 30 days (including from backups).'
          ]
        },
        {
          title: 'Billing Data',
          items: [
            'Retained for 7 years in accordance with Belgian accounting and tax law requirements.'
          ]
        },
        {
          title: 'Backup Data',
          items: [
            'Backups are retained for a maximum of 30 days and are automatically purged thereafter.'
          ]
        },
        {
          title: 'Audit Logs',
          items: [
            'Retained for 12 months for security and compliance purposes, then anonymized or deleted.'
          ]
        }
      ]
    },
    {
      id: 'cookies',
      title: '11. Cookies & Tracking Technologies',
      content: 'We use cookies and similar tracking technologies to improve your experience and analyze usage of our Services. Cookies are small data files stored on your device.',
      subsections: [
        {
          title: 'Types of Cookies We Use',
          items: [
            'Essential Cookies: Necessary for the Services to function (e.g., session management, authentication). These cannot be disabled.',
            'Security Cookies: Used to detect and prevent fraudulent activity and enhance security.',
            'Analytics Cookies: Used to understand how users interact with our Services (anonymized data). We use privacy-friendly analytics tools.',
            'We do not use advertising or third-party tracking cookies.'
          ]
        },
        {
          title: 'Managing Cookies',
          items: [
            'You can control and manage cookies through your browser settings.',
            'Disabling essential cookies may affect the functionality of the Services.'
          ]
        }
      ]
    },
    {
      id: 'international',
      title: '12. International Data Transfers',
      content: 'SnappArchive processes and stores all personal data exclusively within the European Union. Our servers and data centers are located in EU member states, ensuring full compliance with GDPR data localization requirements.',
      subsections: [
        {
          title: 'Data Transfers Outside the EU',
          items: [
            'Only transferred to countries with an EU adequacy decision under GDPR Article 45',
            'If no adequacy decision exists, EU Standard Contractual Clauses (SCCs) under GDPR Article 46 are implemented to ensure adequate protection',
            'You will be notified of any such transfers and the safeguards applied'
          ]
        }
      ]
    },

    {
      id: 'childrensprivacy',
      title: '13. Childrens Privacy',
      content: 'Our Services are not intended for individuals under 16 years of age. We do not knowingly collect personal data from children under 16. If you are a parent or guardian and believe your child has provided us with personal data, please contact us immediately at hello@snapparchive.eu, and we will delete such information promptly.',

    },
    {
      id: 'changes',
      title: '14. Changes to This Privacy Policy',
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or Services. When we make material changes, we will:
- Update the "Last updated" date at the top of this page
- Notify you via email (for significant changes affecting your rights)
- Prominently display a notice on our website or within the Services
We encourage you to review this Privacy Policy periodically. Your continued use of the Services after changes are posted constitutes your acceptance of the updated policy.`
    },
    {
      id: 'contact',
      title: '15. Contact Information & DPO',
      content: 'If you have any questions, concerns, or requests regarding this Privacy Policy or how we process your personal data, please contact us:',
      subsections: [
        { items: ['Email: hello@snapparchive.eu', 'DPO: To be formally appointed (contact via hello@snapparchive.eu)'] }
      ],
      footer: 'We are committed to resolving any privacy concerns in a timely and transparent manner.'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 py-20">
        <div className="container mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full mb-6 font-medium">
            <Shield className="h-4 w-4" />
            Legal
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">Privacy Policy</h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-12">

          {sections.map((section) => {
            return (
              <section key={section.id}>

                <div className="flex items-start gap-4 mb-4">

                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>

                <p className="text-gray-700 whitespace-pre-line mb-4">{section.content}</p>

                {/* List */}
                {section.list && (
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    {section.list.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}

                {/* Subsections */}
                {section.subsections && section.subsections.map((sub, i) => (
                  <div key={i} className="mt-4">
                    {'title' in sub && sub.title && (
                      <h3 className="font-semibold text-gray-900 mb-2">{sub.title}</h3>
                    )}

                    {'label' in sub && sub.label && (
                      <p className="font-semibold text-gray-800">{sub.label}</p>
                    )}

                    {'items' in sub && sub.items && (
                      <ul className="list-disc ml-6 space-y-1 text-gray-700">
                        {sub.items.map((item, k) => <li key={k}>{item}</li>)}
                      </ul>
                    )}

                    {'text' in sub && sub.text && (
                      <p className="text-gray-700">{sub.text}</p>
                    )}
                  </div>
                ))}


                {/* Footer */}
                {section.footer && (
                  <p className="mt-4 text-gray-700">{section.footer}</p>
                )}

              </section>
            );
          })}

        </div>
      </div>

    </div>
  );
}

export default PrivacyPolicy;
