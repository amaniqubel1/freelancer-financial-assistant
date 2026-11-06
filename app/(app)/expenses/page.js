'use client';
import { useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspace, useRows } from '@/lib/workspace';
import { fmtDate, money, todayISO } from '@/lib/format';
import { Badge, EmptyState, Item, Modal, PageHeader, Spinner, Stagger } from '@/components/ui';

export const CATEGORIES = ['Software', 'Equipment', 'Travel', 'Marketing', 'Office', 'Internet & Phone', 'Professional Fees', 'Taxes', 'Other'];
const blank = () => ({ description: '', category: 'Software', amount: '', expense_date: todayISO(), tax_deductible: true });

export default function Expenses() {
  const { readOnly, currency } = useWorkspace();
  const { rows, loading, reload } = useRows('expenses', 'expense_date');
  const [cat, setCat] = useState('all');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const month = todayISO().slice(0, 7);
  const sum = (l) => l.reduce((s, e) => s + Number(e.amount), 0);
  const shown = rows.filter((e) => cat === 'all' || e.category === cat);
  const stats = [
    { label: 'This month', value: sum(rows.filter((e) => e.expense_date.startsWith(month))) },
    { label: 'Tax-deductible (all time)', value: sum(rows.filter((e) => e.tax_deductible)) },
    { label: 'Total expenses', value: sum(rows) },
  ];

  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.from('expenses').insert({ ...form, amount: Number(form.amount) });
    setBusy(false);
    if (error) return setErr(error.message);
    setForm(null); reload();
  }
  async function remove(x) { if (confirm(`Delete "${x.description}"?`)) { await supabase.from('expenses').delete().eq('id', x.id); reload(); } }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Track business spending and what you can deduct.">
        {!readOnly && <button className="btn-primary" onClick={() => { setErr(''); setForm(blank()); }}><Plus size={16} /> Add expense</button>}
      </PageHeader>

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => <Item key={s.label}><div className="card p-5"><div className="text-sm text-slate-500">{s.label}</div><div className="mt-1 text-2xl font-bold">{money(s.value, currency)}</div></div></Item>)}
      </Stagger>

      <div className="mb-5 flex flex-wrap gap-2">
        {['all', ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-sm transition ${cat === c ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{c === 'all' ? 'All' : c}</button>
        ))}
      </div>

      {loading ? <Spinner /> : shown.length === 0 ? (
        <EmptyState icon={Wallet} title="No expenses yet" text={readOnly ? 'Nothing to show yet.' : 'Add expenses so your tax summary and forecast stay accurate.'} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-500"><tr><th className="p-4">Date</th><th>Description</th><th>Category</th><th>Deductible</th><th className="text-right">Amount</th><th /></tr></thead>
            <tbody>
              {shown.map((x) => (
                <tr key={x.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-4 text-slate-500">{fmtDate(x.expense_date)}</td>
                  <td className="font-medium">{x.description}</td>
                  <td><Badge tone="blue">{x.category}</Badge></td>
                  <td>{x.tax_deductible ? <Badge tone="green">Yes</Badge> : <Badge>No</Badge>}</td>
                  <td className="text-right font-semibold">{money(x.amount, currency)}</td>
                  <td className="pr-4 text-right">{!readOnly && <button className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => remove(x)}><Trash2 size={15} /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title="Add expense">
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div><label className="label">Description *</label><input className="input" required value={form.description} onChange={set('description')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Category</label><select className="input" value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className="label">Amount ({currency}) *</label><input className="input" type="number" min="0" step="0.01" required value={form.amount} onChange={set('amount')} /></div>
            </div>
            <div><label className="label">Date</label><input className="input" type="date" required value={form.expense_date} onChange={set('expense_date')} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.tax_deductible} onChange={(e) => setForm({ ...form, tax_deductible: e.target.checked })} /> Tax-deductible</label>
            {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save expense'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
