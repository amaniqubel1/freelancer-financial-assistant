'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// "Workspace" = whose data we are looking at.
// Freelancer -> their own data (editable). Accounting partner -> a linked freelancer's data (read-only).
const Ctx = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user, profile } = useAuth();
  const isPartner = profile.role === 'partner';
  const [freelancers, setFreelancers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingList, setLoadingList] = useState(isPartner);

  useEffect(() => {
    if (!isPartner) return;
    let live = true;
    (async () => {
      const { data: links } = await supabase.from('partner_access').select('freelancer_id').eq('partner_id', user.id);
      const ids = (links || []).map((l) => l.freelancer_id);
      let list = [];
      if (ids.length) list = (await supabase.from('profiles').select('*').in('id', ids)).data || [];
      if (!live) return;
      setFreelancers(list);
      setSelectedId((prev) => prev || list[0]?.id || null);
      setLoadingList(false);
    })();
    return () => { live = false; };
  }, [isPartner, user.id]);

  const ownerProfile = isPartner ? freelancers.find((f) => f.id === selectedId) || null : profile;
  const value = {
    isPartner, readOnly: isPartner, ownerProfile, ownerId: ownerProfile?.id || null,
    currency: ownerProfile?.currency || 'INR', freelancers, selectedId, selectFreelancer: setSelectedId, loadingList,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useWorkspace = () => useContext(Ctx);

// Loads all rows of a table that belong to the workspace owner
export function useRows(table, order = 'created_at', ascending = false) {
  const { ownerId } = useWorkspace();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!ownerId) { setRows([]); setLoading(false); return; }
    const { data, error } = await supabase.from(table).select('*').eq('user_id', ownerId).order(order, { ascending });
    setError(error?.message || '');
    setRows(data || []);
    setLoading(false);
  }, [ownerId, table, order, ascending]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, error, reload: load };
}
