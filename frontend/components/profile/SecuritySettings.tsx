'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, XCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import VerifyEmailPanel from './VerifyEmailPanel';

export default function SecuritySettings() {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Email verification state
  const [sendingVerification, setSendingVerification] = useState(false);
  const [isVerifyPanelOpen, setIsVerifyPanelOpen] = useState(false);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isGoogleUser = user?.provider === 'google';
  const isEmailVerified = user?.isEmailVerified;

  const handleSendVerificationEmail = async () => {
    setSendingVerification(true);
    setError('');
    setSuccess('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/api/users/send-verification-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Verification code sent! Please check your inbox.');
        setIsVerifyPanelOpen(true); // Open the verification panel
      } else {
        setError(data.message || 'Failed to send verification email');
      }
    } catch (err) {
      setError('Failed to send verification email');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleVerified = () => {
    setSuccess('Email verified successfully!');
    setError('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">Security Settings</h2>

      {/* Email Verification Section */}
      {!isGoogleUser && (
        <div className="border border-neutral-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-neutral-700" />
                <h3 className="text-lg font-semibold">Email Verification</h3>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                {isEmailVerified 
                  ? 'Your email address has been verified.' 
                  : 'Verify your email address to create listings and make reservations.'}
              </p>
              
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{user?.email}</div>
                {isEmailVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            {!isEmailVerified && (
              <Button
                onClick={handleSendVerificationEmail}
                disabled={sendingVerification}
                className="ml-4"
              >
                {sendingVerification ? 'Sending...' : 'Verify Email'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Verification Panel */}
      <VerifyEmailPanel
        isOpen={isVerifyPanelOpen}
        onClose={() => setIsVerifyPanelOpen(false)}
        onVerified={handleVerified}
      />

      {/* Password Change Section */}
      {!isGoogleUser && (
        <div className="border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold">Change Password</h3>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            {isEmailVerified 
              ? 'Update your password to keep your account secure.' 
              : 'You must verify your email before changing your password.'}
          </p>

          {!showPasswordForm ? (
            <Button
              onClick={() => setShowPasswordForm(true)}
              disabled={!isEmailVerified}
              variant="outline"
            >
              Change Password
            </Button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Minimum 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Google User Info */}
      {isGoogleUser && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Google Account</h3>
              <p className="text-sm text-blue-800">
                You're signed in with Google. Your email is automatically verified, and password management
                is handled through your Google account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {success}
        </div>
      )}
    </div>
  );
}
