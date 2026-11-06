'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, Calculator, Eye, FileSignature, FolderOpen, LayoutDashboard, LogOut, Receipt, Settings, TrendingUp, Users, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { WorkspaceProvider, useWorkspace } from '@/lib/workspace';

// Add new pages here as they are built
const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/contracts', label: 'Contracts', icon: FileSignature },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/taxes', label: 'Tax summary', icon: Calculator },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function Shell({ children }) {
  const { profile, signOut } = useAuth();
  const ws = useWorkspace();
  const path = usePathname();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="flex shrink-0 flex-col bg-slate-900 p-4 text-slate-300 lg:sticky lg:top-0 lg:h-screen lg:w-64">
        <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold text-white"><TrendingUp className="text-emerald-400" /> FreelanceFlow</div>

        {ws.isPartner && (
          <div className="mb-4 px-1">
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Viewing freelancer</label>
            <select className="w-full rounded-lg bg-white/10 px-2 py-2 text-sm text-white outline-none" value={ws.selectedId || ''} onChange={(e) => ws.selectFreelancer(e.target.value)}>
              {ws.freelancers.length === 0 && <option value="">None yet</option>}
              {ws.freelancers.map((f) => <option key={f.id} value={f.id} className="text-slate-900">{f.full_name || f.email}</option>)}
            </select>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {nav.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'text-white' : 'hover:bg-white/5'}`}>
                {active && <motion.span layoutId="activeNav" className="absolute inset-0 rounded-xl bg-white/10" />}
                <n.icon size={18} className="relative" /><span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-white/10 pt-4 text-sm">
          <div className="truncate font-medium text-white">{profile.full_name || profile.email}</div>
          <div className="text-xs capitalize text-slate-400">{profile.role === 'partner' ? 'Accounting partner' : 'Freelancer'}</div>
          <button onClick={signOut} className="mt-3 flex items-center gap-2 text-slate-400 hover:text-white"><LogOut size={16} /> Log out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 lg:p-10">
        {ws.readOnly && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700"><Eye size={16} /> Read-only view of {ws.ownerProfile?.full_name || 'freelancer'}’s books</div>
        )}
        {ws.isPartner && !ws.loadingList && !ws.ownerId ? (
          <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
            <Briefcase className="mx-auto mb-3 text-emerald-600" />
            <h2 className="text-lg font-semibold">No freelancers have shared access yet</h2>
            <p className="mt-1 text-sm text-slate-500">Ask a freelancer to invite you from their Settings page using <b>{profile.email}</b>.</p>
          </div>
        ) : children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }) {
  const { session, profile, loading, signOut } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !session) router.replace('/login'); }, [loading, session, router]);

  if (loading || !session) return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;
  if (!profile) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p>We couldn’t load your profile.</p><button className="btn-ghost" onClick={signOut}>Log out</button>
    </div>
  );
  return <WorkspaceProvider><Shell>{children}</Shell></WorkspaceProvider>;
}
