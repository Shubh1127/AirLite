'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiUrl}/api/users/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify email');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to verify email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Verifying Your Email</h1>
            <p className="text-neutral-600">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-green-700">Email Verified!</h1>
            <p className="text-neutral-600 mb-6">{message}</p>
            <p className="text-sm text-neutral-500 mb-8">
              You can now create listings and make reservations.
            </p>
            <div className="space-y-3">
              <Link href="/users/profile">
                <Button className="w-full">Go to Profile</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Browse Listings</Button>
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-700">Verification Failed</h1>
            <p className="text-neutral-600 mb-6">{message}</p>
            <p className="text-sm text-neutral-500 mb-8">
              The verification link may have expired or is invalid.
            </p>
            <div className="space-y-3">
              <Link href="/users/profile/settings">
                <Button className="w-full">Request New Link</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Go Home</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
