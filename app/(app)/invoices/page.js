'use client';
import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clipboard, Clock, Download, Eye, Plus, Receipt, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspace, useRows } from '@/lib/workspace';
import { fmtDate, money, toISO, todayISO } from '@/lib/format';
import { downloadInvoicePdf } from '@/lib/pdf';
import { Badge, EmptyState, Item, Modal, PageHeader, Spinner, Stagger } from '@/components/ui';

// A sent invoice becomes "overdue" automatically once its due date has passed
const statusOf = (i) => (i.status === 'paid' ? 'paid' : i.status === 'draft' ? 'draft' : i.due_date < todayISO() ? 'overdue' : 'pending');
const tone = { paid: 'green', overdue: 'red', pending: 'amber', draft: 'gray' };
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return toISO(d); };
const blank = () => ({ client_id: '', contract_id: '', issue_date: todayISO(), due_date: addDays(14), status: 'sent', tax_percent: 0, notes: '', items: [{ description: '', qty: 1, rate: '' }] });

export default function Invoices() {
  const { readOnly, currency, ownerProfile } = useWorkspace();
  const { rows: invoices, loading, reload } = useRows('invoices');
  const { rows: clients } = useRows('clients', 'name', true);
  const { rows: contracts } = useRows('contracts');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(null);
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const client = (id) => clients.find((c) => c.id === id);
  const withStatus = invoices.map((i) => ({ ...i, eff: statusOf(i) }));
  const shown = withStatus.filter((i) => filter === 'all' || i.eff === filter);
  const sum = (list) => list.reduce((s, i) => s + Number(i.total), 0);
  const stats = [
    { label: 'Outstanding', value: sum(withStatus.filter((i) => i.eff === 'pending' || i.eff === 'overdue')), icon: Clock, c: 'text-amber-600 bg-amber-50' },
    { label: 'Overdue', value: sum(withStatus.filter((i) => i.eff === 'overdue')), icon: AlertTriangle, c: 'text-rose-600 bg-rose-50' },
    { label: 'Paid', value: sum(withStatus.filter((i) => i.eff === 'paid')), icon: CheckCircle2, c: 'text-emerald-600 bg-emerald-50' },
  ];

  // Live totals while filling the form
  const subtotal = form ? form.items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.rate || 0), 0) : 0;
  const total = subtotal * (1 + Number(form?.tax_percent || 0) / 100);
  const setItem = (idx, k, v) => setForm({ ...form, items: form.items.map((it, n) => (n === idx ? { ...it, [k]: v } : it)) });
  const nextNumber = () => 'INV-' + String(Math.max(0, ...invoices.map((i) => parseInt(i.invoice_number.replace(/\D/g, '')) || 0)) + 1).padStart(4, '0');

  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const items = form.items.filter((i) => i.description).map((i) => ({ description: i.description, qty: Number(i.qty), rate: Number(i.rate) }));
    if (!items.length) { setBusy(false); return setErr('Add at least one line item.'); }
    const { error } = await supabase.from('invoices').insert({
      invoice_number: nextNumber(), client_id: form.client_id || null, contract_id: form.contract_id || null,
      issue_date: form.issue_date, due_date: form.due_date, status: form.status, items, subtotal, total,
      tax_percent: Number(form.tax_percent || 0), notes: form.notes || null, paid_date: form.status === 'paid' ? todayISO() : null,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    setForm(null); reload();
  }
  async function markPaid(i) { await supabase.from('invoices').update({ status: 'paid', paid_date: todayISO() }).eq('id', i.id); setView(null); reload(); }
  async function remove(i) { if (confirm(`Delete ${i.invoice_number}?`)) { await supabase.from('invoices').delete().eq('id', i.id); setView(null); reload(); } }
  const reminder = (i) => `Hi ${client(i.client_id)?.name || ''}, a friendly reminder that invoice ${i.invoice_number} for ${money(i.total, currency)} was due on ${fmtDate(i.due_date)}. Could you please confirm the payment date? Thank you!`;

  const v = view && { ...view, eff: statusOf(view), cl: client(view.client_id) };

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Create, track and download invoices.">
        {!readOnly && <button className="btn-primary" onClick={() => { setErr(''); setForm(blank()); }}><Plus size={16} /> New invoice</button>}
      </PageHeader>

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Item key={s.label}><div className="card flex items-center gap-4 p-5">
            <div className={`rounded-xl p-3 ${s.c}`}><s.icon size={22} /></div>
            <div><div className="text-sm text-slate-500">{s.label}</div><div className="text-xl font-bold">{money(s.value, currency)}</div></div>
          </div></Item>
        ))}
      </Stagger>

      <div className="mb-5 flex flex-wrap gap-2">
        {['all', 'draft', 'pending', 'overdue', 'paid'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${filter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{s}</button>
        ))}
      </div>

      {loading ? <Spinner /> : shown.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices here" text={readOnly ? 'Nothing to show yet.' : 'Create your first invoice and track when it gets paid.'} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
              <tr><th className="p-4">Invoice</th><th>Client</th><th>Due</th><th className="text-right">Amount</th><th className="px-4">Status</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((i) => (
                <tr key={i.id} className="border-b border-slate-50 transition hover:bg-slate-50">
                  <td className="p-4 font-medium">{i.invoice_number}</td>
                  <td>{client(i.client_id)?.name || '-'}</td>
                  <td>{fmtDate(i.due_date)}</td>
                  <td className="text-right font-semibold">{money(i.total, currency)}</td>
                  <td className="px-4"><Badge tone={tone[i.eff]}>{i.eff}</Badge></td>
                  <td className="pr-4 text-right"><button className="btn-ghost px-3 py-1.5" onClick={() => setView(i)}><Eye size={14} /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* On-screen invoice + actions */}
      <Modal open={!!view} onClose={() => setView(null)} title={v?.invoice_number || ''} wide>
        {v && (
          <div>
            <div className="rounded-xl border border-slate-200 p-6">
              <div className="flex justify-between">
                <div><div className="text-2xl font-bold text-emerald-600">INVOICE</div><div className="text-sm text-slate-500">{v.invoice_number}</div></div>
                <Badge tone={tone[v.eff]}>{v.eff}</Badge>
              </div>
              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div><div className="text-xs uppercase text-slate-400">From</div><b>{ownerProfile?.full_name}</b><div className="text-slate-500">{ownerProfile?.email}</div></div>
                <div><div className="text-xs uppercase text-slate-400">Bill to</div><b>{v.cl?.name || '-'}</b><div className="text-slate-500">{v.cl?.company}</div></div>
                <div><div className="text-xs uppercase text-slate-400">Issued</div>{fmtDate(v.issue_date)}</div>
                <div><div className="text-xs uppercase text-slate-400">Due</div>{fmtDate(v.due_date)}</div>
              </div>
              <table className="mt-5 w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-slate-400"><tr><th className="py-2">Description</th><th className="text-right">Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr></thead>
                <tbody>{v.items.map((it, n) => (
                  <tr key={n} className="border-b border-slate-50"><td className="py-2">{it.description}</td><td className="text-right">{it.qty}</td><td className="text-right">{money(it.rate, currency)}</td><td className="text-right">{money(it.qty * it.rate, currency)}</td></tr>
                ))}</tbody>
              </table>
              <div className="mt-4 ml-auto w-60 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{money(v.subtotal, currency)}</span></div>
                {Number(v.tax_percent) > 0 && <div className="flex justify-between"><span>Tax ({v.tax_percent}%)</span><span>{money(v.total - v.subtotal, currency)}</span></div>}
                <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Total</span><span>{money(v.total, currency)}</span></div>
              </div>
              {v.notes && <p className="mt-4 text-sm text-slate-500">Notes: {v.notes}</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => downloadInvoicePdf({ invoice: v, client: v.cl, owner: ownerProfile, currency })}><Download size={16} /> Download PDF</button>
              {v.eff === 'overdue' && <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(reminder(v)); alert('Reminder message copied!'); }}><Clipboard size={16} /> Copy reminder</button>}
              {!readOnly && v.status !== 'paid' && <button className="btn-ghost" onClick={() => markPaid(v)}><CheckCircle2 size={16} /> Mark as paid</button>}
              {!readOnly && <button className="btn-ghost text-rose-600" onClick={() => remove(v)}><Trash2 size={16} /> Delete</button>}
            </div>
          </div>
        )}
      </Modal>

      {/* Create invoice */}
      <Modal open={!!form} onClose={() => setForm(null)} title="New invoice" wide>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Client *</label>
                <select className="input" required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, contract_id: '' })}>
                  <option value="">Select client</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="label">Contract (optional)</label>
                <select className="input" value={form.contract_id} onChange={(e) => setForm({ ...form, contract_id: e.target.value })}>
                  <option value="">None</option>{contracts.filter((c) => c.client_id === form.client_id).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
              <div><label className="label">Issue date</label><input className="input" type="date" required value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
              <div><label className="label">Due date</label><input className="input" type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>

            <div>
              <label className="label">Line items</label>
              <div className="space-y-2">
                {form.items.map((it, n) => (
                  <div key={n} className="grid grid-cols-12 gap-2">
                    <input className="input col-span-6" placeholder="Description" value={it.description} onChange={(e) => setItem(n, 'description', e.target.value)} />
                    <input className="input col-span-2" type="number" min="0" step="any" placeholder="Qty" value={it.qty} onChange={(e) => setItem(n, 'qty', e.target.value)} />
                    <input className="input col-span-3" type="number" min="0" step="any" placeholder="Rate" value={it.rate} onChange={(e) => setItem(n, 'rate', e.target.value)} />
                    <button type="button" className="col-span-1 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30" disabled={form.items.length === 1}
                      onClick={() => setForm({ ...form, items: form.items.filter((_, x) => x !== n) })}><X size={16} className="mx-auto" /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-2 text-sm font-medium text-emerald-600" onClick={() => setForm({ ...form, items: [...form.items, { description: '', qty: 1, rate: '' }] })}>+ Add line</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className="label">Tax / GST %</label><input className="input" type="number" min="0" step="any" value={form.tax_percent} onChange={(e) => setForm({ ...form, tax_percent: e.target.value })} /></div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="sent">Sent</option><option value="draft">Draft</option><option value="paid">Already paid</option></select></div>
              <div className="rounded-xl bg-slate-50 p-3 text-right text-sm"><div className="text-slate-500">Total</div><div className="text-xl font-bold">{money(total, currency)}</div></div>
            </div>
            <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Create invoice'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
