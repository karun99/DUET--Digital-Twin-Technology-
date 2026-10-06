/// Gmail SSO via Google Identity Services — client-side sign-in.
/// Requires VITE_GOOGLE_CLIENT_ID (a Web-application OAuth client id from
/// https://console.cloud.google.com/apis/credentials) at build time.

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface GoogleUser {
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
  sub: string;
  exp: number;
}

const SESSION_KEY = 'duet-google-session';

function getClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined ?? '';
}

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In. Check your connection and retry.'));
    document.head.appendChild(script);
  });
}

function decodeJwt(token: string): {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  sub?: string;
  exp?: number;
} {
  const part = token.split('.')[1];
  if (!part) throw new Error('Invalid Google credential.');
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
  return JSON.parse(json);
}

export function getStoredUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as GoogleUser;
    if (!user.exp || user.exp * 1000 < Date.now() + 60_000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
  window.google?.accounts.id.disableAutoSelect();
}

export function initializeGoogleAuth(onSignIn: (user: GoogleUser) => void): Promise<void> {
  const clientId = getClientId();
  if (!clientId) {
    return Promise.reject(
      new Error('Google sign-in is not configured yet (VITE_GOOGLE_CLIENT_ID is missing).'),
    );
  }
  return loadGsiScript().then(() => {
    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        try {
          const payload = decodeJwt(credential);
          const user: GoogleUser = {
            email: payload.email ?? '',
            emailVerified: !!payload.email_verified,
            name: payload.name ?? payload.email?.split('@')[0] ?? 'User',
            picture: payload.picture,
            sub: payload.sub ?? credential,
            exp: payload.exp ?? 0,
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
          onSignIn(user);
        } catch (e) {
          console.error('Google sign-in decode failed:', e);
        }
      },
      cancel_on_tap_outside: true,
    });
  });
}

export function renderGoogleButton(parent: HTMLElement): void {
  window.google?.accounts.id.renderButton(parent, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'left',
    width: parent.clientWidth || 288,
  });
}