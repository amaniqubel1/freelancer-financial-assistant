'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, Calculator, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const roles = [
  { id: 'freelancer', label: 'Freelancer', icon: Briefcase, hint: 'Manage my own money' },
  { id: 'partner', label: 'Accounting partner', icon: Calculator, hint: 'View my clients’ books' },
];

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const { session } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'freelancer' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Once Supabase reports a session, go to the app
  useEffect(() => { if (session) router.replace('/dashboard'); }, [session, router]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setInfo('');
    const { data, error } = isSignup
      ? await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name, role: form.role } },
        })
      : await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setBusy(false);
    if (error) return setError(error.message);
    if (isSignup && !data.session) setInfo('Account created! Check your email to confirm, then log in.');
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <motion.div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity }} />
        <motion.div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity }} />
        <Link href="/" className="relative flex items-center gap-2 text-xl font-semibold">
          <TrendingUp className="text-emerald-400" /> FreelanceFlow
        </Link>
        <motion.div className="relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-4xl font-bold leading-tight">Know what you earned,<br />what you owe,<br />and what’s coming.</h2>
          <p className="mt-4 max-w-md text-slate-300">Invoices, expenses, taxes and cash flow in one simple place built for independent professionals.</p>
        </motion.div>
        <p className="relative text-sm text-slate-400">INR and USD supported</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <motion.form onSubmit={submit} className="w-full max-w-md space-y-5"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div>
            <h1 className="text-3xl font-bold">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
            <p className="mt-1 text-slate-500">{isSignup ? 'Start managing your freelance finances.' : 'Log in to your dashboard.'}</p>
          </div>

          {isSignup && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button type="button" key={r.id} onClick={() => setForm({ ...form, role: r.id })}
                    className={`rounded-xl border p-3 text-left transition ${form.role === r.id ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <r.icon size={20} className="text-emerald-600" />
                    <div className="mt-1 text-sm font-semibold">{r.label}</div>
                    <div className="text-xs text-slate-500">{r.hint}</div>
                  </button>
                ))}
              </div>
              <div><label className="label">Full name</label><input className="input" required value={form.name} onChange={set('name')} /></div>
            </>
          )}
          <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={set('email')} /></div>
          <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} /></div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {info && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" size={16} />}{isSignup ? 'Create account' : 'Log in'}
          </button>
          <p className="text-center text-sm text-slate-500">
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <Link className="font-medium text-emerald-600 hover:underline" href={isSignup ? '/login' : '/signup'}>
              {isSignup ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
