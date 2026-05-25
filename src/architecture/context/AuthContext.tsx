/**
 * NexusAI — Auth Context & Provider
 * Provides authentication state, user identity, and auth actions
 * to the entire React tree. Handles token bootstrap and silent refresh.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { UserIdentity, Session, AccessTokenPayload } from "../types/auth";
import { authService } from "../services/AuthService";
import { permissionsService } from "../services/PermissionsService";
import { usageTracker } from "../services/UsageTracker";
import { realtimePipeline } from "../services/RealtimePipeline";
import { modelOrchestrator } from "../services/ModelOrchestrator";

/* ── Context Shape ───────────────────────────────────────────────────── */

export interface AuthContextValue {
  // State
  user:             UserIdentity | null;
  session:          Session | null;
  tokenPayload:     AccessTokenPayload | null;
  isAuthenticated:  boolean;
  isLoading:        boolean;
  error:            string | null;

  // Actions
  signIn:           (email: string, password: string, remember?: boolean) => Promise<SignInResult>;
  signInWithSSO:    (provider: string, workspaceSlug: string) => Promise<void>;
  signOut:          () => Promise<void>;
  refreshToken:     () => Promise<void>;

  // Workspace switching
  currentWorkspaceId: string | null;
  switchWorkspace:    (workspaceId: string) => Promise<void>;
  availableWorkspaces: WorkspaceSummary[];
}

export interface SignInResult {
  success:      boolean;
  mfaRequired?: { challengeId: string; method: string };
  error?:       string;
}

export interface WorkspaceSummary {
  id:        string;
  slug:      string;
  name:      string;
  role:      string;
  plan:      string;
  logoUrl?:  string;
  isDefault: boolean;
}

/* ── Context ─────────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,               setUser]               = useState<UserIdentity | null>(null);
  const [session,            setSession]            = useState<Session | null>(null);
  const [tokenPayload,       setTokenPayload]       = useState<AccessTokenPayload | null>(null);
  const [isLoading,          setIsLoading]          = useState(true);
  const [error,              setError]              = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [availableWorkspaces,setAvailableWorkspaces]= useState<WorkspaceSummary[]>([]);

  /* ── Bootstrap session on mount ──────────────────────────────── */

  useEffect(() => {
    (async () => {
      try {
        // Attempt silent token refresh (uses HttpOnly cookie)
        const accessToken = await authService.refreshAccessToken();
        const payload     = authService.parseTokenPayload() as AccessTokenPayload;

        if (payload) {
          setTokenPayload(payload);
          permissionsService.setTokenPayload(payload);
          setCurrentWorkspaceId(payload.wid);

          // Load feature flags + model config in parallel
          await Promise.all([
            permissionsService.loadFeatureFlags(payload.wid),
            modelOrchestrator.loadRoutingConfig(payload.wid, payload.tier),
          ]);

          usageTracker.start();
          await realtimePipeline.connect(payload.wid);
        }
      } catch {
        // No valid session — show login
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      usageTracker.stop();
      realtimePipeline.disconnect();
    };
  }, []);

  /* ── Sign In ─────────────────────────────────────────────────── */

  const signIn = useCallback(async (email: string, password: string, remember = false): Promise<SignInResult> => {
    setError(null);
    try {
      const deviceId = crypto.randomUUID();
      const response = await authService.signIn({ email, password, deviceId, remember });

      if (response.mfaRequired) {
        return { success: false, mfaRequired: response.mfaRequired };
      }

      await bootstrapSession(response.user, response.session, response.workspaces);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  /* ── SSO ─────────────────────────────────────────────────────── */

  const signInWithSSO = useCallback(async (provider: string, workspaceSlug: string): Promise<void> => {
    await authService.signInWithSSO(provider as "saml", workspaceSlug);
    // Page redirects to IdP — handled in /auth/callback route
  }, []);

  /* ── Sign Out ────────────────────────────────────────────────── */

  const signOut = useCallback(async (): Promise<void> => {
    usageTracker.stop();
    realtimePipeline.disconnect();
    await authService.signOut();
    setUser(null);
    setSession(null);
    setTokenPayload(null);
    setCurrentWorkspaceId(null);
    setAvailableWorkspaces([]);
  }, []);

  /* ── Silent refresh ──────────────────────────────────────────── */

  const refreshToken = useCallback(async (): Promise<void> => {
    await authService.refreshAccessToken();
    const payload = authService.parseTokenPayload() as AccessTokenPayload;
    if (payload) {
      setTokenPayload(payload);
      permissionsService.setTokenPayload(payload);
    }
  }, []);

  /* ── Workspace switching ─────────────────────────────────────── */

  const switchWorkspace = useCallback(async (workspaceId: string): Promise<void> => {
    realtimePipeline.disconnect();
    // Server issues new token scoped to the new workspace
    await authService.post("/workspaces/switch", { workspaceId });
    await refreshToken();
    const payload = authService.parseTokenPayload() as AccessTokenPayload;
    if (payload) {
      setCurrentWorkspaceId(payload.wid);
      await Promise.all([
        permissionsService.loadFeatureFlags(payload.wid),
        modelOrchestrator.loadRoutingConfig(payload.wid, payload.tier),
        realtimePipeline.connect(payload.wid),
      ]);
    }
  }, [refreshToken]);

  /* ── Helpers ─────────────────────────────────────────────────── */

  async function bootstrapSession(
    u: UserIdentity,
    s: Session,
    workspaces: WorkspaceSummary[],
  ): Promise<void> {
    setUser(u);
    setSession(s);
    setAvailableWorkspaces(workspaces);

    const payload = authService.parseTokenPayload() as AccessTokenPayload;
    if (payload) {
      setTokenPayload(payload);
      permissionsService.setTokenPayload(payload);
      const defaultWs = workspaces.find(w => w.isDefault) ?? workspaces[0];
      setCurrentWorkspaceId(defaultWs?.id ?? payload.wid);
      await Promise.all([
        permissionsService.loadFeatureFlags(payload.wid),
        modelOrchestrator.loadRoutingConfig(payload.wid, payload.tier),
        realtimePipeline.connect(payload.wid),
      ]);
      usageTracker.start();
    }
  }

  const value: AuthContextValue = {
    user,
    session,
    tokenPayload,
    isAuthenticated:   !!user && !!tokenPayload,
    isLoading,
    error,
    signIn,
    signInWithSSO,
    signOut,
    refreshToken,
    currentWorkspaceId,
    switchWorkspace,
    availableWorkspaces,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ────────────────────────────────────────────────────────────── */

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within <AuthProvider>");
  return ctx;
}

// Extend authService with a post helper used above
declare module "../services/AuthService" {
  interface AuthService {
    post<T>(path: string, body: unknown): Promise<T>;
  }
}
