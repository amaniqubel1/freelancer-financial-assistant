'use client';
import { useEffect, useState } from 'react';
import { Check, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { PageHeader } from '@/components/ui';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { isPartner, freelancers } = useWorkspace();
  const [form, setForm] = useState({ full_name: profile.full_name || '', currency: profile.currency, tax_rate: profile.tax_rate });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [partners, setPartners] = useState([]);

  async function loadPartners() {
    const { data: links } = await supabase.from('partner_access').select('partner_id').eq('freelancer_id', user.id);
    const ids = (links || []).map((l) => l.partner_id);
    setPartners(ids.length ? (await supabase.from('profiles').select('*').in('id', ids)).data || [] : []);
  }
  useEffect(() => { if (!isPartner) loadPartners(); }, [isPartner]);

  async function save(e) {
    e.preventDefault(); setBusy(true); setSaved(false);
    const update = isPartner ? { full_name: form.full_name } : { full_name: form.full_name, currency: form.currency, tax_rate: Number(form.tax_rate) };
    await supabase.from('profiles').update(update).eq('id', user.id);
    await refreshProfile(); setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }
  async function invite(e) {
    e.preventDefault(); setMsg({ type: '', text: '' });
    const { error } = await supabase.rpc('invite_partner', { p_email: email.trim() });
    if (error) return setMsg({ type: 'err', text: error.message });
    setMsg({ type: 'ok', text: 'Access granted. They can now view your books (read-only).' }); setEmail(''); loadPartners();
  }
  async function revoke(p) { await supabase.from('partner_access').delete().eq('freelancer_id', user.id).eq('partner_id', p.id); loadPartners(); }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Your profile, currency and sharing." />

      <form onSubmit={save} className="card space-y-5 p-6">
        <div><label className="label">Full name</label><input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><label className="label">Email</label><input className="input bg-slate-50" disabled value={profile.email} /></div>
        {!isPartner && (
          <>
            <div><label className="label">Currency</label>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                {[['INR', '₹ Indian Rupee'], ['USD', '$ US Dollar']].map(([c, l]) => (
                  <button type="button" key={c} onClick={() => setForm({ ...form, currency: c })} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${form.currency === c ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{l}</button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">Changes how amounts are displayed. Existing numbers are not converted.</p></div>
            <div><label className="label">Estimated tax rate (%)</label><input className="input max-w-[160px]" type="number" min="0" max="60" step="0.5" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
              <p className="mt-1 text-xs text-slate-500">Used on the Tax summary page.</p></div>
          </>
        )}
        <button className="btn-primary" disabled={busy}>{saved ? <><Check size={16} /> Saved</> : busy ? 'Saving…' : 'Save changes'}</button>
      </form>

      {!isPartner ? (
        <div className="card mt-6 p-6">
          <h3 className="font-semibold">Accounting partners</h3>
          <p className="mb-4 text-sm text-slate-500">Invite your accountant (they need an Accounting partner account) to view your books, read-only.</p>
          <form onSubmit={invite} className="flex gap-2"><input className="input" type="email" required placeholder="accountant@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn-primary shrink-0"><UserPlus size={16} /> Invite</button></form>
          {msg.text && <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</p>}
          <ul className="mt-4 divide-y divide-slate-100">
            {partners.map((p) => <li key={p.id} className="flex items-center justify-between py-3 text-sm"><div><div className="font-medium">{p.full_name}</div><div className="text-slate-500">{p.email}</div></div>
              <button className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => revoke(p)}><Trash2 size={16} /></button></li>)}
            {partners.length === 0 && <li className="py-3 text-sm text-slate-400">No one has access yet.</li>}
          </ul>
        </div>
      ) : (
        <div className="card mt-6 p-6">
          <h3 className="font-semibold">Freelancers who shared access</h3>
          <p className="mb-3 text-sm text-slate-500">Give them this email so they can invite you: <b>{profile.email}</b></p>
          <ul className="divide-y divide-slate-100">{freelancers.map((f) => <li key={f.id} className="py-3 text-sm"><b>{f.full_name}</b> <span className="text-slate-500">{f.email}</span></li>)}
            {freelancers.length === 0 && <li className="text-sm text-slate-400">None yet.</li>}</ul>
        </div>
      )}
    </div>
  );
}
