'use client';
import { useState } from 'react';
import { Building2, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspace, useRows } from '@/lib/workspace';
import { money } from '@/lib/format';
import { EmptyState, Item, Modal, PageHeader, Spinner, Stagger } from '@/components/ui';

const blank = { name: '', company: '', email: '', phone: '', notes: '' };

export default function Clients() {
  const { readOnly, currency } = useWorkspace();
  const { rows: clients, loading, reload } = useRows('clients', 'name', true);
  const { rows: invoices } = useRows('invoices');
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null); // null = closed
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const shown = clients.filter((c) => `${c.name} ${c.company || ''} ${c.email || ''}`.toLowerCase().includes(q.toLowerCase()));
  const totals = (id) => {
    const mine = invoices.filter((i) => i.client_id === id);
    return { billed: mine.reduce((s, i) => s + Number(i.total), 0), due: mine.filter((i) => i.status !== 'paid').reduce((s, i) => s + Number(i.total), 0) };
  };

  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const { id, created_at, user_id, ...fields } = form;
    const { error } = id ? await supabase.from('clients').update(fields).eq('id', id) : await supabase.from('clients').insert(fields);
    setBusy(false);
    if (error) return setErr(error.message);
    setForm(null); reload();
  }
  async function remove(c) {
    if (!confirm(`Delete ${c.name}? Their invoices and contracts stay, but lose the client link.`)) return;
    await supabase.from('clients').delete().eq('id', c.id); reload();
  }

  return (
    <div>
      <PageHeader title="Clients" subtitle="Everyone you work with, and what they owe you.">
        {!readOnly && <button className="btn-primary" onClick={() => setForm(blank)}><Plus size={16} /> Add client</button>}
      </PageHeader>

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input className="input pl-9" placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? <Spinner /> : shown.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" text={readOnly ? 'This freelancer has not added any clients.' : 'Add your first client to start tracking contracts and invoices.'} />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => {
            const t = totals(c.id);
            return (
              <Item key={c.id}>
                <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">{c.name[0]?.toUpperCase()}</div>
                      <div><div className="font-semibold">{c.name}</div>{c.company && <div className="flex items-center gap-1 text-sm text-slate-500"><Building2 size={13} />{c.company}</div>}</div>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-1">
                        <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100" onClick={() => setForm(c)}><Pencil size={15} /></button>
                        <button className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => remove(c)}><Trash2 size={15} /></button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    {c.email && <div className="flex items-center gap-2"><Mail size={14} />{c.email}</div>}
                    {c.phone && <div className="flex items-center gap-2"><Phone size={14} />{c.phone}</div>}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                    <div><div className="text-xs text-slate-500">Total billed</div><div className="font-semibold">{money(t.billed, currency)}</div></div>
                    <div><div className="text-xs text-slate-500">Outstanding</div><div className={`font-semibold ${t.due > 0 ? 'text-amber-600' : ''}`}>{money(t.due, currency)}</div></div>
                  </div>
                </div>
              </Item>
            );
          })}
        </Stagger>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit client' : 'Add client'}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={set('name')} /></div>
            <div><label className="label">Company</label><input className="input" value={form.company || ''} onChange={set('company')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Email</label><input className="input" type="email" value={form.email || ''} onChange={set('email')} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={set('phone')} /></div>
            </div>
            <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes || ''} onChange={set('notes')} /></div>
            {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save client'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
