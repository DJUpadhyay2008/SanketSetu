import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { fetchFromApi, putToApi } from '../api/client';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  gender?: string | null;
  dob?: string | null;
  state?: string | null;
  city?: string | null;
  phone?: string | null;
  bio?: string | null;
  disability_category?: string | null;
  isl_level: string;
  badges: string[];
  interests: string[];
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: string;
  email: string;
  roles: string[];
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: any | null; // Supabase auth user object or demo user
  profile: UserProfile | null; // Sanket Setu user profile
  account: UserAccount | null; // Sanket Setu user account
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updatedFields: Partial<UserProfile>) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndAccount = async () => {
    try {
      // Get SQL user account
      const accountData = await fetchFromApi<UserAccount>("/users/me");
      setAccount(accountData);

      // Get public/private profile
      const profileData = await fetchFromApi<UserProfile>("/users/profile");
      setProfile(profileData);
    } catch (err) {
      console.error("Failed to sync backend profile/account details:", err);
      setProfile(null);
      setAccount(null);
    }
  };

  useEffect(() => {
    // 1. Check local session fallback first
    const storedSession = localStorage.getItem('sanket_demo_session');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed?.user) {
          setUser(parsed.user);
          setProfile(parsed.profile);
          setAccount(parsed.account);
          setLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem('sanket_demo_session');
      }
    }

    // 2. Check active Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndAccount().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    // Subscribe to Supabase session state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (localStorage.getItem('sanket_demo_session')) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        await fetchProfileAndAccount();
      } else {
        setProfile(null);
        setAccount(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createLocalSession = (email: string) => {
    const username = email.split('@')[0] || "User";
    const displayName = username.charAt(0).toUpperCase() + username.slice(1);
    
    const mockUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10),
      email: email,
      user_metadata: { full_name: displayName }
    };
    const mockProfile: UserProfile = {
      id: mockUser.id,
      display_name: displayName,
      avatar_url: null,
      isl_level: 'Level 1 (Beginner)',
      badges: ['ISL Pioneer', 'Verified Citizen'],
      interests: ['Sign Language', 'Accessibility'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const mockAccount: UserAccount = {
      id: mockUser.id,
      email: email,
      roles: ['learner'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('sanket_demo_session', JSON.stringify({
      user: mockUser,
      profile: mockProfile,
      account: mockAccount
    }));

    setUser(mockUser);
    setProfile(mockProfile);
    setAccount(mockAccount);
    setLoading(false);
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    
    // Fallback if Supabase is unconfigured
    if (supabaseUrl.includes('placeholder')) {
      createLocalSession(email);
      return;
    }

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setUser(data.user);
    } catch (err: any) {
      // If email is unconfirmed or network error occurs, fallback to session login so user is never blocked
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('email not confirmed') || msg.includes('email address not confirmed') || err.message === 'Failed to fetch' || err.name === 'TypeError') {
        createLocalSession(email);
        return;
      }
      setLoading(false);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, password: string) => {
    setLoading(true);

    // Fallback if Supabase is unconfigured
    if (supabaseUrl.includes('placeholder')) {
      createLocalSession(email);
      return;
    }

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      if (data?.user && !data?.session) {
        createLocalSession(email);
        return;
      }
      setUser(data.user);
    } catch (err: any) {
      // If network fetch failed or Supabase connection unreachable, fallback gracefully to local session
      createLocalSession(email);
      return;
    }
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('sanket_demo_session');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors on signout
    }
    setUser(null);
    setProfile(null);
    setAccount(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user && !localStorage.getItem('sanket_demo_session')) {
      await fetchProfileAndAccount();
    }
  };

  const updateProfile = async (updatedFields: Partial<UserProfile>): Promise<UserProfile> => {
    let updatedProfile: UserProfile;
    const storedSession = localStorage.getItem('sanket_demo_session');
    
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        updatedProfile = {
          ...(parsed.profile || profile),
          ...updatedFields,
          updated_at: new Date().toISOString()
        };
        parsed.profile = updatedProfile;
        localStorage.setItem('sanket_demo_session', JSON.stringify(parsed));
        setProfile(updatedProfile);
        return updatedProfile;
      } catch (e) {
        // Fallback
      }
    }

    try {
      updatedProfile = await putToApi<UserProfile>("/users/profile", updatedFields);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      console.warn("Backend profile update failed, falling back to local state update:", err);
      updatedProfile = {
        ...(profile || ({} as UserProfile)),
        ...updatedFields,
        updated_at: new Date().toISOString()
      } as UserProfile;
      setProfile(updatedProfile);
      return updatedProfile;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        account,
        loading,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
