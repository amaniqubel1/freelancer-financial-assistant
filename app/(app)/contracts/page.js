'use client';
import { useState } from 'react';
import { FileSignature, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspace, useRows } from '@/lib/workspace';
import { fmtDate, money } from '@/lib/format';
import { Badge, EmptyState, Item, Modal, PageHeader, Spinner, Stagger } from '@/components/ui';

const statusTone = { draft: 'gray', active: 'green', completed: 'blue', cancelled: 'red' };
const blank = { title: '', client_id: '', value: '', status: 'active', start_date: '', end_date: '', notes: '' };

export default function Contracts() {
  const { readOnly, currency } = useWorkspace();
  const { rows: contracts, loading, reload } = useRows('contracts');
  const { rows: clients } = useRows('clients', 'name', true);
  const { rows: invoices } = useRows('invoices');
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const clientName = (id) => clients.find((c) => c.id === id)?.name || 'No client';
  const billed = (id) => invoices.filter((i) => i.contract_id === id).reduce((s, i) => s + Number(i.total), 0);
  const shown = contracts.filter((c) => filter === 'all' || c.status === filter);
  const activeValue = contracts.filter((c) => c.status === 'active').reduce((s, c) => s + Number(c.value), 0);

  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const { id, created_at, user_id, ...f } = form;
    const payload = { ...f, value: Number(f.value || 0), client_id: f.client_id || null, start_date: f.start_date || null, end_date: f.end_date || null };
    const { error } = id ? await supabase.from('contracts').update(payload).eq('id', id) : await supabase.from('contracts').insert(payload);
    setBusy(false);
    if (error) return setErr(error.message);
    setForm(null); reload();
  }
  async function remove(c) {
    if (!confirm(`Delete contract "${c.title}"?`)) return;
    await supabase.from('contracts').delete().eq('id', c.id); reload();
  }

  return (
    <div>
      <PageHeader title="Contracts" subtitle={`Active contracts worth ${money(activeValue, currency)}`}>
        {!readOnly && <button className="btn-primary" onClick={() => setForm(blank)}><Plus size={16} /> New contract</button>}
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        {['all', 'draft', 'active', 'completed', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${filter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{s}</button>
        ))}
      </div>

      {loading ? <Spinner /> : shown.length === 0 ? (
        <EmptyState icon={FileSignature} title="No contracts here" text={readOnly ? 'Nothing to show yet.' : 'Add a contract to track its value, dates and how much you have invoiced.'} />
      ) : (
        <Stagger className="space-y-3">
          {shown.map((c) => {
            const b = billed(c.id); const pct = c.value > 0 ? Math.min(100, (b / c.value) * 100) : 0;
            return (
              <Item key={c.id}>
                <div className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2"><h3 className="font-semibold">{c.title}</h3><Badge tone={statusTone[c.status]}>{c.status}</Badge></div>
                      <p className="text-sm text-slate-500">{clientName(c.client_id)} · {fmtDate(c.start_date)} → {fmtDate(c.end_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right"><div className="text-xs text-slate-500">Contract value</div><div className="text-lg font-semibold">{money(c.value, currency)}</div></div>
                      {!readOnly && (
                        <div className="flex gap-1">
                          <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100" onClick={() => setForm({ ...c, client_id: c.client_id || '' })}><Pencil size={15} /></button>
                          <button className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => remove(c)}><Trash2 size={15} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Invoiced {money(b, currency)}</span><span>{Math.round(pct)}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </Item>
            );
          })}
        </Stagger>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit contract' : 'New contract'}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div><label className="label">Title *</label><input className="input" required value={form.title} onChange={set('title')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Client</label>
                <select className="input" value={form.client_id} onChange={set('client_id')}>
                  <option value="">No client</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="label">Value ({currency}) *</label><input className="input" type="number" min="0" step="0.01" required value={form.value} onChange={set('value')} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={set('status')}>{['draft', 'active', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="label">Start</label><input className="input" type="date" value={form.start_date || ''} onChange={set('start_date')} /></div>
              <div><label className="label">End</label><input className="input" type="date" value={form.end_date || ''} onChange={set('end_date')} /></div>
            </div>
            <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes || ''} onChange={set('notes')} /></div>
            {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save contract'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
