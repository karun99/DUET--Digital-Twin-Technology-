
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { searchUserBio, analyzeIdentity, generateAvatar } from '../services/geminiService';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onKeyError: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onKeyError }) => {
  const [mode, setMode] = useState<'manual' | 'search'>('manual');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!name.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const result = await searchUserBio(name);
      setBio(result.bio);
      if (result.bio.toLowerCase().includes("no bio found")) {
         setError("Insufficient public data. Manual grounding recommended.");
      }
    } catch (e) {
      setError("Synchronisation with the data grid failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bio) return;
    
    setIsAnalyzing(true);
    try {
        setLoadingStep('Ingesting Ideological Matrix...');
        const cognitiveProfile = await analyzeIdentity(name, bio, links);
        
        setLoadingStep('Mapping Bias & Blindspots...');
        await new Promise(resolve => setTimeout(resolve, 800));
        const avatarUrl = await generateAvatar(name, bio);
        
        onComplete({ 
          name, 
          bio: bio, 
          links: links, 
          source: mode,
          avatarUrl: avatarUrl,
          cognitiveProfile: cognitiveProfile
        });
    } catch (err: any) {
        if (err.message === 'API_KEY_ERROR') {
          onKeyError();
        }
        onComplete({ name, bio, links: links, source: mode });
    } finally {
        setIsAnalyzing(false);
        setLoadingStep('');
    }
  };

  return (
    <div className="w-full max-w-2xl bg-[#0a0a0a]/80 border border-white/10 rounded-[2.5rem] p-10 md:p-14 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700"></div>

      <div className="relative z-10 space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 mb-4 animate-float">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter text-white uppercase italic">
            DUET
          </h1>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">
            Initialize high-fidelity consciousness mirroring.
          </p>
        </header>

        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 max-w-xs mx-auto">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'manual' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode('search')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'search' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Trace
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Identity_ID</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-neutral-700 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                placeholder={mode === 'manual' ? "Target Persona" : "e.g. Marcus Aurelius"}
              />
              {mode === 'search' && (
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !name}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-20"
                >
                  {isSearching ? '...' : 'Fetch'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Worldview_Matrix</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full h-40 bg-white/5 border border-white/10 rounded-[2rem] px-7 py-5 text-white placeholder-neutral-700 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all resize-none text-sm leading-relaxed font-light"
              placeholder="Inject core beliefs, philosophical patterns, or ideological fragments..."
            />
          </div>

          {error && <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-mono uppercase tracking-wider text-center animate-pulse">{error}</div>}

          <button
            type="submit"
            disabled={!bio || !name || isAnalyzing}
            className="w-full group relative flex items-center justify-center gap-4 py-5 bg-white text-black rounded-3xl font-bold text-xs tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            {isAnalyzing ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                {loadingStep}
              </span>
            ) : (
              <>
                <span>Establish Mirror Link</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </>
            )}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
