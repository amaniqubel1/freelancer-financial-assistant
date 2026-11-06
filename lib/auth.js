'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

// Profile row is created by a database trigger at signup, so retry briefly if it is not there yet.
async function fetchProfile(id) {
  for (let i = 0; i < 4; i++) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const userIdRef = useRef(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        userIdRef.current = null;
        setProfile(null);
        setProfileLoading(false);
        setReady(true);
      } else if (userIdRef.current !== s.user.id) {
        userIdRef.current = s.user.id;
        setProfileLoading(true);
        // setTimeout avoids calling Supabase inside its own auth callback
        setTimeout(async () => {
          setProfile(await fetchProfile(s.user.id));
          setProfileLoading(false);
          setReady(true);
        }, 0);
      } else {
        setReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading: !ready || profileLoading,
    refreshProfile: async () => session && setProfile(await fetchProfile(session.user.id)),
    signOut: () => supabase.auth.signOut(),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
