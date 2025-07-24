import React, { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import axios from '../services/axios';
import {
  FiHelpCircle,
  FiMessageCircle,
  FiMail,
  FiPhone,
  FiFileText,
  FiVideo,
  FiSearch,
  FiBook,
  FiUsers,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiSend,
  FiPlus,
  FiMinus,
  FiStar,
  FiMessageSquare,
  FiHeadphones,
  FiShield,
  FiZap,
  FiMonitor,
  FiSettings,
  FiUser,
  FiCalendar,
  FiMapPin,
  FiGlobe,
} from 'react-icons/fi';

const SupportHelpPage = () => {
  const [activeTab, setActiveTab] = useState('help-center');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general',
  });
  const [submitting, setSubmitting] = useState(false);

  // FAQ Data
  const faqData = {
    'Getting Started': [
      {
        question: 'How do I create my first loan application?',
        answer:
          'To create your first loan application, navigate to the Loans section and click "Add New Loan". Fill in the required information including loan amount, purpose, and personal details. Upload any required documents and submit your application.',
        tags: ['loan', 'application', 'beginner'],
      },
      {
        question: 'What documents do I need to upload?',
        answer:
          "You'll need to upload your PAN Card, Aadhaar Card, Voter ID Card, and a recent bank statement. All documents should be clear, readable, and in JPG or PNG format.",
        tags: ['documents', 'upload', 'requirements'],
      },
      {
        question: 'How long does loan approval take?',
        answer:
          "Loan approval typically takes 2-3 business days after all required documents are submitted and verified. You'll receive email notifications at each step of the process.",
        tags: ['approval', 'timeline', 'process'],
      },
    ],
    'Account Management': [
      {
        question: 'How do I change my password?',
        answer:
          'Go to Settings > Security and click "Change Password". Enter your current password and your new password twice. Make sure your new password is strong and unique.',
        tags: ['password', 'security', 'account'],
      },
      {
        question: 'Can I update my profile information?',
        answer:
          'Yes, you can update your profile information anytime. Go to Profile Settings and edit your personal details, contact information, and upload new documents.',
        tags: ['profile', 'update', 'information'],
      },
      {
        question: 'How do I enable two-factor authentication?',
        answer:
          'Navigate to Settings > Security and toggle on "Two-Factor Authentication". Follow the setup instructions to link your mobile device for enhanced security.',
        tags: ['2fa', 'security', 'authentication'],
      },
    ],
    'Loans & Payments': [
      {
        question: 'What are the interest rates?',
        answer:
          'Interest rates vary based on loan type, amount, and your credit profile. Current rates range from 8.5% to 15% APR. Check the loan calculator for personalized rates.',
        tags: ['interest', 'rates', 'calculator'],
      },
      {
        question: 'How do I make loan payments?',
        answer:
          'You can make payments through the Loans section. Select your active loan and click "Make Payment". We accept online banking, UPI, and card payments.',
        tags: ['payment', 'loan', 'methods'],
      },
      {
        question: 'What happens if I miss a payment?',
        answer:
          "Late payments may incur additional charges and affect your credit score. Contact us immediately if you're having trouble making payments to discuss options.",
        tags: ['late payment', 'charges', 'credit score'],
      },
    ],
    'Technical Issues': [
      {
        question: 'The app is not loading properly',
        answer:
          'Try refreshing the page or clearing your browser cache. If the issue persists, check your internet connection or try accessing from a different browser.',
        tags: ['loading', 'technical', 'browser'],
      },
      {
        question: "I can't upload my documents",
        answer:
          'Ensure your files are in JPG or PNG format and under 2MB. Check your internet connection and try again. If problems continue, contact our support team.',
        tags: ['upload', 'documents', 'file size'],
      },
      {
        question: 'How do I reset my password if I forgot it?',
        answer:
          'Click "Forgot Password" on the login page. Enter your registered email address and follow the instructions sent to your email to reset your password.',
        tags: ['forgot password', 'reset', 'email'],
      },
    ],
  };

  // System Status Data
  const systemStatus = {
    overall: 'operational',
    services: [
      { name: 'Application Server', status: 'operational', uptime: '99.9%' },
      { name: 'Database', status: 'operational', uptime: '99.8%' },
      { name: 'File Upload', status: 'operational', uptime: '99.7%' },
      { name: 'Payment Gateway', status: 'operational', uptime: '99.6%' },
      { name: 'Email Service', status: 'operational', uptime: '99.5%' },
    ],
    incidents: [
      {
        title: 'Scheduled Maintenance - Payment System',
        status: 'scheduled',
        date: '2024-01-15',
        description:
          'Payment processing will be temporarily unavailable for 2 hours during system maintenance.',
      },
    ],
  };

  // Contact Information
  const contactInfo = {
    email: 'support@financeapp.com',
    phone: '+1 (555) 123-4567',
    address: '123 Finance Street, Business District, City, State 12345',
    hours: 'Monday - Friday: 9:00 AM - 6:00 PM EST',
    emergency: '+1 (555) 999-8888',
  };

  const SUBJECT_OPTIONS = [
    'Review & Ratings',
    'App Error',
    'Support/Complain',
    'Payment Issue',
    'Suggestions',
    'Account Access Issue',
  ];

  const handleFaqToggle = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        "Support ticket submitted successfully! We'll get back to you within 24 hours."
      );
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general',
      });
    } catch (error) {
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactFormChange = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const filteredFaq = () => {
    let filtered = [];
    Object.entries(faqData).forEach(([category, questions]) => {
      if (selectedCategory === 'all' || category === selectedCategory) {
        questions.forEach((q) => {
          if (
            searchQuery === '' ||
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.tags.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            )
          ) {
            filtered.push({ ...q, category });
          }
        });
      }
    });
    return filtered;
  };

  const tabs = [
    { id: 'help-center', label: 'Help Center', icon: FiHelpCircle },
    { id: 'contact', label: 'Contact Support', icon: FiMessageCircle },
    { id: 'documentation', label: 'Documentation', icon: FiFileText },
    { id: 'community', label: 'Community', icon: FiUsers },
    { id: 'status', label: 'System Status', icon: FiMonitor },
  ];

  const renderHelpCenter = () => (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            How can we help you?
          </h2>
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles, FAQs, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Browse by Category
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Topics
          </button>
          {Object.keys(faqData).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Results */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Frequently Asked Questions
            {searchQuery && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredFaq().length} results)
              </span>
            )}
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredFaq().map((faq, index) => (
            <div key={index} className="p-6">
              <button
                onClick={() => handleFaqToggle(index)}
                className="w-full text-left flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {faq.question}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      {faq.category}
                    </span>
                    <div className="flex space-x-1">
                      {faq.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {expandedFaq === index ? (
                    <FiMinus className="w-5 h-5 text-gray-400" />
                  ) : (
                    <FiPlus className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedFaq === index && (
                <div className="mt-4 pl-4 border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  <div className="mt-3 flex items-center space-x-4">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                      <FiStar className="w-4 h-4 mr-1" />
                      Was this helpful?
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                      <FiMessageSquare className="w-4 h-4 mr-1" />
                      Still need help?
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContactSupport = () => (
    <div className="space-y-8">
      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiMail className="w-5 h-5 mr-2 text-blue-500" />
            Email Support
          </h3>
          <p className="text-gray-600 mb-4">
            Get help via email within 24 hours
          </p>
          <a
            href={`mailto:${contactInfo.email}`}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            {contactInfo.email}
            <FiExternalLink className="w-4 h-4 ml-1" />
          </a>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiPhone className="w-5 h-5 mr-2 text-green-500" />
            Phone Support
          </h3>
          <p className="text-gray-600 mb-4">Speak with our support team</p>
          <div className="space-y-2">
            <a
              href={`tel:${contactInfo.phone}`}
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              {contactInfo.phone}
              <FiExternalLink className="w-4 h-4 ml-1" />
            </a>
            <p className="text-sm text-gray-500">{contactInfo.hours}</p>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiMessageCircle className="w-5 h-5 mr-2 text-purple-500" />
          Submit a Support Ticket
        </h3>
        <form onSubmit={handleContactSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={contactForm.name}
                onChange={(e) =>
                  handleContactFormChange('name', e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={contactForm.email}
                onChange={(e) =>
                  handleContactFormChange('email', e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={contactForm.category}
                onChange={(e) =>
                  handleContactFormChange('category', e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing & Payment</option>
                <option value="loan">Loan Application</option>
                <option value="account">Account Issues</option>
                <option value="security">Security Concern</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={contactForm.priority}
                onChange={(e) =>
                  handleContactFormChange('priority', e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <div className="flex gap-2">
              <select
                value={contactForm.subject}
                onChange={e => handleContactFormChange('subject', e.target.value)}
                className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a subject</option>
                {SUBJECT_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input
                type="text"
                value={contactForm.subject && !SUBJECT_OPTIONS.includes(contactForm.subject) ? contactForm.subject : ''}
                onChange={e => handleContactFormChange('subject', e.target.value)}
                className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Or enter a custom subject"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              required
              rows="6"
              value={contactForm.message}
              onChange={(e) =>
                handleContactFormChange('message', e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              placeholder="Please provide detailed information about your issue..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Submitting Ticket...
                </>
              ) : (
                <>
                  <FiSend className="w-5 h-5 mr-3" />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDocumentation = () => (
    <div className="space-y-8">
      {/* Quick Start Guide */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiBook className="w-5 h-5 mr-2 text-blue-500" />
          Quick Start Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="font-bold">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Create Account</h4>
            <p className="text-sm text-gray-600">
              Sign up and verify your email address
            </p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="font-bold">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Complete Profile
            </h4>
            <p className="text-sm text-gray-600">
              Upload required documents and verify identity
            </p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="font-bold">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Apply for Loan</h4>
            <p className="text-sm text-gray-600">
              Submit your first loan application
            </p>
          </div>
        </div>
      </div>

      {/* Documentation Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiVideo className="w-5 h-5 mr-2 text-red-500" />
            Video Tutorials
          </h3>
          <div className="space-y-3">
            <a
              href="#"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiPlay className="w-4 h-4 mr-3 text-red-500" />
              <span className="text-sm font-medium">
                Getting Started with Loans
              </span>
            </a>
            <a
              href="#"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiPlay className="w-4 h-4 mr-3 text-red-500" />
              <span className="text-sm font-medium">Document Upload Guide</span>
            </a>
            <a
              href="#"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiPlay className="w-4 h-4 mr-3 text-red-500" />
              <span className="text-sm font-medium">Payment Processing</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiDownload className="w-5 h-5 mr-2 text-green-500" />
            Download Resources
          </h3>
          <div className="space-y-3">
            <a
              href="#"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiFileText className="w-4 h-4 mr-3 text-green-500" />
              <span className="text-sm font-medium">User Manual (PDF)</span>
            </a>
            <a
              href="#"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiFileText className="w-4 h-4 mr-3 text-green-500" />
              <span className="text-sm font-medium">API Documentation</span>
            </a>
            <a
              href="#"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiFileText className="w-4 h-4 mr-3 text-green-500" />
              <span className="text-sm font-medium">Security Guidelines</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="space-y-8">
      {/* Community Forums */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiUsers className="w-5 h-5 mr-2 text-blue-500" />
          Community Forums
        </h3>
        <p className="text-gray-600 mb-6">
          Connect with other users, share experiences, and get help from the
          community.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-2">
              General Discussion
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              General topics and discussions
            </p>
            <span className="text-xs text-gray-500">1.2k members</span>
          </div>

          <div className="p-4 bg-green-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-2">Loan Tips</h4>
            <p className="text-sm text-gray-600 mb-3">
              Tips and advice for loan applications
            </p>
            <span className="text-xs text-gray-500">856 members</span>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-2">
              Technical Support
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Technical issues and solutions
            </p>
            <span className="text-xs text-gray-500">432 members</span>
          </div>
        </div>
      </div>

      {/* Knowledge Base */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiBook className="w-5 h-5 mr-2 text-green-500" />
          Knowledge Base
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Popular Articles
            </h4>
            <div className="space-y-2">
              <a
                href="#"
                className="block text-blue-600 hover:text-blue-700 text-sm"
              >
                How to improve your loan approval chances
              </a>
              <a
                href="#"
                className="block text-blue-600 hover:text-blue-700 text-sm"
              >
                Understanding interest rates and fees
              </a>
              <a
                href="#"
                className="block text-blue-600 hover:text-blue-700 text-sm"
              >
                Best practices for document upload
              </a>
              <a
                href="#"
                className="block text-blue-600 hover:text-blue-700 text-sm"
              >
                Managing your loan payments
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Recent Updates</h4>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-900 font-medium">
                  New mobile app features
                </span>
                <span className="text-gray-500 ml-2">2 days ago</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-900 font-medium">
                  Updated security protocols
                </span>
                <span className="text-gray-500 ml-2">1 week ago</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-900 font-medium">
                  Enhanced loan calculator
                </span>
                <span className="text-gray-500 ml-2">2 weeks ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemStatus = () => (
    <div className="space-y-8">
      {/* Overall Status */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FiMonitor className="w-5 h-5 mr-2 text-green-500" />
            System Status
          </h3>
          <div className="flex items-center">
            <FiCheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-600 font-medium">
              All Systems Operational
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemStatus.services.map((service, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{service.name}</h4>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-600 font-medium">
                    Operational
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">Uptime: {service.uptime}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Maintenance */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiClock className="w-5 h-5 mr-2 text-orange-500" />
          Scheduled Maintenance
        </h3>

        {systemStatus.incidents.map((incident, index) => (
          <div
            key={index}
            className="p-4 bg-orange-50 border border-orange-200 rounded-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {incident.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {incident.description}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <FiCalendar className="w-4 h-4 mr-1" />
                  {incident.date}
                </div>
              </div>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                {incident.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiMapPin className="w-5 h-5 mr-2 text-blue-500" />
          Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center">
              <FiMail className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600">{contactInfo.email}</span>
            </div>
            <div className="flex items-center">
              <FiPhone className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600">{contactInfo.phone}</span>
            </div>
            <div className="flex items-center">
              <FiClock className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600">{contactInfo.hours}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <FiMapPin className="w-4 h-4 text-gray-400 mr-3 mt-1" />
              <span className="text-sm text-gray-600">
                {contactInfo.address}
              </span>
            </div>
            <div className="flex items-center">
              <FiAlertCircle className="w-4 h-4 text-red-400 mr-3" />
              <span className="text-sm text-gray-600">
                Emergency: {contactInfo.emergency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'help-center':
        return renderHelpCenter();
      case 'contact':
        return renderContactSupport();
      case 'documentation':
        return renderDocumentation();
      case 'community':
        return renderCommunity();
      case 'status':
        return renderSystemStatus();
      default:
        return renderHelpCenter();
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Support & Help
              </h1>
              <p className="text-gray-600">
                Get help, find answers, and connect with our support team
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">{renderContent()}</div>
        </div>
      </div>
    </>
  );
};

export default SupportHelpPage;
