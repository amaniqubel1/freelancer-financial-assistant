'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useInView } from 'framer-motion';
import { X } from 'lucide-react';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-bold">{title}</h1>{subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}</div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className={`card max-h-[90vh] w-full overflow-y-auto ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const tones = {
  green: 'bg-emerald-50 text-emerald-700', red: 'bg-rose-50 text-rose-700', amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-indigo-50 text-indigo-700', gray: 'bg-slate-100 text-slate-600',
};
export const Badge = ({ tone = 'gray', children }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tones[tone]}`}>{children}</span>
);

export const EmptyState = ({ icon: Icon, title, text }) => (
  <div className="card flex flex-col items-center px-6 py-14 text-center">
    <div className="mb-3 rounded-full bg-emerald-50 p-3 text-emerald-600"><Icon size={24} /></div>
    <h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
  </div>
);

export const Spinner = () => <div className="py-16 text-center text-slate-400">Loading…</div>;

// Stagger helpers: wrap a list in <Stagger>, each child in <Item>
export const Stagger = ({ children, className = '' }) => (
  <motion.div className={className} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>{children}</motion.div>
);
export const Item = ({ children, className = '' }) => (
  <motion.div className={className} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>{children}</motion.div>
);

// Number that counts up when it scrolls into view
export function CountUp({ value, format }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, { duration: 1, ease: 'easeOut', onUpdate: setV });
    return () => c.stop();
  }, [inView, value]);
  return <span ref={ref}>{format(v)}</span>;
}
