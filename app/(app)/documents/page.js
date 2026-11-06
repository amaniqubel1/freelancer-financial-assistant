'use client';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, File as FileIcon, FileText, FolderOpen, Image as ImageIcon, Trash2, UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspace, useRows } from '@/lib/workspace';
import { fmtDate } from '@/lib/format';
import { Badge, EmptyState, Item, Modal, PageHeader, Spinner, Stagger } from '@/components/ui';

const CATS = ['Receipt', 'Contract', 'Tax Document', 'Invoice', 'Other'];
const size = (b) => (b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');

export default function Documents() {
  const { readOnly, ownerId } = useWorkspace();
  const { rows, loading, reload } = useRows('documents');
  const [cat, setCat] = useState('Receipt');
  const [filter, setFilter] = useState('all');
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(null);
  const input = useRef(null);

  async function upload(files) {
    setErr(''); setBusy(true);
    for (const f of files) {
      if (f.size > 10e6) { setErr(`${f.name} is larger than 10 MB.`); continue; }
      const path = `${ownerId}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const up = await supabase.storage.from('documents').upload(path, f);
      if (up.error) { setErr(up.error.message); continue; }
      const { error } = await supabase.from('documents').insert({ name: f.name, category: cat, file_path: path, size: f.size, mime_type: f.type });
      if (error) setErr(error.message);
    }
    setBusy(false); reload();
  }
  const signed = async (d, opts) => (await supabase.storage.from('documents').createSignedUrl(d.file_path, 300, opts)).data?.signedUrl;
  async function open(d) { setPreview({ d, url: await signed(d) }); }
  async function download(d) { const a = document.createElement('a'); a.href = await signed(d, { download: d.name }); a.click(); }
  async function remove(d) {
    if (!confirm(`Delete ${d.name}?`)) return;
    await supabase.storage.from('documents').remove([d.file_path]);
    await supabase.from('documents').delete().eq('id', d.id); reload();
  }
  const shown = rows.filter((d) => filter === 'all' || d.category === filter);
  const icon = (m) => (m?.startsWith('image') ? ImageIcon : m?.includes('pdf') ? FileText : FileIcon);

  return (
    <div>
      <PageHeader title="Documents" subtitle="Receipts, contracts and tax papers, stored securely in one place." />

      {!readOnly && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm"><span className="text-slate-500">Upload as:</span>
            <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <motion.div animate={{ scale: drag ? 1.02 : 1 }} onClick={() => input.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); upload([...e.dataTransfer.files]); }}
            className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${drag ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white hover:border-emerald-400'}`}>
            <motion.div animate={{ y: drag ? -6 : 0 }}><UploadCloud size={36} className="text-emerald-500" /></motion.div>
            <p className="mt-2 font-medium">{busy ? 'Uploading…' : 'Drag and drop files here, or click to browse'}</p>
            <p className="text-sm text-slate-500">PDF, images, anything up to 10 MB</p>
            <input ref={input} type="file" multiple hidden onChange={(e) => { upload([...e.target.files]); e.target.value = ''; }} />
          </motion.div>
          {err && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {['all', ...CATS].map((c) => <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-4 py-1.5 text-sm transition ${filter === c ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{c === 'all' ? 'All' : c}</button>)}
      </div>

      {loading ? <Spinner /> : shown.length === 0 ? <EmptyState icon={FolderOpen} title="No documents yet" text="Upload receipts and contracts so they are ready at tax time." /> : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((d) => { const Ic = icon(d.mime_type); return (
            <Item key={d.id}><div className="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><Ic size={22} /></div>
                <div className="min-w-0 flex-1"><div className="truncate font-medium">{d.name}</div><div className="text-xs text-slate-500">{size(d.size)} · {fmtDate(d.created_at.slice(0, 10))}</div></div>
                <Badge tone="blue">{d.category}</Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-ghost flex-1 px-3 py-1.5" onClick={() => open(d)}><Eye size={14} /> Preview</button>
                <button className="btn-ghost px-3 py-1.5" onClick={() => download(d)}><Download size={14} /></button>
                {!readOnly && <button className="btn-ghost px-3 py-1.5 text-rose-600" onClick={() => remove(d)}><Trash2 size={14} /></button>}
              </div>
            </div></Item>); })}
        </Stagger>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.d.name || ''} wide>
        {preview && (preview.d.mime_type?.startsWith('image') ? <img src={preview.url} alt={preview.d.name} className="mx-auto max-h-[70vh] rounded-lg" />
          : preview.d.mime_type?.includes('pdf') ? <iframe src={preview.url} className="h-[70vh] w-full rounded-lg" />
          : <p className="py-10 text-center text-slate-500">No preview for this file type. Use the download button instead.</p>)}
      </Modal>
    </div>
  );
}
