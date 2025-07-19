import React, { useState } from 'react';
import { useAuth } from '../App';

const HelpSupportPage = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('faq');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const faqData = [
    {
      id: 1,
      question: "How do I create a new ticket?",
      answer: "To create a new ticket, navigate to the Tickets page and click the 'Create Ticket' button. Fill in the required information including title, description, priority, and category.",
      category: "Tickets"
    },
    {
      id: 2,
      question: "How do I update my profile information?",
      answer: "Go to the Profile page where you can edit your name, email, and other personal information. Click 'Edit Profile' to make changes and 'Save Changes' to update.",
      category: "Profile"
    },
    {
      id: 3,
      question: "What are the different user roles?",
      answer: "There are two main roles: Admin (full access to all features including user management) and User (access to tickets, profile, and basic features).",
      category: "Permissions"
    },
    {
      id: 4,
      question: "How do I reset my password?",
      answer: "On the login page, click 'Forgot Password' and enter your email address. You'll receive instructions to reset your password.",
      category: "Account"
    },
    {
      id: 5,
      question: "Can I delete tickets?",
      answer: "Admin users can delete tickets. Regular users can only view and edit their own tickets but cannot delete them.",
      category: "Tickets"
    },
    {
      id: 6,
      question: "How do I manage notifications?",
      answer: "Visit the Notifications page to view, mark as read, or delete notifications. You can filter by read/unread status.",
      category: "Notifications"
    }
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    
    // Mock API call
    setTimeout(() => {
      setSubmitStatus('success');
      setContactForm({ subject: '', message: '', priority: 'medium' });
      setTimeout(() => setSubmitStatus(null), 3000);
    }, 1000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-600">
          Find answers to common questions or contact our support team
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveSection('faq')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'faq' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          FAQ
        </button>
        <button
          onClick={() => setActiveSection('guides')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'guides' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          User Guides
        </button>
        <button
          onClick={() => setActiveSection('contact')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'contact' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Contact Support
        </button>
      </div>

      {/* FAQ Section */}
      {activeSection === 'faq' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqData.map((faq) => (
                  <div key={faq.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {faq.answer}
                        </p>
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {faq.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Guides Section */}
      {activeSection === 'guides' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Getting Started",
              description: "Learn the basics of using FlowBit.ai platform",
              icon: "🚀",
              topics: ["Account Setup", "First Login", "Navigation", "Basic Features"]
            },
            {
              title: "Ticket Management",
              description: "Complete guide to creating and managing tickets",
              icon: "🎫",
              topics: ["Creating Tickets", "Priority Levels", "Categories", "Status Updates"]
            },
            {
              title: "User Management",
              description: "Admin guide to managing users and permissions",
              icon: "👥",
              topics: ["Adding Users", "Role Assignment", "Permissions", "Deactivation"]
            },
            {
              title: "Workflows",
              description: "Setting up and managing automated workflows",
              icon: "⚙️",
              topics: ["Workflow Builder", "Triggers", "Actions", "Testing"]
            },
            {
              title: "Settings & Configuration",
              description: "Customizing your platform experience",
              icon: "🔧",
              topics: ["Profile Settings", "Notifications", "Preferences", "Security"]
            },
            {
              title: "Troubleshooting",
              description: "Common issues and their solutions",
              icon: "🔍",
              topics: ["Login Issues", "Performance", "Browser Support", "Mobile Access"]
            }
          ].map((guide, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{guide.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {guide.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {guide.description}
              </p>
              <ul className="space-y-1 mb-4">
                {guide.topics.map((topic, topicIndex) => (
                  <li key={topicIndex} className="text-sm text-gray-500 flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {topic}
                  </li>
                ))}
              </ul>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Read Guide →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Contact Support Section */}
      {activeSection === 'contact' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Support</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  Your support request has been submitted successfully! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-6">
                {/* User Info Display */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Your Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900">
                        {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{user?.email || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <span className="ml-2 text-gray-900">{user?.role || 'Not assigned'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Customer ID:</span>
                      <span className="ml-2 text-gray-900">{user?.customerId || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={contactForm.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low - General question</option>
                    <option value="medium">Medium - Need assistance</option>
                    <option value="high">High - Issue affecting work</option>
                    <option value="urgent">Urgent - Critical issue</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of your issue or question"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {contactForm.message.length}/500 characters
                  </p>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={submitStatus === 'submitting' || !contactForm.subject.trim() || !contactForm.message.trim()}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                      submitStatus === 'submitting' || !contactForm.subject.trim() || !contactForm.message.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {submitStatus === 'submitting' ? 'Submitting...' : 'Send Support Request'}
                  </button>
                </div>
              </form>

              {/* Additional Support Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Other ways to get help</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">📧 Email:</span>
                    <span>support@flowbit.ai</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">📞 Phone:</span>
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">⏰ Hours:</span>
                    <span>Monday - Friday, 9 AM - 6 PM EST</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">🕐 Response Time:</span>
                    <span>Typically within 24 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSupportPage;
