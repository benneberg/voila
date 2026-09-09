/**
 * OmniDrop — universal file drop zone.
 * UX-001: Privacy notice — explains what happens to the file.
 * UX-002: Tier indicator — shows whether processing is local or server-side.
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Zap, Shield, Cpu, Server, Lock, Info } from 'lucide-react';

interface OmniDropProps {
  onFileDrop: (file: File) => void;
  isProcessing: boolean;
  tier?: string;
}

const TIER_INFO = {
  tier1: {
    icon: Cpu, label: 'Browser only',
    color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', text: 'text-green-400',
    privacy: 'File never leaves your device — processed entirely in-browser.',
    leavesDevice: false,
  },
  tier2: {
    icon: Server, label: 'Cloud processing',
    color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/20', text: 'text-amber-400',
    privacy: 'File sent to backend server. Auto-deleted within 1 hour.',
    leavesDevice: true,
  },
  tier3: {
    icon: Shield, label: 'Sandboxed VM',
    color: 'from-red-500/20 to-pink-500/10', border: 'border-red-500/20', text: 'text-red-400',
    privacy: 'Executed in isolated Firecracker VM. Auto-deleted after run.',
    leavesDevice: true,
  },
} as const;

export default function OmniDrop({ onFileDrop, isProcessing, tier = 'tier1' }: OmniDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);

  const tierInfo = TIER_INFO[tier as keyof typeof TIER_INFO] ?? TIER_INFO.tier1;
  const TierIcon = tierInfo.icon;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCount.current += 1; setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCount.current -= 1;
    if (dragCount.current <= 0) { dragCount.current = 0; setIsDragging(false); }
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCount.current = 0;
    if (e.dataTransfer.files.length > 0) onFileDrop(e.dataTransfer.files[0]);
  }, [onFileDrop]);

  const handleClick = () => { if (!isProcessing) fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileDrop(e.target.files[0]); e.target.value = '';
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-3 w-full">
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] bg-gradient-to-r ${tierInfo.color} border ${tierInfo.border}`}>
        <TierIcon className={`w-3 h-3 ${tierInfo.text}`} />
        <span className={`${tierInfo.text} font-medium`}>{tierInfo.label}</span>
        {tierInfo.leavesDevice
          ? <span className="text-white/30">· file sent to server</span>
          : <span className="text-white/30">· stays on your device</span>}
        <button onClick={() => setShowPrivacy(v => !v)} className="ml-0.5 text-white/25 hover:text-white/50 transition-colors" aria-label="Privacy information">
          <Info className="w-3 h-3" />
        </button>
      </motion.div>

      <AnimatePresence>
        {showPrivacy && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden w-full max-w-sm">
            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-[11px] bg-gradient-to-r ${tierInfo.color} border ${tierInfo.border}`}>
              <Lock className={`w-3 h-3 mt-0.5 shrink-0 ${tierInfo.text}`} />
              <p className="text-white/50">{tierInfo.privacy}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-center w-full">
        <motion.div className="absolute w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full"
          style={{ background: isDragging ? 'radial-gradient(circle, rgba(92,124,250,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(92,124,250,0.08) 0%, transparent 70%)' }}
          animate={{ scale: isDragging ? 1.2 : [1, 1.03, 1], opacity: isDragging ? 1 : 0.6 }}
          transition={{ duration: isDragging ? 0.3 : 4, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div onClick={handleClick}
          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
          className={`relative z-10 flex flex-col items-center justify-center w-[280px] h-[280px] md:w-[340px] md:h-[340px] rounded-full cursor-pointer select-none transition-all duration-500 ${isDragging ? 'border-2 border-voila-400/70 bg-voila-500/8' : isProcessing ? 'border border-voila-500/40 bg-voila-500/5' : 'border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.03]'}`}
          whileHover={!isProcessing ? { scale: 1.03 } : {}} whileTap={!isProcessing ? { scale: 0.97 } : {}}>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}>
                  <Zap className="w-10 h-10 text-voila-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm text-white/70 font-medium">Analyzing</p>
                  <div className="flex gap-1 justify-center mt-2">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-voila-400"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : isDragging ? (
              <motion.div key="dragging" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-3">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <Sparkles className="w-10 h-10 text-voila-400" />
                </motion.div>
                <p className="text-sm text-voila-300 font-medium">Release to analyze</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <Upload className="w-8 h-8 text-white/35" />
                </motion.div>
                <div className="text-center px-8">
                  <p className="text-[13px] text-white/55 font-light">Drop any file to identify it</p>
                  <p className="text-[11px] text-white/25 mt-1">Images · Code · 3D · Audio · Executables · Archives · Data</p>
                  <p className="text-[10px] text-white/20 mt-2">or click to browse</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
