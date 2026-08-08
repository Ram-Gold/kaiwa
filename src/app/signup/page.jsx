'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IoEyeSharp, IoEyeOffSharp } from 'react-icons/io5';
import { useAuth } from '../../lib/auth/AuthContext';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2045c0-.638-.0573-1.252-.164-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5836-5.036-3.7109H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9573C.3477 6.1732 0 7.5482 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignupPage() {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { signInWithGoogle, registerWithEmail } = useAuth();

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      router.push('/');
    } catch (err) {
      setError('Failed to sign up with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirm = e.target['confirm-password'].value;

    if (password !== confirm) {
      return setError('Passwords do not match.');
    }

    try {
      setError('');
      setLoading(true);
      await registerWithEmail(email, password, name);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Failed to create an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm brutal-border bg-white p-8 shadow-shadow space-y-5">

        {/* Brand stamp */}
        <div className="text-center space-y-1">
          <span className="inline-block font-mono text-[9px] font-black uppercase tracking-[0.25em] bg-aizome text-paper px-2 py-0.5">
            Create account
          </span>
          <h1 className="font-display text-5xl font-black leading-none text-ink tracking-tight">KAIwa</h1>
          <p className="font-mono text-xs text-ink/40 font-bold uppercase tracking-widest">
            会話 · Conversational Japanese
          </p>
        </div>

        <div className="border-t-2 border-dashed border-ink/20" />

        {error && (
          <div className="brutal-border bg-blush p-3 font-mono text-xs font-black text-ink shadow-shadow text-center">
            {error}
          </div>
        )}

        {/* Google */}
        <button
          type="button"
          id="google-signup"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="brutal-border w-full bg-white flex items-center justify-center gap-3 px-4 py-3 font-mono text-sm font-black uppercase tracking-wider text-ink shadow-shadow hover:bg-mustard transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon /> Sign up with Google
        </button>

        {/* OR divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-ink/15" />
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-ink/40">or</span>
          <div className="flex-1 h-px bg-ink/15" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            id="name"
            type="text"
            placeholder="Display name"
            autoComplete="name"
            required
            className="brutal-border w-full bg-white px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:bg-paper transition-colors"
          />
          <input
            id="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            className="brutal-border w-full bg-white px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:bg-paper transition-colors"
          />
          <div className="brutal-border flex items-center bg-white pr-1">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="new-password"
              required
              className="flex-1 bg-transparent px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/35 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="text-ink/35 hover:text-ink transition-colors p-1"
            >
              {showPw ? <IoEyeOffSharp /> : <IoEyeSharp />}
            </button>
          </div>
          <div className="brutal-border flex items-center bg-white pr-1">
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm password"
              autoComplete="new-password"
              required
              className="flex-1 bg-transparent px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/35 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              className="text-ink/35 hover:text-ink transition-colors p-1"
            >
              {showConfirm ? <IoEyeOffSharp /> : <IoEyeSharp />}
            </button>
          </div>

          <button
            type="submit"
            id="create-account"
            disabled={loading}
            className="brutal-border w-full bg-aizome text-paper px-4 py-3 font-mono text-sm font-black uppercase tracking-wider shadow-shadow hover:bg-shu transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aizome disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Account
          </button>
        </form>

        <p className="text-center font-mono text-[10px] text-ink/40 leading-relaxed">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-black underline decoration-dotted hover:text-ink/70 transition-colors"
          >
            Log in
          </Link>
        </p>

        <p className="text-center font-mono text-[10px] text-ink/25 leading-relaxed">
          By continuing you agree to the{' '}
          <span className="underline decoration-dotted cursor-pointer hover:text-ink/50">Terms</span>
          {' & '}
          <span className="underline decoration-dotted cursor-pointer hover:text-ink/50">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
