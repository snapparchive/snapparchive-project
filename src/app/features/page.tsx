'use client'
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FileText, FolderOpen, Search, Mail, Workflow, Shield, Scan, Brain, Tag, FolderTree, Filter, Clock, Lock, Database, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
export default function FeaturesPage() {
  const router = useRouter();
  const getEarlyAccess = () => {
    trackEvent('click_get_early_access', {
      button_name:'get early access',
      button_location: 'Features Page',
    });
    router.push('/register');
  }
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-primary to-[#0891b2] text-white py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-6">Powerful Dossier Features</h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                SnappArchive helps you manage your work per dossier instead of per loose document. Each dossier brings together all relevant files, context, and progress, so you always know where things stand.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl py-20">
          <section className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-cyan-200 rounded-full text-primary text-sm font-medium mb-6">
                  <Scan className="h-4 w-4" />
                  <span>OCR & AI</span>
                </div>

                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Smart document support inside dossiers
                </h2>

                <p className="text-lg text-gray-600 mb-6">
                  OCR and AI automatically extract text from selected documents and make everything inside a dossier fully searchable.
                </p>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Multi-language OCR inside dossiers
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Search extracted text across all documents within a dossier
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Handwritten content support
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Handwritten notes become searchable within the dossier context
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Improved readability
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Automatic enhancement ensures documents remain usable inside dossiers
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-primary to-[#0891b2] p-8 rounded-2xl">
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Invoice_2024.pdf</h4>
                      <p className="text-sm text-gray-500">Processing OCR...</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 font-mono">
                    <p>Invoice #INV-2024-001</p>
                    <p>Date: January 15, 2024</p>
                    <p>Amount: €1,250.00</p>
                    <p>Customer: Acme Corp</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                      <Tag className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Invoices</span>
                      <span className="ml-auto text-sm text-gray-500">124 docs</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                      <Tag className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Contracts</span>
                      <span className="ml-auto text-sm text-gray-500">45 docs</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                      <Tag className="h-5 w-5 text-amber-600" />
                      <span className="font-medium">Reports</span>
                      <span className="ml-auto text-sm text-gray-500">89 docs</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-cyan-200 rounded-full text-primary text-sm font-medium mb-6">
                  <Brain className="h-4 w-4" />
                  <span>AI-Powered</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Dossier-based organization
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Organize your work around dossiers instead of folders. Each dossier groups all related documents, notes, and actions in one clear overview.
                </p>
                <p className="text-sm text-gray-500 italic mb-6">
                  Some advanced automation rules and workflows will be expanded in future versions.
                </p>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Context-aware tagging inside dossiers
                      </h4>
                      <p className="text-gray-600 text-sm">
                        AI suggests relevant tags based on the overall dossier context
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Automatic document classification
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Documents are recognised and grouped correctly within each dossier
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Dossier-level rules
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Apply custom rules to control how content is handled inside a dossier
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-cyan-200 rounded-full text-primary text-sm font-medium mb-6">
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Find dossiers, not just files
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Search across dossier titles, statuses, phases, and document content to instantly find the right case.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Dossier-wide search
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Search across dossier titles, statuses, phases, and all contained documents
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Contextual filters
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Narrow results by dossier status, phase, tags, dates, and related content
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Saved dossier views
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Save commonly used searches to quickly return to the right dossiers
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-primary to-[#0891b2] p-8 rounded-2xl">
                <div className="bg-white rounded-xl p-6">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search dossiers..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg"
                      value="invoice 2024"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">Invoice_Jan_2024.pdf</p>
                      <p className="text-xs text-gray-500 mt-1">Found in: Invoices / 2024</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">Annual_Invoice_Report.pdf</p>
                      <p className="text-xs text-gray-500 mt-1">Found in: Reports / Financial</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-semibold text-gray-900">archive@your-domain.eu</p>
                      <p className="text-sm text-gray-500">Your unique archive address</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-600">Forward emails with attachments</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-600">Automatically processed & archived</p>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-cyan-200 rounded-full text-primary text-sm font-medium mb-6">
                  <Mail className="h-4 w-4" />
                  <span>Email Integration</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Email into dossiers
                </h2>
                <p className="text-lg text-gray-600 mb-2">
                  Forward emails directly into the correct dossier so conversations and attachments stay connected to the right case.
                </p>
                <p className="text-sm text-gray-500 italic mb-6">
                  Some advanced automation rules and workflows will be expanded in future versions.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Automatic dossier capture
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Attachments and messages are added directly to the correct dossier
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Context-aware routing
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Emails are routed based on sender or subject to the right dossier
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Conversation history preserved
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Entire email threads remain searchable inside the dossier
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>


          <section className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-cyan-200 rounded-full text-primary text-sm font-medium mb-6">
                  <Workflow className="h-4 w-4" />
                  <span>Automation</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Less admin per dossier
                </h2>
                <p className="text-lg text-gray-600 mb-2">
                  Reduce manual work by automating tagging, classification, and document handling within each dossier.
                </p>

                <p className="text-sm text-gray-500 italic mb-6">
                  Some advanced automation rules and workflows will be expanded in future versions.
                </p>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Dossier-based tagging
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Automatically apply tags within a dossier based on document content or source
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Context-aware organization
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Handle documents consistently inside a dossier using predefined rules
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Dossier activity notifications
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Get notified when important updates or documents are added to a dossier
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-primary to-[#0891b2] p-8 rounded-2xl">
                <div className="bg-white rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Example Workflow</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">1</div>
                      <div>
                        <p className="font-medium text-sm">Document uploaded</p>
                        <p className="text-xs text-gray-500">Invoice detected by AI</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">2</div>
                      <div>
                        <p className="font-medium text-sm">Auto-tagged</p>
                        <p className="text-xs text-gray-500">Tags: Invoice, Financial, 2024</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">3</div>
                      <div>
                        <p className="font-medium text-sm">Moved to folder</p>
                        <p className="text-xs text-gray-500">Invoices / 2024 / Q1</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-l-4 border-green-500">
                      <Lock className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-sm">End-to-End Encryption</p>
                        <p className="text-xs text-gray-500">AES-256 encryption</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-l-4 border-blue-500">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm">GDPR Compliant</p>
                        <p className="text-xs text-gray-500">EU data centers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-l-4 border-purple-500">
                      <Database className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-semibold text-sm">Secure Backups</p>
                        <p className="text-xs text-gray-500">Daily automated backups</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-cyan-200 rounded-full text-primary text-sm font-medium mb-6">
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Enterprise-Grade Security
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Your dossiers and their contents are protected with bank-level security, ensuring sensitive case information remains safe and compliant.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Data Encryption</h4>
                      <p className="text-gray-600 text-sm">All data encrypted in transit and at rest using AES-256</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">GDPR Compliance</h4>
                      <p className="text-gray-600 text-sm">Fully compliant with European data protection regulations</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Access Controls</h4>
                      <p className="text-gray-600 text-sm">Role-based permissions and two-factor authentication</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-20 bg-gradient-to-br from-primary to-[#0891b2] rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Experience These Features?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join the beta programme and get early access to all these powerful features
            </p>
            <Button onClick={getEarlyAccess} className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-6">
              Get Early Access
            </Button>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}