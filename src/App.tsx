import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Zap, Gauge, Eye, EyeOff, Info, HelpCircle } from 'lucide-react';
import OmniDrop from './components/OmniDrop';
import PipelineVisualizer from './components/PipelineVisualizer';
import FileRenderer from './components/FileRenderer';
import ExpertPanel from './components/ExpertPanel';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import Onboarding, { useOnboarding } from './components/Onboarding';
import About from './components/About';
import { detectTrueFileType, determineTier, getFileCategory, formatBytes } from './lib/preflight';
import { checkFilenameSpelling } from './lib/spellChecker';
import { processFile } from './lib/fileProcessor';
import type { FileTypeResult } from './lib/preflight';
import type { SpellCheckResult } from './lib/spellChecker';
import type { ProcessingResult } from './lib/fileProcessor';

type PipelineStage = 'idle' | 'preflight' | 'magic' | 'routing' | 'processing' | 'complete';

// Tier costs in cents
const TIER_COSTS = { tier1: 0, tier2: 0.1, tier3: 10 };

interface PipelineDetails {
  spellCheck?: string;
  magicBytes?: string;
  detectedType?: string;
  isSuspicious?: boolean;
  processingTime?: number;
  complexityScore?: number;
  costEstimate?: number;
}

export default function App() {
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [tier, setTier] = useState<string>('tier1');
  const [details, setDetails] = useState<PipelineDetails>({});
  const [fileTypeResult, setFileTypeResult] = useState<FileTypeResult | null>(null);
  const [spellCheckResult, setSpellCheckResult] = useState<SpellCheckResult | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expertMode, setExpertMode] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const processingRef = useRef(false);

  // Onboarding state
  const { needsOnboarding, isLoading: isOnboardingLoading, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding on first visit
  useEffect(() => {
    if (!isOnboardingLoading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [isOnboardingLoading, needsOnboarding]);

  // Calculate complexity score based on file characteristics
  const calculateComplexity = useCallback((f: File, tierType: string): number => {
    let score = 0;
    const ext = f.name.split('.').pop()?.toLowerCase() || '';

    // Base complexity by tier
    if (tierType === 'tier3') score += 50;
    else if (tierType === 'tier2') score += 25;
    else score += 5;

    // Size complexity
    if (f.size > 10 * 1024 * 1024) score += 15;
    else if (f.size > 1 * 1024 * 1024) score += 8;

    // Format complexity
    const complexFormats = ['exe', 'elf', 'dll', 'psd', 'ai', 'dwg', 'blend'];
    if (complexFormats.includes(ext)) score += 20;

    // Code complexity indicator
    const codeFormats = ['py', 'js', 'ts', 'java', 'cpp', 'rs', 'go'];
    if (codeFormats.includes(ext)) score += 10;

    return Math.min(100, score);
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleFileDrop = useCallback(async (droppedFile: File) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setFile(droppedFile);
    setProcessingResult(null);
    setDetails({});

    try {
      // ── Stage 1: Pre-Flight ──
      setStage('preflight');
      const spellResult = checkFilenameSpelling(droppedFile.name);
      setSpellCheckResult(spellResult);
      setDetails(d => ({
        ...d,
        spellCheck: spellResult.valid
          ? `✓ .${spellResult.extension} recognized`
          : `⚠ ${spellResult.message}`
      }));
      await sleep(400);

      // ── Stage 2: Magic Number Detection ──
      setStage('magic');
      const typeResult = await detectTrueFileType(droppedFile);
      setFileTypeResult(typeResult);
      setDetails(d => ({
        ...d,
        magicBytes: typeResult.magicBytes,
        detectedType: typeResult.detectedType?.mime || 'text/plain (fallback)',
        isSuspicious: typeResult.isSuspicious,
      }));
      await sleep(400);

      // ── Stage 3: Tier Routing ──
      setStage('routing');
      const detectedMime = typeResult.detectedType?.mime || droppedFile.type;
      const assignedTier = determineTier(droppedFile, detectedMime);
      setTier(assignedTier);

      // Calculate complexity and cost
      const complexity = calculateComplexity(droppedFile, assignedTier);
      const cost = TIER_COSTS[assignedTier as keyof typeof TIER_COSTS];

      setDetails(d => ({
        ...d,
        complexityScore: complexity,
        costEstimate: cost,
      }));
      await sleep(300);

      // ── Stage 4: Processing ──
      setStage('processing');
      const ext = typeResult.detectedType?.ext || droppedFile.name.split('.').pop()?.toLowerCase() || '';
      const category = getFileCategory(ext, detectedMime || '');
      const result = await processFile(droppedFile, category);
      setProcessingResult(result);
      setDetails(d => ({ ...d, processingTime: result.processingTime }));
      await sleep(200);

      // ── Stage 5: Complete ──
      setStage('complete');
    } catch (err) {
      console.error('Processing error:', err);
      setStage('complete');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [calculateComplexity]);

  const handleReset = () => {
    setStage('idle');
    setFile(null);
    setTier('tier1');
    setDetails({});
    setFileTypeResult(null);
    setSpellCheckResult(null);
    setProcessingResult(null);
    setIsProcessing(false);
    processingRef.current = false;
  };

  const isComplete = stage === 'complete' && processingResult;

  return (
    <div className="min-h-screen bg-surface-0 text-white relative overflow-hidden">
      {/* Ambient background with enhanced breathing glow */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-voila-500/[0.02] blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-voila-600/[0.015] blur-3xl"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10">
        {/* Header with mode toggle */}
        <motion.header
          className="pt-8 pb-4 px-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.div
                key="header-full"
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4 text-voila-400 opacity-60" />
                  </motion.div>
                  <motion.h1
                    className="text-xl font-light tracking-wide text-gradient"
                    whileHover={{ scale: 1.02 }}
                  >
                    Voilà
                  </motion.h1>
                  <button
                    onClick={() => setShowAbout(true)}
                    className="ml-2 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                    aria-label="About Voila!"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[12px] text-white/25 font-light max-w-sm mx-auto leading-relaxed">
                  One input, infinite understanding
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="header-mini"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between max-w-3xl mx-auto"
              >
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  New file
                </button>
                <div className="flex items-center gap-3">
                  {/* Complexity Score Badge */}
                  {details.complexityScore !== undefined && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1.5 px-2 py-1 glass rounded-full"
                    >
                      <Gauge className="w-3 h-3 text-voila-400" />
                      <span className="text-[10px] text-white/50">
                        Complexity: <span className="text-voila-400 font-medium">{details.complexityScore}%</span>
                      </span>
                    </motion.div>
                  )}
                  {/* Expert Mode Toggle */}
                  <button
                    onClick={() => setExpertMode(!expertMode)}
                    className={`flex items-center gap-1.5 px-2 py-1 glass rounded-full transition-colors ${
                      expertMode ? 'text-voila-400' : 'text-white/30 hover:text-white/50'
                    }`}
                  >
                    {expertMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span className="text-[10px]">{expertMode ? 'Expert' : 'Simple'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-voila-400 opacity-40" />
                  <span className="text-xs text-white/20 font-light">Voilà</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Main Content */}
        <main className="px-4 pb-12">
          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.div
                key="drop-view"
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                {/* Omni-Drop Zone */}
                <div className="mt-8 md:mt-16">
                  <OmniDrop onFileDrop={handleFileDrop} isProcessing={isProcessing} tier={tier} />
                </div>

                {/* File info badge with cost indicator */}
                <AnimatePresence>
                  {file && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 flex items-center gap-3 px-3 py-1.5 glass rounded-full"
                    >
                      <span className="text-[11px] text-white/50 truncate max-w-[200px]">{file.name}</span>
                      <span className="text-[10px] text-white/20">{formatBytes(file.size)}</span>
                      {details.costEstimate !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          details.costEstimate === 0
                            ? 'bg-success/10 text-success'
                            : details.costEstimate < 1
                              ? 'bg-warning/10 text-warning'
                              : 'bg-danger/10 text-danger'
                        }`}>
                          {details.costEstimate === 0 ? 'Free' : `$${details.costEstimate.toFixed(2)}`}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pipeline Visualizer */}
                <div className="w-full px-4">
                  <PipelineVisualizer
                    stage={stage}
                    tier={tier}
                    details={details}
                    showDetails={expertMode}
                  />
                </div>

                {/* Architecture (shown only when idle) */}
                {stage === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full max-w-3xl mx-auto px-4"
                  >
                    {/* Philosophy callout */}
                    <div className="mt-12 mb-4">
                      <div className="glass rounded-xl p-6 text-center">
                        <p className="text-xs text-white/30 leading-relaxed max-w-lg mx-auto">
                          <span className="text-voila-400 font-medium">Super minimalism</span> meets{' '}
                          <span className="text-voila-400 font-medium">extreme capability</span>.
                          Drop any file — the system identifies, isolates, processes, and renders it
                          through intelligent tiered routing. What you see is simple.
                          What happens underneath is not.
                        </p>
                      </div>
                    </div>

                    {/* Supported formats hint */}
                    <div className="flex flex-wrap justify-center gap-1.5 mt-4 mb-2">
                      {['Images', 'Code', 'Audio', 'Video', 'PDFs', 'Archives', 'Executables', 'Data'].map(cat => (
                        <motion.span
                          key={cat}
                          whileHover={{ scale: 1.05 }}
                          className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.03] text-white/20 border border-white/[0.05]"
                        >
                          {cat}
                        </motion.span>
                      ))}
                    </div>

                    <ArchitectureDiagram />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="result-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-4"
              >
                {/* File Renderer */}
                <FileRenderer result={processingResult!} fileName={file!.name} />

                {/* Expert Panel - Only shown in expert mode */}
                {expertMode && fileTypeResult && spellCheckResult && (
                  <ExpertPanel
                    result={processingResult!}
                    fileTypeResult={fileTypeResult}
                    spellCheckResult={spellCheckResult}
                    file={file!}
                    tier={tier}
                  />
                )}

                {/* Drop another file */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 flex justify-center"
                >
                  <div className="relative">
                    <OmniDropMini onFileDrop={handleFileDrop} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer with tier status */}
        <footer className="fixed bottom-0 inset-x-0 py-3 text-center pointer-events-none">
          <motion.p
            className="text-[10px] text-white/10"
            animate={{ opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Project Voilà — Tier 0 Pre-Flight Active • Client-Side Processing Only
          </motion.p>
        </footer>

        {/* Onboarding Modal */}
        <Onboarding
          isOpen={showOnboarding}
          onComplete={() => {
            completeOnboarding();
            setShowOnboarding(false);
          }}
          onSkip={() => {
            completeOnboarding();
            setShowOnboarding(false);
          }}
        />

        {/* About Modal */}
        <About isOpen={showAbout} onClose={() => setShowAbout(false)} />
      </div>
    </div>
  );
}

// Mini drop zone for after results are shown
function OmniDropMini({ onFileDrop }: { onFileDrop: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) onFileDrop(e.dataTransfer.files[0]);
  };

  return (
    <motion.div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      className="flex items-center gap-2 px-4 py-2 glass rounded-full cursor-pointer hover:bg-white/[0.04] transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={e => {
          if (e.target.files?.[0]) {
            onFileDrop(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />
      <span className="text-[11px] text-white/25">Drop another file or click to browse</span>
    </motion.div>
  );
}
