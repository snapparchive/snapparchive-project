'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Mail, MapPin, Phone, Users, DollarSign, Lock, FileText, HeadphonesIcon, Briefcase, Globe, ShieldCheck, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ContactPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    inquiryType: '',
    message: '',
  });

  const departments = [
    {
      icon: Users,
      title: 'Sales',
      email: 'sales@snapparchive.eu',
      description: 'Questions about plans, features, or demos',
    },
    {
      icon: HeadphonesIcon,
      title: 'Support',
      email: 'support@snapparchive.eu',
      description: 'Technical issues or account help',
    },
    {
      icon: DollarSign,
      title: 'Billing',
      email: 'billing@snapparchive.eu',
      description: 'Invoices, payments, or subscription queries',
    },
    {
      icon: Briefcase,
      title: 'Partnerships',
      email: 'partners@snapparchive.eu',
      description: 'Collaboration and integration opportunities',
    },
    {
      icon: Lock,
      title: 'Security',
      email: 'security@snapparchive.eu',
      description: 'Security audits, compliance, data protection',
    },
    {
      icon: FileText,
      title: 'Legal',
      email: 'legal@snapparchive.eu',
      description: 'Contracts, terms, and legal inquiries',
    },
    {
      icon: Globe,
      title: 'Enterprise',
      email: 'support@snapparchive.eu',
      description: 'Large-scale deployments and custom solutions',
    },
    {
      icon: ShieldCheck,
      title: 'Privacy',
      email: 'privacy@snapparchive.eu',
      description: 'Data privacy, GDPR requests, data rights',
    },
  ];

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.inquiryType || !formData.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/contact/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      toast({
        title: 'Success!',
        description: 'Your message has been sent. We\'ll get back to you within 24 hours.',
        variant: 'default',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        inquiryType: '',
        message: '',
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-primary to-[#0891b2] text-white py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-6">Contact Us</h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                We're here to help. Reach out to us through any of the channels below and we'll get back to you as soon as possible.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 text-sm mb-3">
                For general inquiries
              </p>
              <a
                href="mailto:hello@snapparchive.eu"
                className="text-primary hover:underline font-medium"
              >
                hello@snapparchive.eu
              </a>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-600 text-sm mb-3">
                Our headquarters
              </p>
              <p className="text-gray-900 font-medium">
                Antwerp, Belgium
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600 text-sm mb-3">
                Support is available via email for all users. Phone support is available for active customers upon request.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Send us a Message
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 font-medium">Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="mt-2"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      className="mt-2"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject" className="text-gray-700 font-medium">Subject *</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="How can we help?"
                    className="mt-2"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inquiry" className="text-gray-700 font-medium">Inquiry Type *</Label>
                  <Select
                    value={formData.inquiryType}
                    onValueChange={(value) => handleChange('inquiryType', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="Enterprise">Enterprise / Custom Solutions</SelectItem>
                      <SelectItem value="Security">Security / Compliance</SelectItem>
                      <SelectItem value="Privacy">Privacy / GDPR Request</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message" className="text-gray-700 font-medium">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    className="mt-2 min-h-32"
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-hover text-white h-12 text-base font-medium"
                >
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
                <p className="text-sm text-gray-500 text-center">
                  By submitting this form, you agree to our Privacy Policy and consent to us storing your information in accordance with GDPR.
                </p>
              </form>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Why Contact Us?
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Quick Response Time</h4>
                    <p className="text-gray-600 text-sm">
                      We respond to all inquiries within 24 hours during business days.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Expert Support Team</h4>
                    <p className="text-gray-600 text-sm">
                      Our team consists of experienced professionals ready to assist you.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Multiple Contact Options</h4>
                    <p className="text-gray-600 text-sm">
                      Choose the communication method that works best for you.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Dedicated Department Routing</h4>
                    <p className="text-gray-600 text-sm">
                      Your inquiry is routed to the right team for faster resolution.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Departments & Contact Routing
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                For faster service, contact the department that best matches your inquiry. Each department has specialized staff ready to help.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {departments.map((dept, index) => {
                const IconComponent = dept.icon;
                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-[#04a3c3] transition-all group"
                  >
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                      <IconComponent className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {dept.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {dept.description}
                    </p>
                    <a
                      href={`mailto:${dept.email}`}
                      className="text-primary hover:underline font-medium text-sm"
                    >
                      {dept.email}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
