'use client';
import Link from 'next/link';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Clock, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useWorkspace, useRows } from '@/lib/workspace';
import { fmtDate, money, toISO, todayISO } from '@/lib/format';
import { CountUp, Item, Spinner, Stagger } from '@/components/ui';

const GREEN = '#10b981', RED = '#f43f5e', INDIGO = '#6366f1';
const PIE = ['#10b981', '#6366f1', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#84cc16', '#ec4899', '#94a3b8'];

// List of months relative to now, e.g. months(-5, 0) = last 6 months including this one
const months = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() + from + i, 1);
  return { key: toISO(d).slice(0, 7), label: d.toLocaleString('en-US', { month: 'short' }) };
});

export default function Dashboard() {
  const { currency, ownerProfile } = useWorkspace();
  const { rows: invoices, loading } = useRows('invoices');
  const { rows: expenses } = useRows('expenses');
  if (loading) return <Spinner />;

  const today = todayISO(), thisMonth = today.slice(0, 7);
  const compact = (v) => new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { notation: 'compact' }).format(v);
  const sum = (l, f = (x) => x.total) => l.reduce((s, x) => s + Number(f(x)), 0);

  const paid = invoices.filter((i) => i.status === 'paid');
  const unpaid = invoices.filter((i) => i.status === 'sent');
  const overdue = unpaid.filter((i) => i.due_date < today).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const paidMonth = (i) => (i.paid_date || i.issue_date).slice(0, 7);

  const earned = sum(paid.filter((i) => paidMonth(i) === thisMonth));
  const spent = sum(expenses.filter((e) => e.expense_date.startsWith(thisMonth)), (e) => e.amount);

  // Chart 1: last 6 months, actual income vs expenses
  const history = months(-5, 0).map((m) => ({
    month: m.label,
    Income: sum(paid.filter((i) => paidMonth(i) === m.key)),
    Expenses: sum(expenses.filter((e) => e.expense_date.startsWith(m.key)), (e) => e.amount),
  }));

  // Chart 2: forecast for this month + next 2.
  // Expected income = unpaid invoices by due month (overdue ones land in the first month).
  // Projected expenses = average of the previous 3 months. Balance = running cash position.
  const prev3 = history.slice(2, 5);
  const avgExp = prev3.reduce((s, m) => s + m.Expenses, 0) / 3;
  let balance = sum(paid) - sum(expenses, (e) => e.amount);
  const forecast = months(0, 2).map((m, idx) => {
    const income = sum(unpaid.filter((i) => (idx === 0 ? i.due_date.slice(0, 7) <= m.key : i.due_date.slice(0, 7) === m.key)));
    const exp = idx === 0 ? Math.max(0, avgExp - spent) : avgExp;
    balance += income - exp;
    return { month: m.label, 'Expected income': Math.round(income), 'Projected expenses': Math.round(exp), 'Cash balance': Math.round(balance) };
  });

  // Chart 3: expenses by category this year
  const byCat = {};
  expenses.filter((e) => e.expense_date.startsWith(today.slice(0, 4))).forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount); });
  const pie = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  const stats = [
    { label: 'Earned this month', value: earned, icon: ArrowUpRight, c: 'bg-emerald-50 text-emerald-600' },
    { label: 'Spent this month', value: spent, icon: ArrowDownRight, c: 'bg-rose-50 text-rose-600' },
    { label: 'Outstanding', value: sum(unpaid), icon: Clock, c: 'bg-amber-50 text-amber-600' },
    { label: 'Overdue', value: sum(overdue), icon: AlertTriangle, c: 'bg-rose-50 text-rose-600' },
  ];
  const tip = { formatter: (v) => money(v, currency), contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0' } };

  return (
    <div>
      <h1 className="text-3xl font-bold">Hello, {ownerProfile?.full_name || 'there'} 👋</h1>
      <p className="mb-6 mt-1 text-slate-500">Here’s where your money stands today.</p>

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Item key={s.label}><div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`mb-3 inline-flex rounded-xl p-2.5 ${s.c}`}><s.icon size={20} /></div>
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="text-2xl font-bold"><CountUp value={s.value} format={(v) => money(v, currency)} /></div>
          </div></Item>
        ))}
      </Stagger>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Item><div className="card p-5">
          <h3 className="font-semibold">Income vs expenses</h3><p className="mb-4 text-sm text-slate-500">Last 6 months (paid invoices)</p>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={history}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis tickFormatter={compact} axisLine={false} tickLine={false} width={50} />
              <Tooltip {...tip} /><Legend /><Bar dataKey="Income" fill={GREEN} radius={[6, 6, 0, 0]} /><Bar dataKey="Expenses" fill={RED} radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer></div>
        </div></Item>

        <Item><div className="card p-5">
          <h3 className="flex items-center gap-2 font-semibold"><TrendingUp size={18} className="text-indigo-500" /> Cash flow forecast</h3>
          <p className="mb-4 text-sm text-slate-500">Next 3 months from unpaid invoices and average spending</p>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis tickFormatter={compact} axisLine={false} tickLine={false} width={50} />
              <Tooltip {...tip} /><Legend /><Bar dataKey="Expected income" fill={GREEN} radius={[6, 6, 0, 0]} /><Bar dataKey="Projected expenses" fill={RED} radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="Cash balance" stroke={INDIGO} strokeWidth={3} dot={{ r: 5 }} /></ComposedChart>
          </ResponsiveContainer></div>
        </div></Item>

        <Item><div className="card p-5">
          <h3 className="font-semibold">Expenses by category</h3><p className="mb-2 text-sm text-slate-500">This year</p>
          {pie.length === 0 ? <p className="py-16 text-center text-sm text-slate-400">No expenses yet</p> : (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>{pie.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip {...tip} /><Legend /></PieChart>
            </ResponsiveContainer></div>
          )}
        </div></Item>

        <Item><div className="card p-5">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Overdue payments</h3><Link href="/invoices" className="text-sm font-medium text-emerald-600">View invoices</Link></div>
          {overdue.length === 0 ? <p className="py-12 text-center text-sm text-slate-400">Nothing overdue. Nice work! 🎉</p> : (
            <ul className="divide-y divide-slate-100">
              {overdue.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center justify-between py-3 text-sm">
                  <div><div className="font-medium">{i.invoice_number}</div><div className="text-xs text-rose-600">Due {fmtDate(i.due_date)}</div></div>
                  <div className="font-semibold">{money(i.total, currency)}</div>
                </li>
              ))}
            </ul>
          )}
        </div></Item>
      </div>
    </div>
  );
}
