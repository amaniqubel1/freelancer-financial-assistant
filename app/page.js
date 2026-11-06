'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { Instrument_Serif } from 'next/font/google';
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, BarChart3, Calculator, Check, FileText, ShieldCheck, TrendingUp, Users, Wallet } from 'lucide-react';
import { CountUp } from '@/components/ui';

// Italic serif used for the accent words in headings
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic' });
const It = ({ children }) => <span className={`${serif.className} font-normal`}>{children}</span>;

// Soft light that follows the cursor: a fast lime glow, a slow teal glow, and a dot grid revealed under the pointer
function CursorGlow() {
  const x = useMotionValue(-600), y = useMotionValue(-600);
  const fx = useSpring(x, { stiffness: 140, damping: 22 }), fy = useSpring(y, { stiffness: 140, damping: 22 });
  const sx = useSpring(x, { stiffness: 35, damping: 18 }), sy = useSpring(y, { stiffness: 35, damping: 18 });
  useEffect(() => {
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [x, y]);
  const lime = useMotionTemplate`radial-gradient(520px circle at ${fx}px ${fy}px, rgba(16,185,129,0.22), transparent 65%)`;
  const teal = useMotionTemplate`radial-gradient(760px circle at ${sx}px ${sy}px, rgba(99,102,241,0.20), transparent 70%)`;
  const mask = useMotionTemplate`radial-gradient(240px circle at ${fx}px ${fy}px, black, transparent)`;
  return (
    <>
      <motion.div className="pointer-events-none fixed inset-0 z-0" style={{ background: teal }} />
      <motion.div className="pointer-events-none fixed inset-0 z-0" style={{ background: lime }} />
      <motion.div className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '26px 26px', WebkitMaskImage: mask, maskImage: mask }} />
    </>
  );
}

// Frosted glass card; the lime sheen follows the mouse inside it
function Glass({ children, className = '' }) {
  return (
    <div className={`glass ${className}`} onPointerMove={(e) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
    }}>{children}</div>
  );
}

const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
);
const Pill = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-white/70 backdrop-blur">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{children}
  </span>
);
const limeBtn = 'inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500';
const glassBtn = 'inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm text-white backdrop-blur transition hover:bg-white/10';

const features = [
  { icon: FileText, title: 'Invoices in seconds', text: 'Create, view on screen, download a PDF. Overdue invoices flag themselves.', wide: true },
  { icon: BarChart3, title: 'Cash flow forecast', text: 'See the next 3 months of expected income against your average spending.' },
  { icon: Wallet, title: 'Expense tracking', text: 'Log spending by category and mark what is tax-deductible.' },
  { icon: Calculator, title: 'Tax summary', text: 'Quarterly income, deductions and an estimated tax figure, exportable as CSV.', wide: true },
  { icon: Users, title: 'Clients and contracts', text: 'Every client, contract value and billing progress in one place.' },
  { icon: ShieldCheck, title: 'Secure documents', text: 'Private storage for receipts and contracts, shareable read-only with your accountant.' },
];
const glue = [
  ['01', 'Sign up free', 'Pick freelancer or accounting partner. No card, no setup call.'],
  ['02', 'Add the work', 'Clients, contracts, invoices and expenses go in as you work.'],
  ['03', 'Let it add up', 'Dashboard, forecast and tax summary build themselves.'],
];
const plans = [
  { name: 'Free', price: '₹0', note: 'for getting started', items: ['Clients and contracts', 'Up to 5 invoices a month', 'Expense tracking', 'Dashboard'], cta: 'Start free' },
  { name: 'Pro', price: '₹499', note: 'a month', items: ['Unlimited invoices and PDFs', 'Cash flow forecast', 'Tax summary and CSV export', 'Document storage', 'Accountant access'], cta: 'Go Pro', hl: true },
  { name: 'Partners', price: 'Referral', note: 'for accountants and platforms', items: ['Offer FreelanceFlow to members', 'Read-only client books', 'Referral revenue share'], cta: 'Talk to us' },
];
const bars = [38, 62, 48, 78, 58, 92];

