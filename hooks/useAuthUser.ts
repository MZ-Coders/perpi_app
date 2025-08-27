import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UserWithRole {
  id: string;
  email: string;
  user_role?: string;
  [key: string]: any;
}

export function useAuthUser() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  
  const fetchUserWithRole = async (authUser: any) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    try {
      const { data: userData, error } = await supabase
        .from('users_')
        .select('user_role')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.log('Error fetching user role:', error);
        setUser(authUser);
        return;
      }

      setUser({
        ...authUser,
        user_role: userData?.user_role || 'customer'
      });
    } catch (err) {
      console.log('Error in fetchUserWithRole:', err);
      setUser(authUser);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserWithRole(user);
    });
    
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserWithRole(session?.user ?? null);
    });
    
    return () => { listener?.subscription?.unsubscribe?.(); };
  }, []);
  
  return user;
}
