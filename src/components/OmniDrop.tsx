import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Zap, Shield, Cpu, Server } from 'lucide-react';

interface OmniDropProps {
  onFileDrop: (file: File) => void;
  isProcessing: boolean;
  tier?: string;
}

export default function OmniDrop({ onFileDrop, isProcessing, tier = 'tier1' }: OmniDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [, setDragCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCount(c => c + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCount(c => {
      const next = c - 1;
      if (next <= 0) setIsDragging(false);
      return Math.max(0, next);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCount(0);
    const files = e.dataTransfer.files;
    if (files.length > 0) onFileDrop(files[0]);
  }, [onFileDrop]);

  const handleClick = () => {
    if (!isProcessing) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileDrop(files[0]);
      e.target.value = '';
    }
  };

  // Get tier badge info
  const tierInfo = {
    tier1: { icon: Cpu, label: 'Browser', color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', text: 'text-green-400' },
    tier2: { icon: Server, label: 'Docker', color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    tier3: { icon: Shield, label: 'Firecracker', color: 'from-red-500/20 to-pink-500/10', border: 'border-red-500/20', text: 'text-red-400' },
  }[tier] || { icon: Cpu, label: 'Browser', color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', text: 'text-green-400' };

  const TierIcon = tierInfo.icon;

  return (
    <div className="relative flex items-center justify-center w-full">
      {/* Ambient glow ring with enhanced breathing */}
      <motion.div
        className="absolute w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full"
        style={{
          background: isDragging
            ? 'radial-gradient(circle, rgba(92,124,250,0.2) 0%, transparent 70%)'
            : isProcessing
              ? 'radial-gradient(circle, rgba(92,124,250,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(92,124,250,0.08) 0%, transparent 70%)',
        }}
        animate={{
          scale: isDragging ? 1.2 : isProcessing ? [1, 1.08, 1] : [1, 1.03, 1],
          opacity: isDragging ? 1 : isProcessing ? 0.9 : 0.6,
        }}
        transition={{
          duration: isDragging ? 0.3 : 4,
          repeat: isProcessing ? Infinity : Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Tier indicator badge */}
      <AnimatePresence>
        {tier !== 'tier1' && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute -top-12 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${tierInfo.color} border ${tierInfo.border}`}
          >
            <TierIcon className={`w-3 h-3 ${tierInfo.text}`} />
            <span className={`text-[10px] ${tierInfo.text} font-medium`}>{tierInfo.label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main dropzone */}
      <motion.div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative z-10 flex flex-col items-center justify-center
          w-[280px] h-[280px] md:w-[340px] md:h-[340px]
          rounded-full cursor-pointer select-none
          transition-all duration-500
          ${isDragging
            ? 'border-2 border-voila-400/70 glow bg-voila-500/8'
            : isProcessing
              ? 'border border-voila-500/40 bg-voila-500/5'
              : 'border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.03] hover:bg-white/[0.05]'
          }
        `}
        whileHover={!isProcessing ? { scale: 1.03 } : {}}
        whileTap={!isProcessing ? { scale: 0.97 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="w-10 h-10 text-voila-400" />
              </motion.div>
              <div className="text-center">
                <p className="text-sm text-white/70 font-medium">Analyzing</p>
                <motion.div
                  className="flex gap-1 justify-center mt-2"
                  initial="hidden"
                  animate="visible"
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-voila-400"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          ) : isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Sparkles className="w-10 h-10 text-voila-400" />
              </motion.div>
              <p className="text-sm text-voila-300 font-medium">Release to analyze</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                className="relative"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Upload className="w-8 h-8 text-white/35" />
              </motion.div>
              <div className="text-center px-8">
                <p className="text-[13px] text-white/55 font-light">
                  Drop any file
                </p>
                <p className="text-[11px] text-white/25 mt-1">
                  or click to browse
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