export default function Home() {
  const { scrollY, scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });
  const y1 = useTransform(scrollY, [0, 800], [0, -160]);
  const y2 = useTransform(scrollY, [0, 800], [0, 120]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-900 text-white">
      <CursorGlow />
      <motion.div style={{ scaleX: bar }} className="fixed left-0 right-0 top-0 z-50 h-0.5 origin-left bg-emerald-400" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="fixed left-1/2 top-4 z-40 w-[min(92%,1100px)] -translate-x-1/2">
          <Glass className="!rounded-full flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2 font-semibold"><TrendingUp className="text-emerald-400" size={20} /> FreelanceFlow</div>
            <div className="hidden gap-7 text-sm text-white/60 md:flex"><a href="#features" className="hover:text-white">Features</a><a href="#how" className="hover:text-white">How it works</a><a href="#pricing" className="hover:text-white">Pricing</a></div>
            <div className="flex items-center gap-2"><Link href="/login" className="px-3 text-sm text-white/70 hover:text-white">Log in</Link><Link href="/signup" className={`${limeBtn} !px-4 !py-2`}>Start free</Link></div>
          </Glass>
        </nav>

        {/* Hero */}
        <header className="relative px-6 pb-24 pt-40">
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1200 700" preserveAspectRatio="none">
            <defs><linearGradient id="streak" x1="0" x2="1"><stop offset="0" stopColor="#34d399" stopOpacity="0" /><stop offset=".5" stopColor="#34d399" /><stop offset="1" stopColor="#818cf8" stopOpacity="0" /></linearGradient></defs>
            {[0, 1, 2, 3].map((i) => <motion.path key={i} d={`M-50 ${430 + i * 16} C 300 ${100 + i * 30}, 650 ${720 - i * 25}, 1250 ${250 + i * 22}`} fill="none" stroke="url(#streak)" strokeWidth="1.2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.8, delay: i * 0.25 }} />)}
          </svg>
          <motion.div style={{ y: y1 }} className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <motion.div style={{ y: y2 }} className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <Glass className="p-8 sm:p-10">
                <Pill>open beta / INR + USD</Pill>
                <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">Your freelance money, <It>finally under control.</It></h1>
                <p className="mt-5 max-w-md text-white/60">Invoices, expenses, taxes and cash flow forecasts in one calm place. Built for people who do the work and hate the paperwork.</p>
                <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className={limeBtn}>Start free <ArrowRight size={16} /></Link><a href="#how" className={glassBtn}>See how it works</a></div>
                <p className="mt-5 font-mono text-[11px] text-white/40">free forever / no card / set up in 5 minutes</p>
              </Glass>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2 }}>
              <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
                <Glass className="p-6">
                  <div className="flex items-center justify-between"><span className="font-mono text-[11px] text-white/50">earned this month</span><Pill>INR</Pill></div>
                  <div className="mt-2 text-4xl font-semibold"><CountUp value={124500} format={(v) => '₹' + Math.round(v).toLocaleString('en-IN')} /></div>
                  <div className="mt-5 flex h-28 items-end gap-3">
                    {bars.map((h, i) => <motion.div key={i} className={`flex-1 rounded-t-md ${i === 5 ? 'bg-emerald-400' : 'bg-white/15'}`} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.9, delay: 0.6 + i * 0.1 }} />)}
                  </div>
                  <div className="mt-4 font-mono text-[11px] text-white/40">cash flow forecast / next 3 months</div>
                  <svg viewBox="0 0 300 50" className="mt-1 h-12 w-full"><motion.path d="M0 40 C 50 38, 80 20, 130 24 S 220 8, 300 6" fill="none" stroke="#34d399" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 1 }} /></svg>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white/5 p-3"><div className="text-white/50">Outstanding</div>₹60,000</div>
                    <div className="rounded-xl bg-white/5 p-3"><div className="flex items-center gap-1.5 text-white/50"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" />Overdue</div>₹20,000</div>
                  </div>
                </Glass>
              </motion.div>
            </motion.div>
          </div>
        </header>

        {/* Glue */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="max-w-2xl"><Pill>how it works</Pill><h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Most of freelancing admin is <It>glue.</It></h2>
            <p className="mt-4 text-white/60">Copy this into that. Check it went through. Chase the payment. FreelanceFlow takes the glue and leaves you the decisions.</p></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {glue.map(([n, t, d], i) => <Reveal key={n} delay={i * 0.12}><Glass className="h-full p-6"><div className="font-mono text-sm text-emerald-400">{n}</div><h3 className="mt-6 text-xl font-semibold">{t}</h3><p className="mt-2 text-sm text-white/55">{d}</p></Glass></Reveal>)}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="max-w-2xl"><Pill>everything in one place</Pill><h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Simple tools, <It>boring in the ways that matter.</It></h2></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.1} className={f.wide ? 'md:col-span-2' : ''}>
                <Glass className="h-full p-6 transition hover:-translate-y-1"><div className="mb-5 inline-flex rounded-xl bg-emerald-400/10 p-3 text-emerald-400"><f.icon size={22} /></div>
                  <h3 className="text-lg font-semibold">{f.title}</h3><p className="mt-2 max-w-md text-sm text-white/55">{f.text}</p></Glass>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Numbers */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <Reveal><h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">Numbers we do <It>not</It> have to explain away.</h2></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[[5, ' min', 'to set up and send your first invoice'], [3, ' months', 'of cash flow visible ahead of time'], [100, '%', 'read-only for accounting partners']].map(([n, s, t], i) => (
              <Reveal key={t} delay={i * 0.12}><Glass className="p-6"><div className="font-mono text-5xl text-emerald-400"><CountUp value={n} format={(v) => Math.round(v) + s} /></div><p className="mt-3 text-sm text-white/55">{t}</p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-emerald-400" initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.3 }} /></div></Glass></Reveal>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="text-center"><Pill>pricing</Pill><h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Free to start, <It>fair to grow.</It></h2>
            <p className="mt-3 text-sm text-white/50">Freemium for individuals, subscriptions for power users, referrals for partners</p></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {plans.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}><Glass className={`flex h-full flex-col p-6 ${p.hl ? '!border-emerald-400/60' : ''}`}>
                <h3 className="font-mono text-sm text-white/60">{p.name}</h3><div className="mt-3 text-4xl font-semibold">{p.price}</div><div className="text-sm text-white/40">{p.note}</div>
                <ul className="my-6 flex-1 space-y-2.5 text-sm text-white/70">{p.items.map((it) => <li key={it} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />{it}</li>)}</ul>
                <Link href="/signup" className={p.hl ? limeBtn : glassBtn}>{p.cta}</Link></Glass></Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <Reveal><div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-indigo-600 p-8 text-white sm:p-12">
            <div className="font-mono text-[11px] uppercase">what now</div>
            <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">Pick the invoice you <It>hate</It> chasing most.</h2>
            <p className="mt-3 max-w-md text-white/75">Put it in FreelanceFlow today and let the dashboard do the remembering.</p>
            <Link href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white/90">Create your free account <ArrowRight size={16} /></Link>
          </div></Reveal>
        </section>

        <footer className="mx-auto max-w-6xl px-6 pb-10">
          <Glass className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 text-sm text-white/50">
            <div className="flex items-center gap-2 font-semibold text-white"><TrendingUp className="text-emerald-400" size={18} /> FreelanceFlow</div>
            <div>Money admin for the work that lives between your invoices.</div>
            <div className="flex gap-4"><Link href="/login" className="hover:text-white">Log in</Link><Link href="/signup" className="hover:text-white">Sign up</Link></div>
          </Glass>
        </footer>
      </div>
    </div>
  );
}
