'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Download, Info } from 'lucide-react';
import { useWorkspace, useRows } from '@/lib/workspace';
import { fmtDate, money, toISO } from '@/lib/format';
import { CountUp, Item, Spinner, Stagger } from '@/components/ui';

const csv = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
const saveFile = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click(); };
const lastDay = (iso) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() - 1); return toISO(d); };

export default function Taxes() {
  const { currency, ownerProfile, readOnly } = useWorkspace();
  const { rows: invoices, loading } = useRows('invoices');
  const { rows: expenses } = useRows('expenses');
  const { rows: clients } = useRows('clients');
  const [idx, setIdx] = useState(0);
  if (loading) return <Spinner />;

  const rate = Number(ownerProfile?.tax_rate ?? 20);
  const isIN = currency === 'INR';
  const now = new Date();
  // India: financial year Apr-Mar. USD: calendar year.
  const base = isIN ? (now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1) : now.getFullYear();
  const periods = [0, 1, 2, 3].map((n) => {
    const s = base - n;
    return isIN ? { label: `FY ${s}-${String((s + 1) % 100).padStart(2, '0')}`, start: new Date(s, 3, 1) } : { label: String(s), start: new Date(s, 0, 1) };
  });
  const period = periods[Math.min(idx, 3)];
  const quarters = [0, 1, 2, 3].map((q) => {
    const a = new Date(period.start.getFullYear(), period.start.getMonth() + q * 3, 1);
    const b = new Date(a.getFullYear(), a.getMonth() + 3, 1);
    return { a: toISO(a), b: toISO(b), label: `Q${q + 1}` };
  });
  const start = quarters[0].a, end = quarters[3].b;
  const due = isIN ? ['15 Jun', '15 Sep', '15 Dec', '15 Mar'] : ['15 Apr', '15 Jun', '15 Sep', '15 Jan'];

  const paidDate = (i) => i.paid_date || i.issue_date;
  const paid = invoices.filter((i) => i.status === 'paid' && paidDate(i) >= start && paidDate(i) < end);
  const deductible = expenses.filter((e) => e.tax_deductible && e.expense_date >= start && e.expense_date < end);
  const sum = (l, f) => l.reduce((s, x) => s + Number(f(x)), 0);

  const income = sum(paid, (i) => i.subtotal);
  const collected = sum(paid, (i) => i.total - i.subtotal); // GST / tax charged to clients
  const deduct = sum(deductible, (e) => e.amount);
  const taxable = Math.max(0, income - deduct);
  const estTax = (taxable * rate) / 100;

  const qRows = quarters.map((q, n) => {
    const inc = sum(paid.filter((i) => paidDate(i) >= q.a && paidDate(i) < q.b), (i) => i.subtotal);
    const exp = sum(deductible.filter((e) => e.expense_date >= q.a && e.expense_date < q.b), (e) => e.amount);
    return { ...q, inc, exp, profit: inc - exp, tax: (Math.max(0, inc - exp) * rate) / 100, due: due[n] };
  });

  function exportCsv() {
    const cname = (id) => clients.find((c) => c.id === id)?.name || '';
    const rows = [
      ['Tax summary', period.label], ['Currency', currency], ['Income (excl. tax)', income], ['Tax collected from clients', collected],
      ['Deductible expenses', deduct], ['Taxable profit', taxable], [`Estimated tax @ ${rate}%`, estTax], [],
      ['Type', 'Date', 'Reference', 'Category / Client', 'Amount', 'Tax'],
      ...paid.map((i) => ['Income', paidDate(i), i.invoice_number, cname(i.client_id), i.subtotal, i.total - i.subtotal]),
      ...deductible.map((e) => ['Expense', e.expense_date, e.description, e.category, e.amount, '']),
    ];
    saveFile(`tax-summary-${period.label.replace(/\s/g, '')}.csv`, csv(rows));
  }

  const cards = [
    { label: 'Income received', value: income }, { label: 'Deductible expenses', value: deduct },
    { label: 'Taxable profit', value: taxable }, { label: `Estimated tax (${rate}%)`, value: estTax, hl: true },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Tax summary</h1><p className="mt-1 text-slate-500">Know what to set aside before filing time.</p></div>
        <div className="flex gap-2">
          <select className="input w-auto" value={idx} onChange={(e) => setIdx(Number(e.target.value))}>{periods.map((p, n) => <option key={p.label} value={n}>{p.label}</option>)}</select>
          <button className="btn-primary" onClick={exportCsv}><Download size={16} /> Export CSV</button>
        </div>
      </div>

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Item key={c.label}><div className={`card p-5 ${c.hl ? 'bg-emerald-600 text-white' : ''}`}>
            <div className={`text-sm ${c.hl ? 'text-emerald-100' : 'text-slate-500'}`}>{c.label}</div>
            <div className="mt-1 text-2xl font-bold"><CountUp value={c.value} format={(v) => money(v, currency)} /></div>
          </div></Item>
        ))}
      </Stagger>

      <div className="card mt-6 grid gap-4 p-5 sm:grid-cols-2">
        <div><div className="text-sm text-slate-500">Suggested monthly set-aside</div><div className="text-xl font-bold">{money(estTax / 12, currency)}</div></div>
        <div><div className="text-sm text-slate-500">{isIN ? 'GST / tax collected from clients' : 'Sales tax collected from clients'}</div><div className="text-xl font-bold">{money(collected, currency)}</div></div>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <div className="border-b border-slate-100 p-5"><h3 className="font-semibold">Quarterly breakdown</h3><p className="text-sm text-slate-500">{isIN ? 'Advance tax' : 'Estimated tax'} payment dates are indicative.</p></div>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="p-4">Quarter</th><th>Period</th><th className="text-right">Income</th><th className="text-right">Deductible</th><th className="text-right">Profit</th><th className="text-right">Est. tax</th><th className="px-4 text-right">Pay by</th></tr></thead>
          <tbody>{qRows.map((q) => (
            <tr key={q.label} className="border-t border-slate-50">
              <td className="p-4 font-medium">{q.label}</td><td className="text-slate-500">{fmtDate(q.a)} – {fmtDate(lastDay(q.b))}</td>
              <td className="text-right">{money(q.inc, currency)}</td><td className="text-right">{money(q.exp, currency)}</td>
              <td className="text-right">{money(q.profit, currency)}</td><td className="text-right font-semibold">{money(q.tax, currency)}</td><td className="px-4 text-right text-slate-500">{q.due}</td>
            </tr>))}</tbody>
        </table>
      </div>

      <p className="mt-4 flex items-start gap-2 text-sm text-slate-500"><Info size={16} className="mt-0.5 shrink-0" />
        This is a simple estimate: (income − deductible expenses) × your tax rate. It is not tax advice. {!readOnly && <>Change your rate in <Link href="/settings" className="font-medium text-emerald-600">Settings</Link>.</>}</p>
    </div>
  );
}
