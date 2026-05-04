import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/client';

type Phase = 'loading' | 'success' | 'error';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function parseHashParams(hash: string): Record<string, string> {
  return Object.fromEntries(
    hash.replace(/^#/, '').split('&').map(pair => pair.split('=').map(decodeURIComponent))
  );
}

export default function VerifyEmailPage() {
  const [phase, setPhase] = useState<Phase>('loading');

  useEffect(() => {
    // Supabase puts tokens in the URL hash: #access_token=...&type=signup
    const hash = parseHashParams(window.location.hash);
    const accessToken = hash['access_token'];
    const type = hash['type'];

    // Only process email confirmation events
    if (!accessToken || type !== 'signup') {
      setPhase('error');
      return;
    }

    // Decode the JWT to get the user's email without the Supabase SDK
    const payload = decodeJwtPayload(accessToken);
    const email = payload?.email as string | undefined;

    if (!email) {
      setPhase('error');
      return;
    }

    // Tell our backend to mark this user as email-verified
    api.post('/auth/verify-email', { email })
      .then(() => setPhase('success'))
      .catch(() => {
        // Even if our backend call fails, Supabase already verified them.
        // Show success so they're not blocked.
        setPhase('success');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-10 max-w-sm w-full text-center">

        {phase === 'loading' && (
          <>
            <Loader2 size={40} className="animate-spin text-brand-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Verifying your email…</h2>
            <p className="text-gray-400 text-sm mt-2">This only takes a moment.</p>
          </>
        )}

        {phase === 'success' && (
          <>
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Email verified!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your email address has been confirmed. You can now sign in to Nest.
            </p>
            <Link
              to="/login"
              className="inline-block w-full py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
            >
              Sign in
            </Link>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Link not valid</h2>
            <p className="text-gray-500 text-sm mb-6">
              This verification link may be expired or already used. Try signing in — your email may already be verified.
            </p>
            <Link
              to="/login"
              className="inline-block w-full py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
            >
              Go to login
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
