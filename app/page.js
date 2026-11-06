'use client';
import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { BarChart3, Calculator, Check, FileText, ShieldCheck, TrendingUp, Users, Wallet } from 'lucide-react';
import { CountUp } from '@/components/ui';

// Fades and slides content in when it scrolls into view
const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay }}>{children}</motion.div>
);

const features = [
  { icon: FileText, title: 'Invoices in seconds', text: 'Create professional invoices, view them on screen or download a PDF, and see what is overdue at a glance.' },
  { icon: BarChart3, title: 'Cash flow forecast', text: 'See the next 3 months of expected income against your average spending before money gets tight.' },
  { icon: Wallet, title: 'Expense tracking', text: 'Log spending by category and mark what is tax-deductible as you go.' },
  { icon: Calculator, title: 'Tax summary', text: 'Quarterly income, deductions and an estimated tax figure, exportable as CSV for your accountant.' },
  { icon: Users, title: 'Clients and contracts', text: 'Keep every client, contract value and billing progress in one place.' },
  { icon: ShieldCheck, title: 'Secure documents', text: 'Store receipts and contracts privately, with a read-only view you can share with your accounting partner.' },
];
const steps = ['Create your free account', 'Add clients, invoices and expenses', 'Watch your dashboard, forecast and tax summary build themselves'];
const plans = [
  { name: 'Free', price: '₹0', note: 'For getting started', items: ['Clients and contracts', 'Up to 5 invoices a month', 'Expense tracking', 'Dashboard'], cta: 'Start free' },
  { name: 'Pro', price: '₹499', note: 'per month', items: ['Unlimited invoices and PDFs', 'Cash flow forecast', 'Tax summary and CSV export', 'Document storage', 'Accounting partner access'], cta: 'Go Pro', hl: true },
  { name: 'Partners', price: 'Referral', note: 'for platforms and accountants', items: ['Offer FreelanceFlow to members', 'Read-only client books', 'Referral revenue share'], cta: 'Talk to us' },
];
const bars = [40, 65, 50, 80, 60, 90];

export default function Home() {
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });
  const y1 = useTransform(scrollY, [0, 700], [0, -140]);
  const y2 = useTransform(scrollY, [0, 700], [0, 140]);

  return (
    <div className="bg-white">
      <motion.div style={{ scaleX: progress }} className="fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-emerald-500" />
      <nav className="fixed top-1 z-40 flex w-full items-center justify-between bg-slate-900/80 px-6 py-4 text-white backdrop-blur">
        <div className="flex items-center gap-2 font-semibold"><TrendingUp className="text-emerald-400" /> FreelanceFlow</div>
        <div className="hidden gap-6 text-sm text-slate-300 md:flex"><a href="#features">Features</a><a href="#how">How it works</a><a href="#pricing">Pricing</a></div>
        <div className="flex gap-2"><Link href="/login" className="btn text-white hover:bg-white/10">Log in</Link><Link href="/signup" className="btn-primary">Get started</Link></div>
      </nav>

      <header className="relative overflow-hidden bg-slate-900 px-6 pb-24 pt-36 text-white">
        <motion.div style={{ y: y1 }} className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
        <motion.div style={{ y: y2 }} className="absolute -right-24 top-40 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-emerald-300">Built for freelancers and consultants</span>
            <h1 className="mt-5 text-5xl font-bold leading-tight">Your freelance money, <span className="text-emerald-400">finally under control.</span></h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">Invoices, expenses, taxes and cash flow forecasts in one simple app. No accounting degree needed.</p>
            <div className="mt-8 flex gap-3"><Link href="/signup" className="btn-primary px-6 py-3">Get started free</Link><a href="#features" className="btn bg-white/10 px-6 py-3 text-white hover:bg-white/20">See features</a></div>
            <p className="mt-4 text-sm text-slate-400">Supports INR and USD</p>
          </motion.div>
          <motion.div className="card bg-white p-5 text-slate-800 shadow-2xl" initial={{ opacity: 0, scale: 0.9, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div className="text-sm text-slate-500">Earned this month</div><div className="text-3xl font-bold">₹1,24,500</div>
            <div className="mt-4 flex h-36 items-end gap-3">
              {bars.map((h, i) => <motion.div key={i} className="flex-1 rounded-t-lg bg-emerald-500" initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }} />)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-amber-50 p-3 text-amber-700">Outstanding ₹60,000</div><div className="rounded-xl bg-rose-50 p-3 text-rose-700">Overdue ₹20,000</div></div>
          </motion.div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-16 text-center sm:grid-cols-3">
        {[[70, '%', 'of freelancers struggle to forecast income'], [3, ' tools', 'usually needed to track money'], [5, ' min', 'to set up FreelanceFlow']].map(([n, s, t], i) => (
          <Reveal key={i} delay={i * 0.1}><div className="text-5xl font-bold text-emerald-600"><CountUp value={n} format={(v) => Math.round(v) + s} /></div><p className="mt-2 text-slate-500">{t}</p></Reveal>
        ))}
      </section>

      <section id="features" className="bg-slate-50 px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center"><h2 className="text-4xl font-bold">Everything you need, nothing you don’t</h2><p className="mt-3 text-slate-500">Simple tools for the money side of independent work.</p></Reveal>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.1}><div className="card h-full p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600"><f.icon /></div><h3 className="font-semibold">{f.title}</h3><p className="mt-2 text-sm text-slate-500">{f.text}</p>
            </div></Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="px-6 py-20">
        <Reveal className="text-center"><h2 className="text-4xl font-bold">How it works</h2></Reveal>
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
          {steps.map((s, i) => <Reveal key={s} delay={i * 0.15} className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">{i + 1}</div><p className="mt-4 font-medium">{s}</p></Reveal>)}
        </div>
      </section>

      <section id="pricing" className="bg-slate-50 px-6 py-20">
        <Reveal className="text-center"><h2 className="text-4xl font-bold">Simple pricing</h2><p className="mt-2 text-sm text-slate-500">Freemium for individuals, subscriptions for power users, referrals for partners</p></Reveal>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1}><div className={`card h-full p-6 ${p.hl ? 'border-emerald-500 ring-4 ring-emerald-100' : ''}`}>
              <h3 className="font-semibold">{p.name}</h3><div className="mt-2 text-4xl font-bold">{p.price}</div><div className="text-sm text-slate-500">{p.note}</div>
              <ul className="my-5 space-y-2 text-sm">{p.items.map((it) => <li key={it} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{it}</li>)}</ul>
              <Link href="/signup" className={p.hl ? 'btn-primary w-full' : 'btn-ghost w-full'}>{p.cta}</Link>
            </div></Reveal>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-20 text-center text-white">
        <Reveal><h2 className="text-4xl font-bold">Ready to take control of your income?</h2><Link href="/signup" className="btn-primary mt-8 px-8 py-3">Create your free account</Link></Reveal>
      </section>
      <footer className="bg-slate-900 pb-8 text-center text-sm text-slate-500">© 2026 FreelanceFlow</footer>
    </div>
  );
}
