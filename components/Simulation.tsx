
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { AgentMessage, AgentRole, UserProfile, Attachment, ContextNode, ContextNodeType, ThemeSettings } from '../types';
import { chatWithClone } from '../services/geminiService';
import { TypewriterText } from './TypewriterText';
import { KnowledgeBase } from './KnowledgeBase';
import { CognitiveProfileView } from './CognitiveProfileView';

interface SimulationProps {
  userProfile: UserProfile;
  theme: ThemeSettings;
  updateTheme: (t: Partial<ThemeSettings>) => void;
  onBack: () => void;
  onKeyError: () => void;
}

type Emotion = 'neutral' | 'empathetic' | 'intense' | 'thoughtful' | 'joyful' | 'somber';

const PixelConsciousness: React.FC<{ amplitude: number; emotion: Emotion; processing: boolean; theme: ThemeSettings }> = ({ amplitude, emotion, processing, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        setBlink(true);
        setTimeout(() => setBlink(false), 120);
      }
    }, 2500);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const gridSize = 40;
    const cellSize = canvas.width / gridSize;
    let particles: { x: number; y: number; brightness: number; speed: number; phase: number }[] = [];

    for (let i = 0; i < gridSize * gridSize; i++) {
      particles.push({
        x: i % gridSize,
        y: Math.floor(i / gridSize),
        brightness: Math.random(),
        speed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2
      });
    }

    const getBaseColor = (emo: Emotion) => {
      switch (emo) {
        case 'joyful': return '#00ffcc';
        case 'somber': return '#4d4dff';
        case 'intense': return '#ff0055';
        case 'empathetic': return '#00f2ff';
        case 'thoughtful': return '#ffaa00';
        default: return theme.accentColor;
      }
    };

    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pulseBase = Math.sin(time / 500) * 0.1 + 0.9;
      const baseCol = getBaseColor(emotion);
      
      particles.forEach((p) => {
        p.brightness += p.speed * (processing ? 4 : 1);
        if (p.brightness > 1) p.brightness = 0;

        const centerX = gridSize / 2;
        const centerY = gridSize / 2;
        
        // Face Structure
        const eyeY = gridSize * 0.38;
        const isLeftEye = (Math.abs(p.y - eyeY) < 1.5) && (Math.abs(p.x - gridSize * 0.32) < 1.5);
        const isRightEye = (Math.abs(p.y - eyeY) < 1.5) && (Math.abs(p.x - gridSize * 0.68) < 1.5);
        
        const mouthYBase = gridSize * 0.62;
        const mouthXDist = Math.abs(p.x - centerX);
        let mouthShapeY = mouthYBase;

        if (emotion === 'joyful') mouthShapeY += Math.pow(mouthXDist / (gridSize * 0.2), 2) * -1.5;
        else if (emotion === 'somber') mouthShapeY += Math.pow(mouthXDist / (gridSize * 0.2), 2) * 1.5;

        const mouthOpening = amplitude * 12;
        const isMouthArea = Math.abs(p.y - (mouthShapeY)) < (0.8 + mouthOpening) && mouthXDist < (gridSize * 0.18);

        let featureMultiplier = 1;
        if (isLeftEye || isRightEye) featureMultiplier = blink ? 0.05 : (processing ? 3 : 2);
        if (isMouthArea) featureMultiplier = 2.0 + amplitude * 10;

        const dist = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
        const normalizedDist = dist / (gridSize / 1.8);
        
        let opacity = (1 - normalizedDist) * p.brightness * pulseBase * featureMultiplier;
        opacity = Math.max(0, Math.min(1, opacity));

        if (opacity > 0.05) {
          ctx.fillStyle = baseCol;
          ctx.globalAlpha = opacity;
          const drawSize = cellSize * (0.8 + (isMouthArea ? amplitude : 0));
          ctx.fillRect(p.x * cellSize + Math.sin(time*0.001)*0.5, p.y * cellSize + Math.cos(time*0.001)*0.5, drawSize, drawSize);
          if (theme.glowIntensity > 0) {
            ctx.shadowBlur = 12 * theme.glowIntensity;
            ctx.shadowColor = baseCol;
          }
        }
      });
      animationRef.current = requestAnimationFrame(render);
    };
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [emotion, processing, amplitude, blink, theme]);

  return <canvas ref={canvasRef} width={400} height={400} className="w-full h-full opacity-100 mix-blend-screen transition-opacity duration-1000 scale-110" />;
};

