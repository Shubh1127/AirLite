'use client';

import { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

interface VerifyEmailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export default function VerifyEmailPanel({ isOpen, onClose, onVerified }: VerifyEmailPanelProps) {
  const { token, updateUser, user } = useAuthStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      // Focus last input
      const lastInput = document.getElementById('code-5');
      lastInput?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/api/users/verify-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setError('');
        
        // Update user state
        if (user) {
          updateUser({
            ...user,
            isEmailVerified: true,
          });
        }

        // Show success for 1.5 seconds then close
        setTimeout(() => {
          onVerified();
          onClose();
          setSuccess(false);
          setCode(['', '', '', '', '', '']);
        }, 1500);
      } else {
        setError(data.message || 'Invalid or expired verification code');
      }
    } catch (err) {
      setError('Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Sliding Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">Verify Your Email</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!success ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
                <p className="text-neutral-600 text-sm">
                  We've sent a 6-digit verification code to<br />
                  <span className="font-medium text-neutral-900">{user?.email}</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-center">
                  Enter Verification Code
                </label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  ))}
                </div>
                <p className="text-xs text-neutral-500 text-center mt-3">
                  Code expires in 15 minutes
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleVerify}
                disabled={loading || code.join('').length !== 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Didn't receive the code?</strong><br />
                  Check your spam folder or request a new code from the security settings.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">Email Verified!</h3>
              <p className="text-neutral-600">
                Your email has been successfully verified.<br />
                You can now create listings and make reservations.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
