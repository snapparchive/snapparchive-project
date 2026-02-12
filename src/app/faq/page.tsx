import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQPage() {
  const faqs = [
    {
      question: 'What is SnappArchive?',
      answer:
        'SnappArchive is a dossier-based work management platform that helps you manage cases, clients, and projects by bringing all related documents, context, and status together in one place.',
    },
    {
      question: 'How does OCR processing work?',
      answer:
        'When you upload a document, our advanced OCR technology automatically extracts text from images and PDFs. This makes your documents fully searchable and accessible within minutes. Feature availability may vary during the beta phase as the platform continues to evolve.',
    },

    {
      question: 'Is my data secure?',
      answer:
        'Yes, absolutely. SnappArchive is built with European data protection and GDPR compliance at its core. All data is encrypted in transit and at rest, and we never share your data with third parties.',
    },
    {
      question: 'Can I try SnappArchive before purchasing?',
      answer:
        'Yes! We offer a 14-day free trial with no credit card required. You can test all features and see if SnappArchive is right for your business.',
    },
    {
      question: 'What file formats are supported?',
      answer:
        'SnappArchive supports a wide range of file formats including PDF, PNG, JPG, JPEG, and more. Our OCR technology works with most common document formats.',
    },
    {
      question: 'Can I organize documents into folders?',
      answer:
        'Yes. Folders are supported, but dossiers are the primary way to organize your work. A dossier groups documents together with their context, status, and progress.',
    },
    {
      question: 'How does the search functionality work?',
      answer:
        'You can search across dossiers, document content, tags, statuses, and phases to quickly find what you need.',
    },
    {
      question: 'Do all documents get OCR automatically?',
      answer:
        'No. You decide which documents should be processed with OCR, so you stay in control of costs and relevance.',
    },
    {
      question: 'What happens after the trial period?',
      answer:
        'After your 14-day trial, you can choose a plan that fits your needs. If you decide not to continue, your data will be safely retained for 30 days before deletion.',
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600">
              Find answers to common questions about SnappArchive
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
