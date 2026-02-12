import React from "react";
import { Shield } from "lucide-react";


function TermsOfService() {
    const sections = [
        {
            title: "1. Introduction and Acceptance",
            text: `Welcome to SnappArchive. These Terms of Service ("Terms") govern your access to and use of SnappArchive's AI-powered document digitization, OCR, classification, and archiving services (the "Services"). By creating an account or using our Services, you agree to be bound by these Terms. 

If you do not agree to these Terms, you may not access or use the Services. If you are using the Services on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.`,
        },
        {
            title: "2. Definitions",
            items: [
                `"Services" means SnappArchive's AI-powered document digitization, OCR, classification, archiving platform, and all related features, tools, and functionalities provided through our website, mobile applications, and APIs.`,
                `"Customer" means the individual or legal entity that creates an account and subscribes to the Services.`,
                `"User" means any individual authorized by the Customer to access and use the Services under the Customer's account.`,
                `"Your Content" means all documents, files, data, text, images, and other materials uploaded, stored, or processed by you or your Users through the Services.`,
                `"Personal Data" means any information relating to an identified or identifiable natural person as defined under GDPR and applicable data protection laws.`,
                `"Account Data" means information related to your account, including name, email address, billing information, company details, and platform usage data.`,
                `"Data Processing Agreement" or "DPA" means the agreement governing SnappArchive's processing of Personal Data contained in Your Content, available upon request for enterprise customers.`,
                `"EU Data Centers" means secure, geo-redundant data centers located exclusively within the European Union where all data is stored and processed.`,
                `"Beta Services" means features, functionalities, or versions of the Services designated as beta, pilot, early access, or similar pre-release status.`,
                `"Documentation" means user guides, technical documentation, help articles, and other materials provided by SnappArchive to assist in using the Services.`,
            ],
        },
        {
            title: "3. Service Description",
            items: [
                "Upload and digitize documents (PDFs, images, scanned files)",
                "Extract text using AI-powered Optical Character Recognition (OCR)",
                "Automatically classify and categorize documents using machine learning",
                "Search, organize, and retrieve documents through intelligent search",
                "Store documents securely in EU Data Centers",
                "Manage document workflows and access controls",
            ],
            text: `The Services are designed for businesses and individuals seeking to modernize their document management processes while maintaining full compliance with European data protection regulations.`,
        },
        {
            title: "4. Account Creation and Security",
            text: `To use the Services, you must create an account and maintain accurate Account Data. You are responsible for account security, including credentials and all activities under your account.`,
            items: [
                "Maintain the confidentiality of your account credentials",
                "Notify SnappArchive immediately of unauthorized access at hello@snapparchive.eu",
                "Enable multi-factor authentication (MFA) where available",
                "Manage User permissions appropriately",
            ],
        },
        {
            title: "5. Beta Services",
            text: `Beta Services are provided for testing and evaluation purposes only. Features may be unstable or incomplete. By participating, you acknowledge that the Services may contain errors, may change, and performance is not guaranteed.`,
            items: [
                "Beta features may be added, changed, or removed without notice",
                "Temporary data loss may occur; maintain backups",
                "SnappArchive offers no performance guarantees during beta",
                "Beta Services are provided 'as is' without warranties",
            ],
        },
        {
            title: "6. Subscription, Billing, and Payment",
            text: `Subscriptions are billed in advance. Payment is processed via secure third-party processors. Fees are exclusive of taxes.`,
            items: [
                "Cancel subscription anytime; no pro-rata refunds",
                "Access continues until end of billing period",
                "Export documents before subscription ends",
                "Refunds may be provided at SnappArchive's discretion",
            ],
        },
        {
            title: "7. AI Output Disclaimer",
            text: `AI and OCR outputs may contain errors. Users remain responsible for reviewing content. AI outputs do not constitute legal, financial, or compliance advice.`,
            items: [
                "Accuracy is not guaranteed",
                "SnappArchive is not liable for errors or omissions",
                "Use AI features at your own risk",
            ],
        },
        {
            title: "8. User Responsibilities and Acceptable Use",
            items: [
                "Use Services only for lawful purposes",
                "Do not upload illegal, harmful, or offensive content",
                "Do not infringe third-party rights",
                "Do not attempt unauthorized access or reverse-engineer the Services",
                "Do not distribute or resell Services without consent",
            ],
            text: `You are solely responsible for all content uploaded to the Services.`,
        },
        {
            title: "9. Export Control and Sanctions Compliance",
            text: `Users must comply with all export control and sanctions laws. Access is restricted from sanctioned regions. SnappArchive may suspend accounts for violations.`,
        },
        {
            title: "10. Data Ownership and Intellectual Property",
            text: `You retain ownership of Your Content. By using Services, you grant SnappArchive a limited license to process Your Content solely to provide Services.`,
            items: [
                "SnappArchive intellectual property remains its exclusive property",
                "Feedback you provide may be used by SnappArchive without obligation",
            ],
        },
        {
            title: "11. Data Processing, Privacy, and GDPR Compliance",
            items: [
                "SnappArchive is Data Controller for account data",
                "Customer is Data Controller for uploaded content; SnappArchive is Processor",
                "Data stored in EU Data Centers; transfers only with safeguards",
                "Audit logs, analytics, and security logs are collected",
                "SnappArchive implements technical and organizational security measures",
            ],
        },
        {
            title: "12. Service Availability, Maintenance, and Suspension",
            items: [
                "No guaranteed uptime",
                "Scheduled or emergency maintenance may occur",
                "Accounts may be suspended for security, fraud, legal, or emergency reasons",
            ],
        },
        {
            title: "13. Backup and Data Recovery",
            items: [
                "Daily backups stored securely in EU Data Centers",
                "No guarantee of full data recovery",
                "Users are responsible for maintaining their own backups",
            ],
        },
        {
            title: "14. Limitation of Liability",
            text: `Services are provided 'as is'. SnappArchive is not liable for indirect, incidental, special, or consequential damages.`,
            items: [
                "Maximum liability is the greater of fees paid in last 12 months or €100",
                "Users agree to indemnify SnappArchive from claims related to use or content",
            ],
        },
        {
            title: "15. Termination",
            items: [
                "You may terminate your account anytime; data retained for 30 days",
                "SnappArchive may terminate accounts for violations, non-payment, security risks, legal requirements",
                "Provisions for liability, indemnification, IP, and governing law survive termination",
            ],
        },
        {
            title: "16. Governing Law and Dispute Resolution",
            items: [
                "Terms governed by Belgium law; CISG does not apply",
                "Exclusive jurisdiction: courts of Antwerp, Belgium",
                "Informal dispute resolution via hello@snapparchive.eu is encouraged",
            ],
        },
        {
            title: "17. Changes to These Terms",
            items: [
                "SnappArchive may update Terms; material changes notified at least 30 days in advance",
                "Continued use constitutes acceptance",
            ],
        },
        {
            title: "18. General Provisions",
            items: [
                "Entire agreement includes Terms, Privacy Policy, GDPR page, Cookie Policy, Security page, DPA",
                "Severability: invalid provisions do not affect others",
                "Waiver: failure to enforce does not waive rights",
                "Assignment: Users cannot assign without consent; SnappArchive may assign freely",
                "Force majeure: SnappArchive not liable for events beyond control",
                "Third-party beneficiaries: none",
                "English version prevails over translations",
            ],
        },
        {
            title: "19. Contact Information",
            text: `If you have questions, concerns, or requests regarding these Terms, please contact us:

Email: hello@snapparchive.eu

We are committed to addressing your inquiries and resolving any issues in a timely, professional, and transparent manner.`,
            link: "https://www.gegevensbeschermingsautoriteit.be",
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

                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Terms of Service</h1>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-12">
                    {sections.map((section, i) => (
                        <div key={i}>
                            {section.title && (
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{section.title}</h2>
                            )}
                            {section.text && <p className="text-gray-700 mb-2 whitespace-pre-line">{section.text}</p>}
                            {section.items && (
                                <ul className="list-disc ml-6 space-y-1 text-gray-700">
                                    {section.items.map((item, k) => (
                                        <li key={k}>{item}</li>
                                    ))}
                                </ul>
                            )}
                            {section.link && (
                                <p className="mt-2">
                                    <a
                                        href={section.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        {section.link}
                                    </a>
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TermsOfService;
