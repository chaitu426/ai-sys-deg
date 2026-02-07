'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

export default function SignupPage() {
  const router = useRouter();
  const { register, verifyOtp, resendOtp, isLoading, error, isAuthenticated, isHydrated } =
    useAuthStore();

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [validationError, setValidationError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!isHydrated) return;

    // Redirect ONLY if user is fully authenticated AND OTP is verified
    if (isAuthenticated && step !== 'otp') {
      router.push('/dashboard');
    }
  }, [isHydrated, isAuthenticated, step, router]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name || !email || !password) {
      setValidationError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    try {
      await register(email, password, name);
      console.log('Register success and set to otp');
      setStep('otp');
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (otp.length !== 6) {
      setValidationError('Please enter a valid 6-digit code');
      return;
    }

    try {
      await verifyOtp(email, otp);
      router.push('/dashboard');
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(email);
      // Optional: show a toast or message
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <DottedGlowBackground
        className="pointer-events-none absolute inset-0 mask-radial-to-90% mask-radial-at-center"
        opacity={1}
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-400"
        glowColorLightVar="--color-neutral-500"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-800"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-neutral-200 bg-white/70 px-4 py-1 text-sm text-neutral-700 backdrop-blur dark:border-neutral-800 dark:bg-black/40 dark:text-neutral-300">
            {step === 'details' ? '✨ Start Building' : '🔐 Verification'}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
            {step === 'details' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {step === 'details'
              ? 'Design production-ready systems with AI agents'
              : `We've sent a 6-digit code to ${email}`}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/60">
          {(error || validationError) && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {validationError || error}
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-neutral-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400/40 focus:outline-none dark:border-neutral-700 dark:text-neutral-100"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-neutral-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400/40 focus:outline-none dark:border-neutral-700 dark:text-neutral-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-neutral-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400/40 focus:outline-none dark:border-neutral-700 dark:text-neutral-100"
                  />
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">Minimum 8 characters</p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full rounded-xl border border-neutral-300 bg-transparent py-4 text-center text-2xl tracking-[1em] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400/40 focus:outline-none dark:border-neutral-700 dark:text-neutral-100"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Verify Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-neutral-500">
                Didn&apos;t receive a code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-medium text-neutral-800 hover:underline dark:text-neutral-200"
                >
                  Resend OTP
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-neutral-800 hover:underline dark:text-neutral-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
