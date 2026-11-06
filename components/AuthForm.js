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
const field = 'w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20';
const label = 'mb-1.5 block text-sm font-medium text-white/80';

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
      ? await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.name, role: form.role } } })
      : await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setBusy(false);
    if (error) return setError(error.message);
    if (isSignup && !data.session) setInfo('Account created! Check your email to confirm, then log in.');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 p-6">
      {/* Full-screen dark blue background with drifting colour glows */}
      <motion.div className="absolute -left-24 -top-24 h-[34rem] w-[34rem] rounded-full bg-emerald-500/30 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute -bottom-32 -right-24 h-[36rem] w-[36rem] rounded-full bg-indigo-500/30 blur-3xl"
        animate={{ x: [0, -60, 0], y: [0, -40, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-3xl"
        animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 9, repeat: Infinity }} />

      <Link href="/" className="absolute left-8 top-8 flex items-center gap-2 text-xl font-semibold text-white">
        <TrendingUp className="text-emerald-400" /> FreelanceFlow
      </Link>

      <motion.form onSubmit={submit} className="liquid-glass relative z-10 w-full max-w-md space-y-5 p-8 text-white"
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`); }}
        initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <div>
          <h1 className="text-3xl font-bold">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1 text-white/60">{isSignup ? 'Start managing your freelance finances.' : 'Log in to your dashboard.'}</p>
        </div>

        {isSignup && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button type="button" key={r.id} onClick={() => setForm({ ...form, role: r.id })}
                  className={`rounded-xl border p-3 text-left transition ${form.role === r.id ? 'border-emerald-400 bg-emerald-400/15 ring-4 ring-emerald-400/10' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
                  <r.icon size={20} className="text-emerald-400" />
                  <div className="mt-1 text-sm font-semibold">{r.label}</div>
                  <div className="text-xs text-white/50">{r.hint}</div>
                </button>
              ))}
            </div>
            <div><label className={label}>Full name</label><input className={field} required value={form.name} onChange={set('name')} /></div>
          </>
        )}
        <div><label className={label}>Email</label><input className={field} type="email" required value={form.email} onChange={set('email')} /></div>
        <div><label className={label}>Password</label><input className={field} type="password" required minLength={6} value={form.password} onChange={set('password')} /></div>

        {error && <p className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {info && <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">{info}</p>}

        <button className="btn-primary w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" size={16} />}{isSignup ? 'Create account' : 'Log in'}
        </button>
        <p className="text-center text-sm text-white/60">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <Link className="font-medium text-emerald-400 hover:underline" href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create an account'}</Link>
        </p>
      </motion.form>

      <p className="absolute bottom-6 text-center text-sm text-white/40">Know what you earned, what you owe, and what’s coming.</p>
    </div>
  );
}
