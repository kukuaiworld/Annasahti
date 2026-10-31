'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AuthContextValue, Organisation, UserProfile } from '@/types/auth';
import { recognitionApi } from '@/services/api/recognition';
import { organisationsApi } from '@/services/api/organisations';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads verified profile and organization context from trusted backend APIs.
   * Never infers administrative privileges from user_metadata or form inputs.
   */
  const loadBackendContext = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setProfile(null);
      setOrganisation(null);
      return;
    }

    try {
      // 1. Fetch profile from /recognition/me
      const profileData = await recognitionApi.getMyProfile();
      setProfile(profileData);

      // 2. Fetch organisation if user belongs to one
      if (profileData?.organisationId) {
        try {
          const orgData = await organisationsApi.getOrganisationById(profileData.organisationId);
          setOrganisation(orgData);
        } catch {
          // Organisation fetch failed or pending verification
          setOrganisation(null);
        }
      } else {
        // Check available organisations via /organisations
        try {
          const { data: orgs } = await organisationsApi.listOrganisations();
          if (orgs && orgs.length > 0) {
            setOrganisation(orgs[0]);
          }
        } catch {
          setOrganisation(null);
        }
      }
    } catch {
      // User may be unprovisioned or backend temporarily unreachable.
      // Do not synthesize fake roles.
      setProfile(null);
      setOrganisation(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session: activeSession },
    } = await supabase.auth.getSession();
    await loadBackendContext(activeSession);
  }, [supabase, loadBackendContext]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession) {
            await loadBackendContext(initialSession);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to initialize session');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(true);

      if (newSession) {
        await loadBackendContext(newSession);
      } else {
        setProfile(null);
        setOrganisation(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadBackendContext]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      return { error: signInError };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (signUpError) {
      setError(signUpError.message);
      return { error: signUpError };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOrganisation(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organisation,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
