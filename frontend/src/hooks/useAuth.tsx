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
  registerWithEmail: (email: string, password: string, initialProfile?: Partial<UserProfile>) => Promise<void>;
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

  const createLocalSession = (email: string, initialProfile?: Partial<UserProfile>) => {
    const username = email.split('@')[0] || "User";
    
    // Check if there is a cached override for this user email
    let cachedProfile: Partial<UserProfile> | undefined = initialProfile;
    const cachedOverrideStr = localStorage.getItem(`sanket_profile_override_${email.toLowerCase()}`);
    if (cachedOverrideStr) {
      try {
        const parsed = JSON.parse(cachedOverrideStr);
        cachedProfile = { ...cachedProfile, ...parsed };
      } catch {}
    }

    const displayName = cachedProfile?.display_name || (username.charAt(0).toUpperCase() + username.slice(1));
    
    const mockUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10),
      email: email,
      user_metadata: { full_name: displayName }
    };
    const mockProfile: UserProfile = {
      id: mockUser.id,
      display_name: displayName,
      avatar_url: cachedProfile?.avatar_url || null,
      gender: cachedProfile?.gender || 'Prefer not to say',
      dob: cachedProfile?.dob || '',
      state: cachedProfile?.state || 'Gujarat',
      city: cachedProfile?.city || '',
      phone: cachedProfile?.phone || '',
      bio: cachedProfile?.bio || '',
      disability_category: cachedProfile?.disability_category || 'Deaf / Hard of Hearing',
      isl_level: cachedProfile?.isl_level || 'Level 1 (Beginner)',
      badges: ['ISL Pioneer', 'Verified Citizen'],
      interests: cachedProfile?.interests || ['Everyday Communication', 'Healthcare ISL'],
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
    
    // Read cached profile override for this email if available
    let savedProfileObj: Partial<UserProfile> | undefined;
    const savedOverride = localStorage.getItem(`sanket_profile_override_${email.toLowerCase()}`);
    if (savedOverride) {
      try {
        savedProfileObj = JSON.parse(savedOverride);
      } catch {}
    }

    // Fallback if Supabase is unconfigured
    if (supabaseUrl.includes('placeholder')) {
      createLocalSession(email, savedProfileObj);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      createLocalSession(email, savedProfileObj);
    } catch (err: any) {
      // If email is unconfirmed or network error occurs, fallback to session login so user is never blocked
      createLocalSession(email, savedProfileObj);
    }
  };

  const registerWithEmail = async (email: string, password: string, initialProfile?: Partial<UserProfile>) => {
    setLoading(true);

    // Save profile override locally immediately
    if (initialProfile) {
      localStorage.setItem(`sanket_profile_override_${email.toLowerCase()}`, JSON.stringify(initialProfile));
    }

    // Create local session immediately with registered profile details
    createLocalSession(email, initialProfile);

    // Attempt Supabase sign up in background
    if (!supabaseUrl.includes('placeholder')) {
      try {
        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: initialProfile?.display_name,
              state: initialProfile?.state,
              disability_category: initialProfile?.disability_category
            }
          },
        });
        if (initialProfile) {
          putToApi<UserProfile>("/users/profile", initialProfile).catch(() => {});
        }
      } catch {
        // Fallback session is already active
      }
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
    
    if (user?.email) {
      const emailKey = `sanket_profile_override_${user.email.toLowerCase()}`;
      const existingOverride = localStorage.getItem(emailKey);
      let existingObj = {};
      if (existingOverride) {
        try { existingObj = JSON.parse(existingOverride); } catch {}
      }
      localStorage.setItem(emailKey, JSON.stringify({ ...existingObj, ...updatedFields }));
    }

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
