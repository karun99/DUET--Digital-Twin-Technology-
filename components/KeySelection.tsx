import React, { useState, useEffect } from 'react';
import { setApiKey } from '../services/geminiService';

interface KeySelectionProps {
  onKeySelected: () => void;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const KeySelection: React.FC<KeySelectionProps> = ({ onKeySelected }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [manualKey, setManualKey] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) {
          onKeySelected();
        }
      } else {
        setHasKey(false);
      }
    };
    checkKey();
  }, [onKeySelected]);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      onKeySelected();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualKey.trim()) {
      setApiKey(manualKey.trim());
      localStorage.setItem('duet-manual-key', manualKey.trim());
      onKeySelected();
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('duet-manual-key');
    if (savedKey) {
      setApiKey(savedKey);
      onKeySelected();
    }
  }, [onKeySelected]);

  if (hasKey === true) return null;

  return (
    <div className="w-full max-w-md bg-[#0a0a0a]/90 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-2xl text-center space-y-8 animate-fade-in-up">
      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 rounded-3xl flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic">Authentication Required</h2>
        <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">
          This advanced digital twin requires a Gemini API key for high-fidelity consciousness mirroring.
        </p>
      </div>

      {!showManual ? (
        <div className="space-y-4">
          {window.aistudio && (
            <button
              onClick={handleOpenKey}
              className="w-full py-5 bg-white text-black rounded-3xl font-bold text-xs tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              Select API Key
            </button>
          )}
          <button
            onClick={() => setShowManual(true)}
            className="w-full py-4 bg-white/5 text-neutral-400 border border-white/10 rounded-3xl font-bold text-[10px] tracking-[0.2em] uppercase transition-all hover:text-white hover:bg-white/10"
          >
            Enter Key Manually
          </button>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <input
            type="password"
            value={manualKey}
            onChange={(e) => setManualKey(e.target.value)}
            placeholder="Paste your Gemini API Key..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-neutral-700 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowManual(false)}
              className="flex-1 py-4 bg-white/5 text-neutral-400 border border-white/10 rounded-2xl font-bold text-[10px] tracking-[0.2em] uppercase"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!manualKey.trim()}
              className="flex-[2] py-4 bg-white text-black rounded-2xl font-bold text-[10px] tracking-[0.2em] uppercase disabled:opacity-50"
            >
              Confirm Key
            </button>
          </div>
          <p className="text-[9px] text-neutral-600 text-left px-2">
            Get your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-neutral-400">aistudio.google.com</a>
          </p>
        </form>
      )}

      <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl text-left">
        <p className="text-[9px] text-cyan-400/80 font-medium leading-relaxed">
          Your key is stored locally in your browser and is only used to communicate with the Gemini API.
        </p>
      </div>
    </div>
  );
};
