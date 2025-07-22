import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';



export function useAuthUser() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription?.unsubscribe?.(); };
  }, []);
  return user;
}
