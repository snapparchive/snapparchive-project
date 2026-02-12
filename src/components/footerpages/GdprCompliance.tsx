import React from 'react';
import { Shield, Lock, Eye, AlertCircle, Mail } from 'lucide-react';

function GdprCompliance() {
    const sections = [
        {
            id: 'intro',
            title: '1. Introduction',
            content: `This page outlines SnappArchive's commitment to compliance with the General Data Protection Regulation (GDPR), EU Regulation 2016/679, and Belgian data protection law. SnappArchive provides AI-powered document digitization, OCR, classification, and archiving services designed with privacy, security, and regulatory compliance at the core.

By using SnappArchive, you benefit from enterprise-grade data protection practices that align with the strictest European privacy standards.`
        },
        {
            id: 'commitment',
            title: '2. GDPR Compliance Commitment',
            content: `SnappArchive is fully committed to complying with GDPR and Belgian data protection requirements. We implement comprehensive technical and organizational measures to ensure all personal data is processed lawfully, fairly, transparently, and securely.

Our compliance program includes periodic internal compliance reviews, employee training, data protection impact assessments where required, incident response procedures, and continuous monitoring of regulatory developments. We are working toward ISO 27001 alignment and readiness to further strengthen our information security management systems.`
        },

        {
            id: 'roles',
            title: '3. Data Controller & Data Processor Roles',
            content: 'Under GDPR Article 4, it is essential to distinguish between the roles of Data Controller and Data Processor:',
            subsections: [
                {
                    title: '3.1 SnappArchive as Data Controller',
                    items: [
                        'Account information (name, email, company details)',
                        'Billing and payment information',
                        'Platform usage data, audit logs, and analytics',
                        'Support and communication records',
                        'As Data Controller for this information, SnappArchive determines the purposes and means of processing and bears full responsibility for GDPR compliance.'
                    ]
                },
                {
                    title: '3.2 Customer as Data Controller / SnappArchive as Data Processor',
                    items: [
                        'You remain the Data Controller of all documents and any personal data contained within them.',
                        'SnappArchive acts solely as a Data Processor under GDPR Article 28, processing your documents exclusively in accordance with your instructions and the terms of our Data Processing Agreement (DPA).',
                        'We do not use, disclose, or access the content of your documents for any purpose other than providing the Services.',
                        'We do not use customer documents or extracted text to train AI models unless you explicitly consent.',
                        'A Data Processing Agreement (DPA) is available upon request for enterprise customers. Contact hello@snapparchive.eu to request a signed DPA.'
                    ]
                }
            ]
        },
        {
            id: 'lawful-basis',
            title: '4. Lawful Basis for Processing',
            content: `All personal data processing activities conducted by SnappArchive are mapped to lawful bases defined under GDPR Article 6(1):`,
            subsections: [
                { text: 'Contract Performance (Art. 6(1)(b)): Processing necessary to deliver the Services and fulfill our contractual obligations to you.' },
                { text: 'Legitimate Interests (Art. 6(1)(f)): Processing necessary for fraud prevention, system security, service improvement, and business operations, provided these interests do not override your fundamental rights.' },
                { text: 'Legal Obligation (Art. 6(1)(c)): Processing required to comply with legal obligations, including tax, accounting, and Belgian regulatory requirements.' },
                { text: 'Consent (Art. 6(1)(a)): Processing based on your explicit consent for specific purposes, such as marketing communications. You may withdraw consent at any time.' },
                { text: 'Special categories of personal data (GDPR Article 9) are only processed when explicitly authorized by you or where legally required, and additional safeguards are applied.' }
            ]
        },
        {
            id: 'principles',
            title: '5. GDPR Data Protection Principles',
            content: 'SnappArchive adheres to the six core data protection principles set forth in GDPR Article 5:',
            list: [
                'Lawfulness, Fairness, and Transparency: All data processing is lawful, fair, and transparent.',
                'Purpose Limitation: Personal data is collected only for specified, explicit, and legitimate purposes.',
                'Data Minimization: Only the minimum personal data necessary is collected and processed.',
                'Accuracy: Personal data is kept accurate and up-to-date.',
                'Storage Limitation: Data is retained only as long as necessary or legally required.',
                'Integrity and Confidentiality (Security): Data is protected against unauthorized access, loss, destruction, or damage.'
            ]
        },
        {
            id: 'rights',
            title: '6. Data Subject Rights',
            content: 'Under GDPR Articles 15–22, you have the following rights:',
            list: [
                'Right of Access (Art. 15)',
                'Right to Rectification (Art. 16)',
                'Right to Erasure / "Right to be Forgotten" (Art. 17)',
                'Right to Restriction of Processing (Art. 18)',
                'Right to Data Portability (Art. 20)',
                'Right to Object (Art. 21)',
                'Rights Related to Automated Decision-Making and Profiling (Art. 22)',
                'Right to Withdraw Consent'
            ],
            subsections: [
                {
                    title: 'Details:',
                    items: [
                        'Access: Obtain confirmation of processing and a copy of your data.',
                        'Rectification: Correct inaccurate or incomplete personal data.',
                        'Erasure: Request deletion when data is no longer necessary.',
                        'Restriction: Limit processing under certain circumstances.',
                        'Portability: Receive data in a machine-readable format and transmit it to another controller.',
                        'Object: Object to processing for legitimate interests or marketing.',
                        'Automated Decision-Making: Request human review of automated decisions.'
                    ]
                }
            ]
        },
        {
            id: 'security',
            title: '7. Data Security Measures',
            content: 'SnappArchive implements state-of-the-art technical and organizational security measures:',
            subsections: [
                {
                    title: '7.1 Encryption',
                    items: [
                        'Data in Transit: TLS 1.3 encryption',
                        'Data at Rest: AES-256 encryption'
                    ]
                },
                {
                    title: '7.2 Access Controls',
                    items: [
                        'Role-based access control (RBAC)',
                        'Multi-factor authentication (MFA) where supported',
                        'Zero-knowledge principles where applicable',
                        'Audit logging of document access where technically feasible'
                    ]
                },
                {
                    title: '7.3 Infrastructure and Hosting',
                    items: [
                        'All data stored in EU-based, geo-redundant data centers',
                        'EU data residency guaranteed',
                        'Penetration testing and third-party security audits',
                        'Intrusion detection and prevention systems',
                        'Automated backup systems with encrypted storage (30-day retention, EU-only)'
                    ]
                },
                {
                    title: '7.4 Organizational Measures',
                    items: [
                        'Employee training on data protection and GDPR compliance',
                        'Confidentiality agreements for staff with access to personal data',
                        'Incident response and breach notification procedures',
                        'Regular review and updating of security policies'
                    ]
                }
            ]
        },

        {
            id: 'dpia',
            title: '8. Data Protection Impact Assessments (DPIA)',
            content: 'DPIAs are performed for high-risk processing activities to identify and mitigate privacy risks before implementation.'
        },
        {
            id: 'retention',
            title: '9. Data Retention Policies',
            content: 'SnappArchive retains personal data only as long as necessary:',
            subsections: [
                { title: 'Account Data', items: ['Retained for the duration of your active account, deleted within 30 days upon account deletion, except where legally required.'] },
                { title: 'Documents', items: ['Retained only as long as you choose to store them. Deleted within 30 days including backups.'] },
                { title: 'Billing Data', items: ['Retained for 7 years according to Belgian law.'] },
                { title: 'Backup Data', items: ['Retained for a maximum of 30 days.'] },
                { title: 'Audit Logs', items: ['Retained for 12 months, then anonymized or deleted.'] }
            ]
        },
        {
            id: 'subprocessors',
            title: '10. Sub-Processors',
            content: 'SnappArchive engages trusted third-party sub-processors. All sub-processors are GDPR compliant and bound by Data Processing Agreements. Contact hello@snapparchive.eu for a current list.'
        },
        {
            id: 'transfers',
            title: '11. International Data Transfers',
            content: 'All personal data is stored and processed exclusively within the EU. Transfers outside the EU occur only with adequate safeguards, SCCs, or other GDPR-compliant measures. Notifications are provided for such transfers.'
        },
        {
            id: 'breach',
            title: '12. Data Breach Procedures',
            content: 'SnappArchive has incident response and data breach notification procedures in accordance with GDPR Articles 33 and 34. Relevant authorities and affected individuals are notified without undue delay and in accordance with GDPR Articles 33 and 34.'
        },

        {
            id: 'exercising-rights',
            title: '13. Exercising Your Rights',
            content: 'You can exercise your GDPR rights through account settings or by contacting hello@snapparchive.eu. Requests are processed within 30 days or extended up to 90 days if complex.'
        },
        {
            id: 'complaints',
            title: '14. Complaints',
            content: (
                <>
                    If you believe SnappArchive has not handled your data according to GDPR or Belgian law, you can lodge a complaint with the Belgian Data Protection Authority: <br />
                    Website:{' '}
                    <a
                        href="https://www.gegevensbeschermingsautoriteit.be"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    >
                        www.gegevensbeschermingsautoriteit.be
                    </a>
                    <br />
                    Email: contact@apd-gba.be
                </>
            )
        },
        {
            id: 'contact',
            title: '15. Contact Information',
            content: (
                <>
                    Email: hello@snapparchive.eu <br />
                    Data Protection Officer (DPO): Will be appointed when legally required. Until then, direct inquiries to hello@snapparchive.eu.
                </>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
            {/* HERO */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 py-20">
                <div className="container mx-auto px-4 text-center text-white">
                    <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full mb-6 font-medium">
                        <Shield className="h-4 w-4" />
                        Legal Compliance
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-4">GDPR Compliance</h1>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-12">
                    {sections.map((section) => {
                        return (
                            <section key={section.id}>
                                <div className="flex items-start gap-4 mb-4">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{section.title}</h2>
                                </div>

                                {typeof section.content === 'string' ? (
                                    <p className="text-gray-700 whitespace-pre-line mb-4">{section.content}</p>
                                ) : (
                                    <div className="text-gray-700 mb-4">{section.content}</div>
                                )}

                                {section.list && (
                                    <ul className="list-disc ml-6 space-y-2 text-gray-700">
                                        {section.list.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                                {section.subsections && section.subsections.map((sub, i) => (
                                    <div key={i} className="mt-4">
                                        {'title' in sub && (
                                            <h3 className="font-semibold text-gray-900 mb-2">{sub.title}</h3>
                                        )}

                                        {'items' in sub && (
                                            <ul className="list-disc ml-6 space-y-1 text-gray-700">
                                                {sub.items.map((item, k) => <li key={k}>{item}</li>)}
                                            </ul>
                                        )}

                                        {'text' in sub && (
                                            <p className="text-gray-700">{sub.text}</p>
                                        )}
                                    </div>
                                ))}



                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default GdprCompliance;
