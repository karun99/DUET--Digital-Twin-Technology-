
import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Simulation } from './components/Simulation';
import { KeySelection } from './components/KeySelection';
import { AuthGate } from './components/AuthGate';
import { UserProfile, ThemeSettings } from './types';

const DEFAULT_THEME: ThemeSettings = {
  accentColor: '#00f2ff',
  glowIntensity: 1.2,
  bgStyle: 'grid',
  borderRadius: '2rem'
};

function App() {
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('duet-profile');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('duet-theme');
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  useEffect(() => {
    localStorage.setItem('duet-theme', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('duet-profile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('duet-profile');
    }
  }, [userProfile]);

  const updateTheme = (t: Partial<ThemeSettings>) => setTheme(prev => ({ ...prev, ...t }));

  return (
    <AuthGate appName="DUET">
      <div className="fixed inset-0 bg-[#000000] text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Full-screen UI Container */}
      <div className="relative z-10 w-full h-full flex flex-col bg-[#050505] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Ambient Effects restricted to the 70% column */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[90%] h-[90%] bg-purple-900/10 rounded-full blur-[140px] animate-pulse-slow [animation-delay:3s]"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
          
          {/* Subtle Inner Grid Overlay */}
          {theme.bgStyle === 'grid' && (
            <div className="absolute inset-0 opacity-[0.05]" 
                 style={{ backgroundImage: `linear-gradient(${theme.accentColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.accentColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
            </div>
          )}
        </div>

        <main className="flex-1 flex flex-col h-full min-h-0 relative z-10">
          {!isKeySelected ? (
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto scrollbar-hide">
              <KeySelection onKeySelected={() => setIsKeySelected(true)} />
            </div>
          ) : !userProfile ? (
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto scrollbar-hide">
              <div className="w-full flex justify-center animate-fade-in-up">
                <Onboarding onComplete={setUserProfile} onKeyError={() => setIsKeySelected(false)} />
              </div>
            </div>
          ) : (
            <Simulation 
              userProfile={userProfile} 
              theme={theme}
              updateTheme={updateTheme}
              onBack={() => setUserProfile(null)} 
              onKeyError={() => setIsKeySelected(false)} 
            />
          )}
        </main>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.25; }
        }
        .animate-pulse-slow { animation: pulse-slow 12s ease-in-out infinite; }
        
        @keyframes fade-in-up { 
          from { opacity: 0; transform: translateY(30px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      </div>
    </AuthGate>
  );
}

export default App;
