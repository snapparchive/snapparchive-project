import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Target, Eye, Users, Mail } from 'lucide-react';

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'CEO and Founder',
      bio: 'Former document management consultant with 15+ years of experience helping businesses digitize their operations.',
      badge: 'Leadership',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      bio: 'AI and machine learning expert specializing in OCR technology and natural language processing.',
      badge: 'Technology',
      badgeColor: 'bg-green-100 text-green-700',
    },
    {
      name: 'Emma Rodriguez',
      role: 'Head of Product',
      bio: 'Product strategist focused on creating intuitive user experiences for complex enterprise software.',
      badge: 'Product',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      name: 'David Martinez',
      role: 'Lead Engineer',
      bio: 'Full-stack engineer with expertise in building scalable cloud infrastructure and secure data systems.',
      badge: 'Engineering',
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      name: 'Lisa Anderson',
      role: 'Head of Customer Success',
      bio: 'Customer success expert dedicated to ensuring every client achieves their document management goals.',
      badge: 'Customer Success',
      badgeColor: 'bg-pink-100 text-pink-700',
    },
    {
      name: 'James Wilson',
      role: 'Security Lead',
      bio: 'Cybersecurity specialist ensuring SnappArchive meets the highest security and compliance standards.',
      badge: 'Security',
      badgeColor: 'bg-red-100 text-red-700',
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-primary to-[#0891b2] text-white py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-6">About SnappArchive</h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                We are building the future of dossier-based work management, powered by AI and designed for businesses that value efficiency and security.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                To revolutionize how businesses manage their work and cases through dossiers, supported by documents, making case management simple, efficient, and intelligent.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We believe every business deserves access to enterprise-grade dossier-based work management tools that are easy to use, secure, and powered by the latest AI technology. Our mission is to eliminate the pain points of traditional document management and help businesses focus on what they do best.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Vision
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                A world where every dossier and its associated documents are instantly accessible, searchable, and intelligently organized without manual effort.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We envision a future where businesses can effortlessly manage millions of dossiers and associated documents with the same ease as managing a handful. Through continuous innovation in AI and machine learning, we are working towards making this vision a reality for businesses of all sizes.
              </p>
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Our Story
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Born from real-world challenges in document management
            </p>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 lg:p-12">
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p className="text-lg">
                  SnappArchive was created in response to real-world challenges faced by businesses managing increasing volumes of work and cases through dossiers, supported by documents.
                </p>
                <p className="text-lg">
                  Many existing solutions proved too complex, too expensive, or lacked intelligent automation. SnappArchive was designed as a modern, secure, and AI-powered alternative tailored for European businesses.
                </p>
                <p className="text-lg">
                  Today, SnappArchive is in active development and early adoption, continuously evolving based on customer feedback and regulatory requirements.
                </p>
                <p className="text-lg font-medium text-gray-900">
                  We are just getting started, and we are excited to have you join us on this journey.
                </p>
              </div>
            </div>
          </div>


          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Security First',
                  description: 'Data protection and privacy are not optional. Every feature is built with security at its core.',
                },
                {
                  title: 'User-Centric',
                  description: 'Complex problems deserve simple solutions. We design for humans, not just systems.',
                },
                {
                  title: 'Innovation',
                  description: 'We continuously push the boundaries of what is possible with AI and document processing.',
                },
                {
                  title: 'Transparency',
                  description: 'Honest communication and clear pricing. No hidden fees, no surprises.',
                },
                {
                  title: 'Sustainability',
                  description: 'Building for the long term with sustainable practices and responsible growth.',
                },
                {
                  title: 'Excellence',
                  description: "Good enough isn't good enough. We strive for excellence in everything we deliver.",
                },
              ].map((value, index) => (
                <div
                  key={index}
                  className="p-6 bg-white border border-gray-200 rounded-xl hover:border-[#04a3c3] hover:shadow-lg transition-all"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Meet the Team
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                SnappArchive is built by a multidisciplinary team with expertise in AI, document processing, security, and enterprise software.
                <br />
                The team combines strong technical knowledge with real-world business experience to deliver a secure and future-proof dossier-based work management platform.
              </p>
            </div>
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-[#0891b2] rounded-full flex items-center justify-center mb-4 text-white text-2xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {member.bio}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${member.badgeColor}`}>
                    {member.badge}
                  </span>
                </div>
              ))}
            </div> */}
          </div>

          <div className="mt-20 bg-gradient-to-br from-primary to-[#0891b2] rounded-2xl p-12 text-center text-white">
            <Users className="h-12 w-12 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6">
              Join Our Journey
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              We are always looking for talented individuals who share our passion for innovation and excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:careers@snapparchive.eu"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Mail className="h-5 w-5" />
                careers@snapparchive.eu
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}