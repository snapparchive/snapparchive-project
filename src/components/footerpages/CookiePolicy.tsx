import React from 'react';
import { Shield, Cookie, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

function CookiePolicy() {
    const sections = [
        {
            id: 'intro',
            title: '1. Introduction',
            content: `This Cookie Policy explains how SnappArchive ("we," "our," or "us") uses cookies and similar tracking technologies when you access or use our website and Services. This policy provides detailed information about the cookies we use, why we use them, and how you can control them.

By using SnappArchive, you acknowledge that you have read and understood this Cookie Policy. For non-essential cookies, we will obtain your explicit consent before setting such cookies on your device, in compliance with GDPR, the ePrivacy Directive, and Belgian data protection law.

For more information on how we process personal data, please refer to our Privacy Policy.`
        },
        {
            id: 'what-are-cookies',
            title: '2. What Are Cookies?',
            content: `Cookies are small text files that are placed on your device (computer, smartphone, tablet, or other internet-enabled device) when you visit a website. Cookies allow the website to recognize your device, remember information about your visit (such as your preferences, login status, and language settings), and improve your user experience.

Cookies can be categorized as:`,
            subsections: [
                {
                    title: 'Session Cookies',
                    text: 'Temporary cookies that are automatically deleted when you close your browser. They are used to maintain your session and enable basic functionality during your visit.'
                },
                {
                    title: 'Persistent Cookies',
                    text: 'Cookies that remain on your device for a specified period or until you manually delete them. They are used to remember your preferences and settings across multiple visits.'
                }
            ],
            footer: `Cookies can also be classified by origin:

First-Party Cookies: Set by SnappArchive directly on our website.

Third-Party Cookies: Set by external service providers (e.g., payment processors, CDNs) that we use to deliver certain functionalities.`
        },
        {
            id: 'why-we-use',
            title: '3. Why We Use Cookies',
            content: 'SnappArchive uses cookies to:',
            list: [
                'Enable essential functionality (user authentication, login sessions, security features)',
                'Improve user experience and remember your preferences and settings',
                'Analyze website usage and performance to improve the Services (with your consent)',
                'Detect and prevent fraudulent activity, security threats, and unauthorized access',
                'Ensure the security and integrity of our platform and infrastructure'
            ]
        },
        {
            id: 'types-of-cookies',
            title: '4. Types of Cookies We Use',
            content: 'SnappArchive uses the following categories of cookies:',
            cookieTypes: [
                {
                    title: 'Essential Cookies (Strictly Necessary)',
                    icon: 'check',
                    color: 'cyan',
                    description: 'These cookies are strictly necessary for the Services to function and cannot be disabled. Without these cookies, critical features such as login, security, and session management would not work. Essential cookies enable core functionality including:',
                    features: [
                        'User authentication and login sessions',
                        'Security features and CSRF (Cross-Site Request Forgery) protection',
                        'Load balancing and routing to ensure optimal performance',
                        'Remembering your privacy and cookie preferences',
                        'Maintaining your session state as you navigate through the Services'
                    ],
                    legalBasis: 'Necessary for contract performance (GDPR Art. 6(1)(b)). These cookies are exempt from the consent requirement under the ePrivacy Directive as they are strictly necessary for providing the Services you have requested.'
                },
                {
                    title: 'Security Cookies',
                    icon: 'shield',
                    color: 'gray',
                    description: 'These cookies help us detect and prevent security threats, fraudulent activity, unauthorized access, and abuse of the Services. Security cookies are used for:',
                    features: [
                        'Detecting suspicious login attempts and brute-force attacks',
                        'Preventing automated attacks, bots, and malicious scripts',
                        'Verifying user identity during sensitive operations (e.g., password changes, account deletion)',
                        'Monitoring unusual activity patterns and potential security breaches',
                        'Rate-limiting requests to prevent abuse and DDoS attacks'
                    ],
                    legalBasis: 'Legitimate interests in security and fraud prevention (GDPR Art. 6(1)(f)). We have a legitimate interest in protecting the security and integrity of our Services, our systems, and our users\' data.'
                },
                {
                    title: 'Analytics Cookies (Optional — Requires Consent)',
                    icon: 'chart',
                    color: 'purple',
                    description: 'These cookies are only activated with your explicit consent. Analytics cookies help us understand how users interact with our Services so we can identify issues, measure performance, and improve the user experience. These cookies are used for:',
                    features: [
                        'Measuring page views, session duration, bounce rates, and feature usage',
                        'Identifying technical errors, bugs, and performance bottlenecks',
                        'Understanding user navigation patterns and behavior (fully anonymized)',
                        'Improving AI models, search functionality, and overall service quality',
                        'Testing new features and user interface improvements'
                    ],
                    important: 'All analytics data is anonymized and aggregated in accordance with GDPR Recital 26. We use privacy-friendly analytics tools that do not track individual users across websites, do not share data with third parties for advertising, and do not create user profiles.',
                    legalBasis: 'Consent (GDPR Art. 6(1)(a)). Analytics cookies will only be activated after you provide explicit consent through our cookie consent banner. You can withdraw your consent at any time.'
                }
            ]
        },
        {
            id: 'what-we-dont-use',
            title: '5. What We Do NOT Use',
            notUsed: [
                { label: 'Advertising cookies', description: 'or third-party ad networks' },
                { label: 'Cross-site tracking', description: 'or behavioral profiling cookies' },
                { label: 'Social media tracking pixels', description: '(Facebook Pixel, LinkedIn Insight Tag, Twitter pixels, etc.)' },
                { label: 'Retargeting or remarketing cookies', description: 'for advertising purposes' },
                { label: 'Cookies that sell or share your data with third parties', description: 'for marketing or advertising' },
                { label: 'Fingerprinting technologies', description: 'or other invasive tracking methods' }
            ]
        },
        {
            id: 'complete-cookie-list',
            title: '6. Complete Cookie List',
            content: 'The following table provides a comprehensive list of all cookies used by SnappArchive, including their purpose, category, expiry, and legal basis:',
            hasTable: true
        },
        {
            id: 'retention',
            title: '7. Cookie Retention Periods and Rationale',
            content: 'Different cookies have different retention periods based on their purpose and necessity:',
            retentionPeriods: [
                {
                    title: 'Session Cookies',
                    description: 'Automatically deleted when you close your browser. These are used for temporary session management and security features during your visit.'
                },
                {
                    title: 'Essential Persistent Cookies (up to 30 days)',
                    description: 'Retained to maintain your login state and authentication across multiple sessions, ensuring you don\'t need to re-authenticate every time you visit the Services.'
                },
                {
                    title: 'Cookie Consent Preferences (1 year)',
                    description: 'Retained to remember your cookie consent choices so we don\'t repeatedly show the consent banner. This period aligns with GDPR guidelines for consent validity.'
                },
                {
                    title: 'Security Cookies (1 hour to 24 hours)',
                    description: 'Retained for short periods necessary to detect and prevent security threats, brute-force attacks, and fraud. Longer retention would pose privacy risks without adding security benefits.'
                },
                {
                    title: 'Analytics Cookies (up to 2 years, with anonymization after 6 months)',
                    description: 'Retained to analyze long-term usage trends, measure feature adoption, and improve the Services. Data is anonymized after 6 months to minimize privacy impact while maintaining analytical value.'
                }
            ],
            footer: 'All cookies are automatically deleted after their expiry period. You can manually delete cookies at any time through your browser settings.'
        },
        {
            id: 'third-party',
            title: '8. Third-Party Cookies and Services',
            content: 'SnappArchive does not allow third-party advertising or tracking cookies on our website. However, we use a limited number of trusted third-party service providers to deliver essential functionality and services. These providers may set their own cookies:',
            thirdPartyServices: [
                {
                    title: '8.1 Payment Processors',
                    description: 'We use Stripe and/or Mollie for secure payment processing. These providers set cookies for fraud detection, secure transaction processing, and compliance with payment card industry (PCI) security standards. Payment processor cookies are essential for processing subscriptions and payments.',
                    providers: [
                        {
                            name: 'Stripe',
                            cookies: '_stripe_mid, _stripe_sid',
                            purpose: 'for fraud detection and session management. Data is processed in compliance with GDPR and stored within the EU and EEA.'
                        },
                        {
                            name: 'Mollie',
                            cookies: 'session and security tokens',
                            purpose: 'for payment processing. Data is processed within the EU.'
                        }
                    ]
                },
                {
                    title: '8.2 Content Delivery Networks (CDN)',
                    description: 'We use Content Delivery Networks (CDNs) to deliver static content (images, scripts, stylesheets) efficiently and improve page load times. CDN providers may set cookies for load balancing and caching purposes. These cookies are strictly functional and do not track individual users.'
                },
                {
                    title: '8.3 Analytics Tools (Consent Required)',
                    description: 'We use privacy-friendly analytics tools (such as Plausible Analytics, Matomo, or similar GDPR-compliant solutions) to measure website usage and performance. These tools:',
                    features: [
                        'Store all data exclusively within the European Union',
                        'Do not use cross-site tracking or behavioral profiling',
                        'Anonymize IP addresses and personal identifiers',
                        'Do not share data with third parties for advertising purposes',
                        'Require your explicit consent before activation'
                    ],
                    emphasis: 'Analytics cookies are only activated after you provide explicit consent through the cookie consent banner.'
                },
                {
                    title: '8.4 No Social Media Tracking',
                    description: 'SnappArchive does not use social media tracking pixels (Facebook Pixel, LinkedIn Insight Tag, Twitter pixels, etc.) or any form of cross-site tracking for advertising or remarketing purposes. We do not share your data with social media platforms without your explicit knowledge and consent.'
                },
                {
                    title: '8.5 GDPR Compliance of Third-Party Services',
                    description: 'All third-party service providers we use are carefully vetted to ensure full GDPR compliance. They process data only as necessary to provide their services and are bound by Data Processing Agreements (DPAs) under GDPR Article 28. A list of our sub-processors is available upon request at hello@snapparchive.eu.'
                }
            ]
        },
        {
            id: 'consent',
            title: '9. Cookie Consent and Management',
            subsections: [
                {
                    title: '9.1 Cookie Consent Banner',
                    content: 'In compliance with GDPR, the ePrivacy Directive, and Belgian Data Protection Authority guidelines, SnappArchive implements a cookie consent banner that appears when you first visit our website. The consent banner allows you to:',
                    list: [
                        'Accept all cookies (essential, security, and analytics)',
                        'Accept only essential cookies (declining analytics cookies)',
                        'Customize your cookie preferences by category',
                        'Learn more about each cookie category before making a decision'
                    ]
                },
                {
                    title: '9.2 When the Banner Appears',
                    content: 'The cookie consent banner will appear:',
                    conditions: [
                        { label: 'At your first visit', description: 'When you access SnappArchive for the first time, the banner will appear to request your consent for non-essential cookies.' },
                        { label: 'After policy changes', description: 'If we make material changes to this Cookie Policy or introduce new cookie categories, the banner will reappear to obtain fresh consent.' },
                        { label: 'After consent expiry', description: 'If your consent expires (after 12 months), the banner will reappear to confirm or update your preferences.' },
                        { label: 'If you clear cookies', description: 'If you manually delete cookies, the banner will reappear as we no longer have a record of your preferences.' }
                    ]
                },
                {
                    title: '9.3 Consent Requirements',
                    emphasis: 'Non-essential cookies (such as analytics cookies) are not activated until you provide explicit consent.',
                    content: 'This means:',
                    list: [
                        'Analytics cookies will not be set or activated before you accept them through the consent banner',
                        'You can use the Services with only essential cookies enabled',
                        'Essential cookies required for core functionality are exempt from the consent requirement under the ePrivacy Directive'
                    ]
                }
            ]
        }
    ];

    const cookieTableData = [
        {
            name: 'session_id',
            provider: 'SnappArchive',
            purpose: 'Maintains user session and authentication state',
            category: 'Essential',
            expiry: 'Session (deleted on browser close)',
            legalBasis: 'Art. 6(1)(b) GDPR'
        },
        {
            name: 'csrf_token',
            provider: 'SnappArchive',
            purpose: 'Protects against Cross-Site Request Forgery attacks',
            category: 'Essential',
            expiry: 'Session (deleted on browser close)',
            legalBasis: 'Art. 6(1)(b) GDPR'
        },
        {
            name: 'auth_token',
            provider: 'SnappArchive',
            purpose: 'Authenticates user and maintains login state',
            category: 'Essential',
            expiry: '30 days (to maintain login)',
            legalBasis: 'Art. 6(1)(b) GDPR'
        },
        {
            name: 'cookie_consent',
            provider: 'SnappArchive',
            purpose: 'Remembers your cookie consent preferences',
            category: 'Essential',
            expiry: '1 year (to remember your choice)',
            legalBasis: 'Art. 6(1)(b) GDPR'
        },
        {
            name: 'security_check',
            provider: 'SnappArchive',
            purpose: 'Detects suspicious login attempts and brute-force attacks',
            category: 'Security',
            expiry: '24 hours (security monitoring)',
            legalBasis: 'Art. 6(1)(f) GDPR'
        },
        {
            name: 'rate_limit',
            provider: 'SnappArchive',
            purpose: 'Prevents abuse and DDoS attacks through rate limiting',
            category: 'Security',
            expiry: '1 hour (rate limit window)',
            legalBasis: 'Art. 6(1)(f) GDPR'
        },
        {
            name: 'analytics_id',
            provider: 'SnappArchive / Analytics Provider',
            purpose: 'Tracks anonymized usage patterns and performance metrics',
            category: 'Analytics',
            expiry: '2 years (usage trends)',
            legalBasis: 'Art. 6(1)(a) GDPR (consent required)'
        },
        {
            name: '_stripe_mid',
            provider: 'Stripe (Payment Processor)',
            purpose: 'Fraud detection and secure payment processing',
            category: 'Essential (Third-Party)',
            expiry: '1 year (fraud prevention)',
            legalBasis: 'Art. 6(1)(b) GDPR'
        },
        {
            name: '[Additional cookies]',
            provider: 'To be updated',
            purpose: 'As additional cookies are introduced, they will be listed here',
            category: 'Varies',
            expiry: 'Varies',
            legalBasis: 'Varies'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
            {/* HERO */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 py-20">
                <div className="container mx-auto px-4 text-center text-white">
                    <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full mb-6 font-medium">
                        <Cookie className="h-4 w-4" />
                        Legal
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Cookie Policy</h1>
                    <p className="text-xl text-cyan-50 max-w-2xl mx-auto">
                        Last updated: December 10, 2025
                    </p>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-12">
                    {sections.map((section) => (
                        <section key={section.id} id={section.id}>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                                {section.title}
                            </h2>

                            {section.content && (
                                <p className="text-gray-700 whitespace-pre-line mb-4">{section.content}</p>
                            )}

                            {/* Regular List */}
                            {section.list && (
                                <ul className="list-disc ml-6 space-y-2 text-gray-700 mb-4">
                                    {section.list.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            )}

                            {/* Subsections */}
                            {section.subsections?.map((sub, i) => (
                                <div key={i} className="mt-6">
                                    {sub.title && (
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{sub.title}</h3>
                                    )}

                                    {'text' in sub && sub.text && (
                                        <p className="text-gray-700 mb-3">{sub.text}</p>
                                    )}

                                    {'content' in sub && sub.content && (
                                        <p className="text-gray-700 mb-3">{sub.content}</p>
                                    )}

                                    {'list' in sub && sub.list?.length ? (
                                        <ul className="list-disc ml-6 space-y-2 text-gray-700">
                                            {sub.list.map((item, k) => (
                                                <li key={k}>{item}</li>
                                            ))}
                                        </ul>
                                    ) : null}

                                    {'conditions' in sub && sub.conditions?.length ? (
                                        <div className="space-y-3">
                                            {sub.conditions.map((cond, k) => (
                                                <div key={k}>
                                                    <span className="font-semibold text-gray-900">{cond.label}:</span>
                                                    <span className="text-gray-700"> {cond.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}

                                    {'emphasis' in sub && sub.emphasis && (
                                        <p className="font-semibold text-gray-900 mb-2">{sub.emphasis}</p>
                                    )}
                                </div>
                            ))}


                            {/* Cookie Types with Colored Boxes */}
                            {section.cookieTypes && section.cookieTypes.map((type, i) => (
                                <div
                                    key={i}
                                    className={`mt-6 p-6 rounded-lg border-2 ${type.color === 'cyan'
                                        ? 'bg-blue-50 border-cyan-200'
                                        : type.color === 'gray'
                                            ? 'bg-gray-50 border-gray-200'
                                            : 'bg-purple-50 border-purple-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        {type.icon === 'check' && <CheckCircle className="h-6 w-6 text-cyan-600" />}
                                        {type.icon === 'shield' && <Shield className="h-6 w-6 text-gray-600" />}
                                        {type.icon === 'chart' && <Eye className="h-6 w-6 text-purple-600" />}
                                        <h3 className="font-bold text-xl text-gray-900">{type.title}</h3>
                                    </div>

                                    <p className="text-gray-700 mb-3">{type.description}</p>

                                    {type.features && (
                                        <ul className="list-none space-y-1 text-gray-700 mb-4">
                                            {type.features.map((feature, k) => (
                                                <li key={k}>{feature}</li>
                                            ))}
                                        </ul>
                                    )}

                                    {type.important && (
                                        <div className="bg-white/60 p-4 rounded-md mb-3">
                                            <p className="font-semibold text-gray-900 mb-1">Important:</p>
                                            <p className="text-gray-700">{type.important}</p>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-gray-300">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Legal Basis:</span> {type.legalBasis}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* What We Don't Use Box */}
                            {section.notUsed && (
                                <div className="mt-6 p-6 rounded-lg bg-red-50 border-2 border-red-200">
                                    <h3 className="font-bold text-xl text-gray-900 mb-4">
                                        SnappArchive does NOT use:
                                    </h3>
                                    <div className="space-y-2">
                                        {section.notUsed.map((item, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-gray-700">
                                                    <span className="font-semibold">{item.label}</span> {item.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cookie Table */}
                            {section.hasTable && (
                                <div className="mt-6 overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Cookie Name</th>
                                                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Provider</th>
                                                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Purpose</th>
                                                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Category</th>
                                                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Expiry</th>
                                                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Legal Basis</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cookieTableData.map((cookie, i) => (
                                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="border border-gray-300 px-4 py-3 font-mono text-sm">{cookie.name}</td>
                                                    <td className="border border-gray-300 px-4 py-3">{cookie.provider}</td>
                                                    <td className="border border-gray-300 px-4 py-3">{cookie.purpose}</td>
                                                    <td className="border border-gray-300 px-4 py-3">{cookie.category}</td>
                                                    <td className="border border-gray-300 px-4 py-3">{cookie.expiry}</td>
                                                    <td className="border border-gray-300 px-4 py-3">{cookie.legalBasis}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p className="text-sm text-gray-600 italic mt-4">
                                        This table will be updated as we introduce additional cookies or modify existing ones. The "Last updated" date at the top of this page reflects the most recent changes.
                                    </p>
                                </div>
                            )}

                            {/* Retention Periods */}
                            {section.retentionPeriods && (
                                <div className="space-y-4 mt-4">
                                    {section.retentionPeriods.map((period, i) => (
                                        <div key={i}>
                                            <h4 className="font-semibold text-gray-900">{period.title}:</h4>
                                            <p className="text-gray-700">{period.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Third Party Services */}
                            {section.thirdPartyServices && section.thirdPartyServices.map((service, i) => (
                                <div key={i} className="mt-6">
                                    <h3 className="font-bold text-lg text-gray-900 mb-3">{service.title}</h3>
                                    <p className="text-gray-700 mb-3">{service.description}</p>

                                    {service.providers && (
                                        <div className="space-y-2 ml-4">
                                            {service.providers.map((provider, k) => (
                                                <p key={k} className="text-gray-700">
                                                    <span className="font-semibold">{provider.name}:</span> Cookies include{' '}
                                                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{provider.cookies}</code>{' '}
                                                    {provider.purpose}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {service.features && (
                                        <ul className="list-disc ml-6 space-y-1 text-gray-700 mt-3">
                                            {service.features.map((feature, k) => (
                                                <li key={k}>{feature}</li>
                                            ))}
                                        </ul>
                                    )}

                                    {service.emphasis && (
                                        <p className="font-semibold text-gray-900 mt-3">{service.emphasis}</p>
                                    )}
                                </div>
                            ))}

                            {section.footer && (
                                <p className="mt-4 text-gray-700 whitespace-pre-line">{section.footer}</p>
                            )}
                        </section>
                    ))}

                    {/* Additional Sections */}
                    <section id="managing-cookies">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            10. Managing and Deleting Cookies
                        </h2>
                        <p className="text-gray-700 mb-4">
                            You have full control over cookies and can manage or delete them at any time. Here's how:
                        </p>

                        <h3 className="font-bold text-lg text-gray-900 mb-2">10.1 Through Your Browser Settings</h3>
                        <p className="text-gray-700 mb-3">
                            Most browsers allow you to view, manage, and delete cookies. You can typically find these settings in the "Privacy" or "Security" section of your browser preferences. For instructions specific to your browser:
                        </p>
                        <ul className="list-disc ml-6 space-y-1 text-gray-700 mb-4">
                            <li>Google Chrome: Settings → Privacy and security → Cookies and other site data</li>
                            <li>Firefox: Settings → Privacy & Security → Cookies and Site Data</li>
                            <li>Safari: Preferences → Privacy → Manage Website Data</li>
                            <li>Edge: Settings → Cookies and site permissions → Manage and delete cookies</li>
                        </ul>

                        <h3 className="font-bold text-lg text-gray-900 mb-2">10.2 Through Our Cookie Consent Banner</h3>
                        <p className="text-gray-700 mb-4">
                            You can update your cookie preferences at any time by clicking the "Cookie Settings" link in the footer of our website. This will reopen the consent banner, allowing you to change your choices.
                        </p>

                        <h3 className="font-bold text-lg text-gray-900 mb-2">10.3 Opt-Out Resources</h3>
                        <p className="text-gray-700 mb-3">
                            For more information about managing cookies and opting out of tracking, visit:
                        </p>
                        <ul className="list-disc ml-6 space-y-1 text-blue-600 mb-4">
                            <li><a href="https://www.allaboutcookies.org" className="underline">All About Cookies</a> — Comprehensive guide to cookies and how to manage them</li>
                            <li><a href="https://www.youronlinechoices.eu" className="underline">Your Online Choices (EU)</a> — European opt-out platform for behavioral advertising</li>
                            <li><a href="https://www.networkadvertising.org/choices/" className="underline">Network Advertising Initiative</a> — Opt-out tool for interest-based advertising</li>
                        </ul>
                    </section>

                    <section id="impact">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            11. Impact of Disabling Cookies
                        </h2>
                        <p className="text-gray-700 mb-4">
                            If you disable or decline cookies, certain features of the Services may not function properly:
                        </p>

                        <div className="space-y-3">
                            <div>
                                <span className="font-semibold text-gray-900">Disabling Essential Cookies:</span>
                                <span className="text-gray-700"> You will not be able to log in, authenticate, or access your account. Core functionality will be unavailable.</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-900">Disabling Security Cookies:</span>
                                <span className="text-gray-700">You may be more vulnerable to security threats, and we may not be able to detect or prevent fraudulent activity on your account.</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-900">Disabling Analytics Cookies:</span>
                                <span className="text-gray-700">The Services will continue to function normally. Declining analytics cookies does not affect your ability to use SnappArchive.</span>
                            </div>
                        </div>
                    </section>
                    <section id="belgian-law" className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            12. Compliance with GDPR and Belgian Law
                        </h2>

                        <p className="text-gray-700 mb-4">
                            This Cookie Policy is designed to comply with the following regulations and guidelines:
                        </p>

                        <ul className="list-disc ml-6 mb-6 text-gray-700 space-y-1">
                            <li>General Data Protection Regulation (GDPR) — EU Regulation 2016/679</li>
                            <li>ePrivacy Directive — Directive 2002/58/EC (as amended by Directive 2009/136/EC)</li>
                            <li>Belgian Data Protection Law — Law of 30 July 2018 on the protection of natural persons with regard to the processing of personal data</li>
                            <li>European Data Protection Board (EDPB) Guidelines 05/2020 on consent under GDPR</li>
                            <li>Belgian Data Protection Authority (APD-GBA) guidelines on cookies and tracking technologies</li>
                        </ul>

                        <p className="text-gray-700 mb-4">
                            We are committed to ensuring that our use of cookies respects your privacy rights and complies with all applicable European and Belgian data protection regulations.
                        </p>
                    </section>
                    <section id="cookie-policy-changes" className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            13. Changes to This Cookie Policy
                        </h2>

                        <p className="text-gray-700 mb-4">
                            We may update this Cookie Policy from time to time to reflect changes in our practices, technology, legal requirements, or the cookies we use. When we make material changes, we will update the "Last updated" date at the top of this page, notify you via email if you have an account with us, display a prominent notice on our website or within the Services, and re-display the cookie consent banner if the changes affect your rights or require fresh consent.
                        </p>

                        <p className="text-gray-700">
                            We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies and how you can protect your privacy.
                        </p>
                    </section>
                    <section id="cookie-policy-contact" className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            14. Contact Us
                        </h2>

                        <p className="text-gray-700 mb-4">
                            If you have questions, concerns, or requests regarding this Cookie Policy or our use of cookies, please contact us via email at <a href="mailto:hello@snapparchive.eu" className="text-blue-600 underline">hello@snapparchive.eu</a>.
                        </p>

                        <p className="text-gray-700 mb-4">
                            We are committed to addressing your inquiries in a timely and transparent manner and ensuring your privacy rights are fully respected.
                        </p>

                        <p className="text-gray-700">
                            For more information on how we process personal data, please refer to our <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a> and <a href="/gdpr-compliance" className="text-blue-600 underline">GDPR Compliance</a> pages.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
export default CookiePolicy;