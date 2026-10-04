
import React, { useState } from 'react';
import { ContextNode, ContextNodeType } from '../types';
import { fetchLinkContent } from '../services/geminiService';

interface KnowledgeBaseProps {
  nodes: ContextNode[];
  onAddNode: (node: ContextNode) => void;
  onRemoveNode: (id: string) => void;
  onClose: () => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ nodes, onAddNode, onRemoveNode, onClose }) => {
  const [input, setInput] = useState('');
  const [type, setType] = useState<ContextNodeType>('link');
  const [isIngesting, setIsIngesting] = useState(false);

  const handleIngest = async () => {
    if (!input.trim()) return;
    setIsIngesting(true);
    try {
      if (type === 'link') {
        const content = await fetchLinkContent(input);
        onAddNode({
          id: Date.now().toString(),
          type: 'link',
          title: content.title,
          content: content.summary,
          timestamp: Date.now(),
          status: 'ready'
        });
      } else {
        onAddNode({
          id: Date.now().toString(),
          type: 'text',
          title: input.substring(0, 30) + '...',
          content: input,
          timestamp: Date.now(),
          status: 'ready'
        });
      }
      setInput('');
    } catch (error) {
      console.error("Ingestion failed", error);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a]/40 border-l border-white/5 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-tighter italic">Knowledgebase</h3>
            <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-500 mt-1">Active Context Nodes</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              <button onClick={() => setType('link')} className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${type === 'link' ? 'bg-white text-black' : 'text-neutral-500'}`}>Link</button>
              <button onClick={() => setType('text')} className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${type === 'text' ? 'bg-white text-black' : 'text-neutral-500'}`}>Fragment</button>
            </div>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder={type === 'link' ? "https://..." : "Paste text fragment..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
              <button 
                onClick={handleIngest} 
                disabled={isIngesting || !input.trim()}
                className="px-6 bg-cyan-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-cyan-400 disabled:opacity-20 transition-all"
              >
                {isIngesting ? '...' : 'Ingest'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nodes.map(node => (
              <div key={node.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl group relative hover:border-cyan-500/30 transition-all">
                <button onClick={() => onRemoveNode(node.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all">✕</button>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${node.type === 'link' ? 'bg-cyan-400' : 'bg-purple-400'}`}></div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-500">{node.type}</span>
                </div>
                <h4 className="text-xs font-bold text-white mb-2 line-clamp-1">{node.title}</h4>
                <p className="text-[10px] text-neutral-400 line-clamp-3 leading-relaxed">{node.content}</p>
              </div>
            ))}
            {nodes.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4 opacity-30">
                <div className="w-12 h-12 border border-dashed border-white/20 rounded-full mx-auto flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">No Active Nodes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
