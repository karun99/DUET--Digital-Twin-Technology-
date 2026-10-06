import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GoogleUser,
  getStoredUser,
  initializeGoogleAuth,
  renderGoogleButton,
  signOut,
} from '../services/auth';

interface AuthGateProps {
  appName?: string;
  onSignedIn?: (user: GoogleUser) => void;
  onSignedOut?: () => void;
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  appName = 'DUET',
  onSignedIn,
  onSignedOut,
  children,
}) => {
  const [user, setUser] = useState<GoogleUser | null>(() => getStoredUser());
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    if (user) {
      setStatus('ready');
      return;
    }

    initializeGoogleAuth((signedIn) => {
      if (cancelled) return;
      setUser(signedIn);
      setStatus('ready');
      onSignedIn?.(signedIn);
    })
      .then(() => {
        if (!cancelled && buttonRef.current) {
          renderGoogleButton(buttonRef.current);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Unable to load Google sign-in.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [user === null, onSignedIn]);

  const handleSignOut = useCallback(() => {
    signOut();
    setUser(null);
    setStatus('loading');
    setError(null);
    onSignedOut?.();
  }, [onSignedOut]);

  if (user) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm text-white/70">
            {user.picture && (
              <img
                src={user.picture}
                alt=""
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-full"
              />
            )}
            <span className="hidden sm:inline">{user.email}</span>
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm px-3 py-1.5 rounded-full text-white/80 border border-white/20 bg-black/50 backdrop-blur hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </div>
        {children}
      </>
    );
  }

  const isError = status === 'error';

  return (
    <div className="fixed inset-0 bg-[#000000] text-white flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[90%] h-[90%] bg-purple-900/10 rounded-full blur-[140px] animate-pulse-slow [animation-delay:3s]"></div>
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6 animate-fade-in-up">
        <h1 className="font-display text-3xl md:text-5xl tracking-widest text-white">
          {appName}
        </h1>
        <p className="text-sm text-white/60 text-center max-w-sm">
          Sign in with your Google account to continue.
        </p>

        {isError ? (
          <div className="flex flex-col items-center gap-4">
            <p className="max-w-md text-center text-sm text-red-400">{error}</p>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-cyan-400 underline"
            >
              Google Cloud Console → Credentials
            </a>
            <button
              onClick={() => window.location.reload()}
              className="text-sm px-4 py-2 rounded-full text-white border border-white/20 hover:bg-white/10"
            >
              Retry
            </button>
          </div>
        ) : (
          <div
            ref={buttonRef}
            className="w-72 min-h-[40px] flex justify-center"
            data-testid="google-signin"
          />
        )}
      </div>
    </div>
  );
};