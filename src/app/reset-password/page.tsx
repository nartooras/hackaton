'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    // Validate token on page load
    const validateToken = async () => {
      if (!token) {
        setError('No reset token found.');
        setLoading(false);
        return;
      }

      // Implement API call to validate token
      console.log('Validating token via API:', token);

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();
        if (response.ok) {
          setTokenValid(true);
          setMessage(data.message || 'Token is valid. Please set your new password.');
        } else {
          setError(data.error || 'Invalid or expired token.');
          setTokenValid(false); // Ensure tokenValid is false on error
        }
      } catch (err) {
        setError('An error occurred during token validation.');
        console.error(err);
        setTokenValid(false); // Ensure tokenValid is false on error
      }
      setLoading(false);
    };

    validateToken();
  }, [token]); // Re-run if token changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
       setError('No reset token found.');
       return;
    }

    // Implement API call to reset password
    console.log('Attempting to reset password via API with token:', token);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Your password has been reset successfully. You can now log in.');
        setPassword('');
        setConfirmPassword('');
        setError(''); // Clear any previous errors on success
        // Optionally redirect to login page after a delay
        // setTimeout(() => router.push('/login'), 3000); // Uncomment if useRouter is needed
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('An error occurred during password reset.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors p-4">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">Verifying token...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors p-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-8 space-y-6 backdrop-blur-md animate-fade-in-up">
        <h1 className="text-3xl font-bold text-center text-blue-900 dark:text-blue-200">Reset Password</h1>

        {message && <p className="text-green-600 dark:text-green-400 text-center">{message}</p>}
        {/* Add a link to login page after successful reset (when password fields are cleared) */}
        {tokenValid && !password && !confirmPassword && message && (
          <div className="text-center mt-4">
            <a href="/login" className="text-blue-600 hover:underline dark:text-blue-400">Go to Login Page</a>
          </div>
        )}
        {error && <p className="text-red-600 dark:text-red-400 text-center">{error}</p>}

        {tokenValid && message !== 'Your password has been reset successfully. You can now log in.' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-800/80 placeholder-slate-500 dark:placeholder-slate-300"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-800/80 placeholder-slate-500 dark:placeholder-slate-300"
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95 transition-all cursor-pointer"
            >
              Reset Password
            </button>
          </form>
        ) : null}

        {!tokenValid && !loading && !error && (
             <p className="text-center text-gray-600 dark:text-gray-400">Enter your email to request a password reset link.</p>
        )}
         {!tokenValid && !loading && error && (
             <p className="text-center text-gray-600 dark:text-gray-400">Please check the link or request a new reset.</p>
        )}

      </div>
    </main>
  );
} 