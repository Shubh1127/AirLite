'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ChevronLeft, Trash2, Plus, Check, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Language {
  language: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

interface Education {
  degree: string;
  field: string;
  institution: string;
  graduationYear: number;
}

interface ProfessionalWork {
  title: string;
  company: string;
  industry: string;
  yearsOfExperience: number;
}

interface Certification {
  name: string;
  issuer: string;
  year: number;
}

interface LocalRecommendation {
  type: 'restaurant' | 'cafe' | 'attraction' | 'hidden_gem' | 'shopping' | 'hiking' | 'outdoor' | 'activity';
  name: string;
  description: string;
}

export default function HostProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Host profile fields
  const [hostBio, setHostBio] = useState('');
  const [whyHost, setWhyHost] = useState('');
  const [hostStory, setHostStory] = useState('');
  const [hostingStyle, setHostingStyle] = useState<string[]>([]);
  const [newHostingStyle, setNewHostingStyle] = useState('');

  // Languages
  const [languages, setLanguages] = useState<Language[]>([]);
  const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: 'fluent' as const });

  // Education
  const [education, setEducation] = useState<Education>({
    degree: '',
    field: '',
    institution: '',
    graduationYear: new Date().getFullYear(),
  });

  // Professional Work
  const [professionalWork, setProfessionalWork] = useState<ProfessionalWork>({
    title: '',
    company: '',
    industry: '',
    yearsOfExperience: 0,
  });

  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    year: new Date().getFullYear(),
  });

  // Local Recommendations
  const [recommendations, setRecommendations] = useState<LocalRecommendation[]>([]);
  const [newRecommendation, setNewRecommendation] = useState({
    type: 'restaurant' as const,
    name: '',
    description: '',
  });

  // Response Stats
  const [responseTime, setResponseTime] = useState('within a day');

  // Verifications
  const [verifications, setVerifications] = useState({
    email: false,
    phone: false,
    identity: false,
    workEmail: false,
    governmentId: false,
  });

  // OTP verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'host' && user?.role !== 'both') {
      router.push('/users/profile');
      return;
    }

    const loadHostProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/host-profile`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        if (res.ok) {
          const data = await res.json();
          const hp = data.hostProfile || {};

          setHostBio(hp.hostBio || '');
          setWhyHost(hp.whyHost || '');
          setHostStory(hp.hostStory || '');
          setHostingStyle(hp.hostingStyle || []);
          setLanguages(hp.languages || []);
          setEducation(hp.education || {
            degree: '',
            field: '',
            institution: '',
            graduationYear: new Date().getFullYear(),
          });
          setProfessionalWork(hp.professionalWork || {
            title: '',
            company: '',
            industry: '',
            yearsOfExperience: 0,
          });
          setCertifications(hp.certifications || []);
          setRecommendations(hp.localRecommendations || []);
          setResponseTime(hp.responseStats?.responseTime || 'within a day');
          setVerifications(hp.verifications || {
            email: false,
            phone: false,
            identity: false,
            workEmail: false,
            governmentId: false,
          });
        }
      } catch (err) {
        console.error('Failed to load host profile:', err);
        setError('Failed to load host profile');
      } finally {
        setLoading(false);
      }
    };

    loadHostProfile();
  }, [hasHydrated, isAuthenticated, user?.role, router, token]);

  const handleAddLanguage = () => {
    if (!newLanguage.language.trim()) return;
    setLanguages([...languages, newLanguage]);
    setNewLanguage({ language: '', proficiency: 'fluent' });
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleAddHostingStyle = () => {
    if (!newHostingStyle.trim()) return;
    setHostingStyle([...hostingStyle, newHostingStyle.trim()]);
    setNewHostingStyle('');
  };

  const handleRemoveHostingStyle = (index: number) => {
    setHostingStyle(hostingStyle.filter((_, i) => i !== index));
  };

  const handleAddCertification = () => {
    if (!newCertification.name.trim() || !newCertification.issuer.trim()) return;
    setCertifications([...certifications, newCertification]);
    setNewCertification({ name: '', issuer: '', year: new Date().getFullYear() });
  };

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleAddRecommendation = () => {
    if (!newRecommendation.name.trim()) return;
    setRecommendations([...recommendations, newRecommendation]);
    setNewRecommendation({ type: 'restaurant', name: '', description: '' });
  };

  const handleRemoveRecommendation = (index: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/host-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          hostBio,
          whyHost,
          hostStory,
          hostingStyle,
          languages,
          education,
          professionalWork,
          certifications,
          localRecommendations: recommendations,
          responseTime,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update host profile');
      }

      setSuccess('Host profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving host profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save host profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/host/send-email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setOtpSent(true);
      setShowOtpModal(true);
      setSuccess('OTP sent to your email! Valid for 15 minutes.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/host/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      setVerifications(data.verifications);
      setShowOtpModal(false);
      setOtp('');
      setOtpSent(false);
      setSuccess('Email verified successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setOtp('');
    setError('');
  };

  if (loading || !hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.div
      className="min-h-screen bg-white pb-24"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
    >
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/users/profile" className="p-2 hover:bg-neutral-100 rounded-full transition">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold">Host Profile</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-3 mb-8">
          <Link href="/users/profile" className="p-2 hover:bg-neutral-100 rounded-full transition border border-neutral-200">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Host Profile</h1>
            <p className="text-sm text-neutral-600">Manage your host information and verifications</p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Host Bio Section */}
          <section className="border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">About You</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Host Bio</label>
                <textarea
                  value={hostBio}
                  onChange={(e) => setHostBio(e.target.value)}
                  placeholder="Brief introduction about yourself as a host..."
                  className="w-full border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Why I host</label>
                <textarea
                  value={whyHost}
                  onChange={(e) => setWhyHost(e.target.value)}
                  placeholder="Your reasons for hosting guests..."
                  className="w-full border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Host Story</label>
                <textarea
                  value={hostStory}
                  onChange={(e) => setHostStory(e.target.value)}
                  placeholder="Your personal story and hosting journey..."
                  className="w-full border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* Hosting Style Section */}
          <section className="border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Hosting Style</h2>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHostingStyle}
                  onChange={(e) => setNewHostingStyle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddHostingStyle();
                    }
                  }}
                  placeholder="e.g., Communicative, Helpful, Pet-friendly..."
                  className="flex-1 border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  onClick={handleAddHostingStyle}
                  className="px-4 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {hostingStyle.map((style, index) => (
                  <div key={index} className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {style}
                    <button
                      onClick={() => handleRemoveHostingStyle(index)}
                      className="hover:text-rose-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Languages Section */}
          <section className="border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Languages</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newLanguage.language}
                  onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                  placeholder="Language name..."
                  className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex gap-2">
                  <select
                    value={newLanguage.proficiency}
                    onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value as any })}
                    className="flex-1 border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="conversational">Conversational</option>
                    <option value="fluent">Fluent</option>
                    <option value="native">Native</option>
                  </select>
                  <button
                    onClick={handleAddLanguage}
                    className="px-4 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {languages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{lang.language}</p>
                      <p className="text-xs text-neutral-600 capitalize">{lang.proficiency}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveLanguage(index)}
                      className="p-2 hover:bg-neutral-200 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Education Section */}
          <section className="border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Education</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={education.degree}
                onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                placeholder="Degree..."
                className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <input
                type="text"
                value={education.field}
                onChange={(e) => setEducation({ ...education, field: e.target.value })}
                placeholder="Field of study..."
                className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <input
                type="text"
                value={education.institution}
                onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                placeholder="Institution..."
                className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <input
                type="number"
                value={education.graduationYear}
                onChange={(e) => setEducation({ ...education, graduationYear: parseInt(e.target.value) })}
                placeholder="Graduation year..."
                className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </section>

          {/* Professional Work Section */}
          <section className="border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Professional Background</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={professionalWork.title}
                onChange={(e) => setProfessionalWork({ ...professionalWork, title: e.target.value })}
                placeholder="Job title..."
                className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <input
                type="text"
                value={professionalWork.company}
                onChange={(e) => setProfessionalWork({ ...professionalWork, company: e.target.value })}
                placeholder="Company..."
                className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <input
                type="text"
                value={professionalWork.industry}
                onChange={(e) => setProfessionalWork({ ...professionalWork, industry: e.target.value })}
                placeholder="Industry..."
                className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <input
                type="number"
                value={professionalWork.yearsOfExperience}
                onChange={(e) => setProfessionalWork({ ...professionalWork, yearsOfExperience: parseInt(e.target.value) || 0 })}
                placeholder="Years of experience..."
                className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </section>

          {/* Certifications Section */}
          <section className="border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Certifications</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newCertification.name}
                  onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                  placeholder="Certification name..."
                  className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <input
                  type="text"
                  value={newCertification.issuer}
                  onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                  placeholder="Issuer..."
                  className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newCertification.year}
                    onChange={(e) => setNewCertification({ ...newCertification, year: parseInt(e.target.value) })}
                    placeholder="Year"
                    className="flex-1 border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    onClick={handleAddCertification}
                    className="px-4 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-xs text-neutral-600">{cert.issuer} • {cert.year}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCertification(index)}
                      className="p-2 hover:bg-neutral-200 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Local Recommendations Section */}
          <section className="border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Local Recommendations</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={newRecommendation.type}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, type: e.target.value as any })}
                  className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="attraction">Attraction</option>
                  <option value="hidden_gem">Hidden Gem</option>
                  <option value="shopping">Shopping</option>
                  <option value="hiking">Hiking</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="activity">Activity</option>
                </select>
                <input
                  type="text"
                  value={newRecommendation.name}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, name: e.target.value })}
                  placeholder="Place name..."
                  className="border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRecommendation.description}
                    onChange={(e) => setNewRecommendation({ ...newRecommendation, description: e.target.value })}
                    placeholder="Description..."
                    className="flex-1 border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    onClick={handleAddRecommendation}
                    className="px-4 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium capitalize">{rec.name} • {rec.type.replace('_', ' ')}</p>
                      <p className="text-xs text-neutral-600">{rec.description}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveRecommendation(index)}
                      className="p-2 hover:bg-neutral-200 rounded-lg transition ml-2"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Response Time Section */}
          <section className="border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Response Preferences</h2>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Typical Response Time</label>
              <select
                value={responseTime}
                onChange={(e) => setResponseTime(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="within an hour">Within an hour</option>
                <option value="within a few hours">Within a few hours</option>
                <option value="within a day">Within a day</option>
                <option value="a few days or more">A few days or more</option>
              </select>
            </div>
          </section>

          {/* Verifications Section */}
          <section className="border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Verifications</h2>
            
            <div className="space-y-3">
              {Object.entries(verifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <span className="font-medium capitalize">{key === 'governmentId' ? 'Government ID' : key === 'workEmail' ? 'Work Email' : key}</span>
                  <div className="flex items-center gap-2">
                    {value ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    ) : key === 'email' ? (
                      <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        {sendingOtp ? 'Sending...' : 'Verify Now'}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-neutral-600 bg-neutral-200 px-3 py-1 rounded-full">
                        Not Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-600 mt-4">
              Email verification requires an OTP sent to your registered email. Other verifications are managed through support.
            </p>
          </section>

          {/* Save Button */}
          <div className="flex gap-3 sticky bottom-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Verify Email</h2>
              <button
                onClick={handleCloseOtpModal}
                className="p-2 hover:bg-neutral-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div>
              <p className="text-sm text-neutral-600 mb-6">
                We've sent a 6-digit verification code to your email. Please enter it below.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    if (error) setError('');
                  }}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full border border-neutral-300 rounded-lg p-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseOtpModal}
                  className="flex-1 px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otp.length !== 6}
                  className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              {/* Resend */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="text-sm text-rose-500 hover:text-rose-600 font-medium disabled:opacity-50"
                >
                  {sendingOtp ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
