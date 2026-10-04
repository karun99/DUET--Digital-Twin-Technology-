
import React from 'react';
import { CognitiveProfile } from '../types';

interface CognitiveProfileViewProps {
  profile: CognitiveProfile;
  onClose: () => void;
}

export const CognitiveProfileView: React.FC<CognitiveProfileViewProps> = ({ profile, onClose }) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a]/40 border-r border-white/5 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-tighter italic">Cognitive Profile</h3>
            <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-500 mt-1">Semantic Analysis Results</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          <section className="space-y-4">
            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-500 block">Cognitive Signature</label>
            <p className="text-sm text-neutral-300 leading-relaxed font-light bg-white/5 p-6 rounded-2xl border border-white/5 italic">
              "{profile.signature}"
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-purple-500 block">Inherent Biases</label>
              <p className="text-xs text-neutral-400 leading-relaxed">{profile.biases}</p>
            </section>
            <section className="space-y-4">
              <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-orange-500 block">Intellectual Blindspots</label>
              <p className="text-xs text-neutral-400 leading-relaxed">{profile.blindspots}</p>
            </section>
          </div>

          <section className="space-y-4">
            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-500 block">Core Values</label>
            <div className="flex flex-wrap gap-3">
              {profile.values.map((val, i) => (
                <span key={i} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  {val}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-blue-500 block">Epistemological Framework</label>
            <p className="text-xs text-neutral-400 leading-relaxed bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
              {profile.epistemology}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