export const Simulation: React.FC<SimulationProps> = ({ userProfile, theme, updateTheme, onBack, onKeyError }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(true);
  const [showProfile, setShowProfile] = useState(true);
  const [contextNodes, setContextNodes] = useState<ContextNode[]>([]);
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auraColor = useMemo(() => {
    switch (currentEmotion) {
      case 'joyful': return '#00ffcc';
      case 'somber': return '#4d4dff';
      case 'intense': return '#ff0055';
      case 'empathetic': return '#00f2ff';
      case 'thoughtful': return '#ffaa00';
      default: return theme.accentColor;
    }
  }, [currentEmotion, theme.accentColor]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const updateEmotion = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.length > 300) setCurrentEmotion('thoughtful');
    else if (lower.includes("!") || lower.includes("must")) setCurrentEmotion('intense');
    else if (lower.includes("sorry") || lower.includes("sad")) setCurrentEmotion('somber');
    else if (lower.includes("happy") || lower.includes("great")) setCurrentEmotion('joyful');
    else if (lower.includes("understand") || lower.includes("hear")) setCurrentEmotion('empathetic');
    else setCurrentEmotion('neutral');
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isPaused || (!input.trim() && pendingAttachments.length === 0) || isProcessing) return;
    
    const userMsg: AgentMessage = { id: Date.now().toString(), role: AgentRole.USER, content: input, timestamp: Date.now(), attachments: [...pendingAttachments] };
    setMessages(prev => [...prev, userMsg]);
    updateEmotion(input);
    const curInput = input;
    const curAtts = [...pendingAttachments];
    setInput('');
    setPendingAttachments([]);
    setIsProcessing(true);

    try {
      const response = await chatWithClone(messages, curInput, userProfile, curAtts, contextNodes);
      const newCloneMsg: AgentMessage = { 
        id: (Date.now() + 1).toString(), 
        role: AgentRole.CLONE, 
        content: response.finalResponse, 
        timestamp: Date.now(), 
        internalThoughts: [
          { role: AgentRole.PRIMARY, content: response.primaryThought }, 
          { role: AgentRole.META, content: response.metaThought }
        ]
      };
      if (response.sketchUrl) {
        newCloneMsg.attachments = [{ mimeType: 'image/png', data: response.sketchUrl.split(',')[1], name: `DREAM_${Date.now()}.png` }];
      }
      setMessages(prev => [...prev, newCloneMsg]);
      updateEmotion(response.finalResponse);
    } catch (err: any) { 
       if (err.message === 'API_KEY_ERROR') {
         onKeyError();
       }
       console.error(err);
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-transparent overflow-hidden">
      
      {/* Dynamic Aura Background - Relative to container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%] transition-colors duration-[4s]" 
             style={{ background: `radial-gradient(circle at 50% 50%, ${auraColor}15 0%, transparent 80%)` }}></div>
      </div>

      {/* Floating Control Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex gap-2 p-1 bg-black/60 border border-white/10 rounded-full backdrop-blur-2xl shadow-2xl animate-fade-in">
         <button onClick={() => setShowSettings(true)} className="px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-all">Config</button>
         <div className="w-px h-4 bg-white/10 self-center"></div>
         <button onClick={() => setShowProfile(!showProfile)} className={`px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-all ${showProfile ? 'text-white' : 'text-neutral-400 hover:text-white'}`}>Profile</button>
         <div className="w-px h-4 bg-white/10 self-center"></div>
         <button onClick={() => setShowKnowledgeBase(!showKnowledgeBase)} className={`px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-all ${showKnowledgeBase ? 'text-white' : 'text-neutral-400 hover:text-white'}`}>Knowledge</button>
         <div className="w-px h-4 bg-white/10 self-center"></div>
         <button onClick={onBack} className="px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-400 transition-all">Terminate</button>
         <div className="w-px h-4 bg-white/10 self-center"></div>
         <button onClick={() => setIsPaused(!isPaused)} className={`px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-all ${isPaused ? 'text-yellow-400' : 'text-neutral-400 hover:text-white'}`}>
           {isPaused ? 'Paused' : 'Active'}
         </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Sidebar: Cognitive Profile */}
        {showProfile && userProfile.cognitiveProfile && (
          <div className="hidden lg:block w-[320px] shrink-0 animate-fade-in">
            <CognitiveProfileView profile={userProfile.cognitiveProfile} onClose={() => setShowProfile(false)} />
          </div>
        )}

        {/* Center: Chat Simulation */}
        <main className="flex-1 relative flex flex-col overflow-hidden border-x border-white/5">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-12 py-32 space-y-12 scrollbar-hide z-10 pb-48">
             {messages.length === 0 && (
               <div className="flex flex-col items-center justify-center h-full opacity-60">
                  <div className="w-48 h-48 md:w-64 md:h-64 mb-10 drop-shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                      <PixelConsciousness amplitude={0.02} emotion={currentEmotion} processing={isProcessing} theme={theme} />
                  </div>
                  <div className="space-y-4 text-center">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Subject: {userProfile.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-cyan-500 animate-pulse">Establishing Bridge...</p>
                  </div>
               </div>
             )}
             {messages.map((msg, idx) => (
               <div key={msg.id} className={`flex flex-col ${msg.role === AgentRole.USER ? 'items-end' : 'items-start'} animate-msg`}>
                  <div className={`group relative max-w-[95%] md:max-w-[85%] rounded-[2.5rem] p-6 md:p-8 ${msg.role === AgentRole.USER ? 'bg-cyan-500/5 border border-cyan-500/20 text-white' : 'bg-[#0a0a0a]/80 border border-white/5 backdrop-blur-xl shadow-2xl'}`}>
                     {msg.role === AgentRole.CLONE && (
                        <div className="flex items-center gap-3 mb-6 opacity-30">
                           <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                           <span className="text-[9px] font-bold uppercase tracking-widest">Stream // {userProfile.name}</span>
                        </div>
                     )}
                     {msg.role === AgentRole.CLONE && idx === messages.length - 1 ? (
                       <TypewriterText text={msg.content} speed={8} onStart={() => setIsTyping(true)} onComplete={() => setIsTyping(false)} />
                     ) : (
                       <div className="prose prose-invert prose-sm md:prose-base max-w-none opacity-90 leading-relaxed"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                     )}
                     {msg.attachments?.map((att, i) => (
                       <div key={i} className="mt-8 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                         <img src={`data:image/png;base64,${att.data}`} onClick={() => setSelectedImage(att)} className="cursor-zoom-in w-full object-cover max-h-96 hover:scale-[1.02] transition-transform duration-700" alt="Cognitive Trace" />
                       </div>
                     ))}
                  </div>
               </div>
             ))}
          </div>

          {/* Input area */}
          <div className="absolute bottom-0 w-full p-6 md:p-10 z-40 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent">
             <div className="max-w-3xl mx-auto">
               <div className={`flex items-center gap-3 p-2 bg-[#0a0a0a] border rounded-full shadow-3xl transition-all duration-500 ${isProcessing ? 'border-cyan-500/40 ring-4 ring-cyan-500/5' : 'border-white/5'}`}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:text-white transition-all bg-white/5 rounded-full shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </button>
                  <form onSubmit={handleSend} className="flex-1 flex items-center gap-3 overflow-hidden">
                     <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Send signal..." className="flex-1 bg-transparent border-none py-3 text-white placeholder-neutral-800 focus:outline-none text-sm md:text-base font-light px-2 min-w-0" disabled={isProcessing || isPaused} />
                     <button type="submit" disabled={!input.trim() || isProcessing} className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full shadow-xl hover:bg-cyan-400 transition-all shrink-0">
                        {isProcessing ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M5 12h14M12 5l7 7-7 7" /></svg>
                        )}
                     </button>
                  </form>
               </div>
             </div>
          </div>
        </main>

        {/* Right Sidebar: Knowledgebase */}
        {showKnowledgeBase && (
          <div className="hidden lg:block w-[320px] shrink-0 animate-fade-in">
            <KnowledgeBase 
              nodes={contextNodes} 
              onAddNode={(node) => setContextNodes(prev => [...prev, node])} 
              onRemoveNode={(id) => setContextNodes(prev => prev.filter(n => n.id !== id))} 
              onClose={() => setShowKnowledgeBase(false)} 
            />
          </div>
        )}
      </div>

      {/* Mobile Overlays (Keep them for small screens) */}
      <div className="lg:hidden">
        {showKnowledgeBase && (
          <div className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-2xl p-4 flex items-center justify-center">
            <div className="w-full h-[80vh] relative">
               <button onClick={() => setShowKnowledgeBase(false)} className="absolute top-4 right-4 z-[210] text-white">✕</button>
               <KnowledgeBase 
                nodes={contextNodes} 
                onAddNode={(node) => setContextNodes(prev => [...prev, node])} 
                onRemoveNode={(id) => setContextNodes(prev => prev.filter(n => n.id !== id))} 
                onClose={() => setShowKnowledgeBase(false)} 
              />
            </div>
          </div>
        )}

        {showProfile && userProfile.cognitiveProfile && (
          <div className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-2xl p-4 flex items-center justify-center">
            <div className="w-full h-[80vh] relative">
               <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 z-[210] text-white">✕</button>
               <CognitiveProfileView 
                profile={userProfile.cognitiveProfile} 
                onClose={() => setShowProfile(false)} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6">
          <div className="w-full max-w-sm p-10 bg-[#0a0a0a] border border-white/10 rounded-[3rem] space-y-10 shadow-2xl animate-fade-in-up">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold uppercase tracking-tighter italic">Overrides</h3>
                <button onClick={() => setShowSettings(false)} className="text-neutral-500 hover:text-white p-2 transition-colors">✕</button>
             </div>
             <div className="space-y-8">
                <div className="space-y-4">
                   <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-600 block">Frequency</label>
                   <div className="flex flex-wrap gap-4">
                      {['#00f2ff', '#ff00ff', '#ffaa00', '#ff0055', '#00ffcc'].map(c => (
                        <button key={c} onClick={() => updateTheme({ accentColor: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${theme.accentColor === c ? 'border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                      ))}
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-600 block">Glow</label>
                   <input type="range" min="0" max="2" step="0.1" value={theme.glowIntensity} onChange={e => updateTheme({ glowIntensity: parseFloat(e.target.value) })} className="w-full h-1 bg-white/10 rounded-full accent-white appearance-none cursor-pointer" />
                </div>
                <div className="pt-4 border-t border-white/5">
                   <button 
                     onClick={() => {
                       localStorage.removeItem('duet-manual-key');
                       window.location.reload();
                     }} 
                     className="text-[9px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-400 transition-all"
                   >
                     Reset API Key
                   </button>
                </div>
             </div>
             <button onClick={() => setShowSettings(false)} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-2xl active:scale-[0.98] transition-all">Apply</button>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="absolute inset-0 z-[250] flex flex-col items-center justify-center bg-black/98 p-10 animate-fade-in backdrop-blur-3xl">
           <button onClick={() => setSelectedImage(null)} className="absolute top-10 right-10 p-4 text-neutral-500 hover:text-white transition-all">✕</button>
           <div className="w-full h-full flex flex-col items-center justify-center gap-10">
              <img src={`data:image/png;base64,${selectedImage.data}`} className="max-h-[75vh] max-w-full rounded-[2.5rem] border border-white/10 shadow-3xl object-contain" />
              <button onClick={() => {
                const a = document.createElement('a'); a.href=`data:image/png;base64,${selectedImage.data}`; a.download=`fragment_${Date.now()}.png`; a.click();
              }} className="px-10 py-4 bg-white text-black font-bold uppercase tracking-[0.3em] rounded-full shadow-2xl text-[10px] active:scale-95 transition-all">Download Fragment</button>
           </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setPendingAttachments(prev => [...prev, { mimeType: file.type, data: base64, name: file.name }]);
        };
        reader.readAsDataURL(file);
      }} className="hidden" />
      
      <style>{`
        @keyframes msg { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-msg { animation: msg 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: msg 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};
