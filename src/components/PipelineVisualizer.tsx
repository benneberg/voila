import { motion } from 'framer-motion';
import { Shield, Cpu, Cloud, Server, CheckCircle, Loader2, Gauge, DollarSign } from 'lucide-react';

type Stage = 'idle' | 'preflight' | 'magic' | 'routing' | 'processing' | 'complete';

interface PipelineVisualizerProps {
  stage: Stage;
  tier: string;
  details: {
    spellCheck?: string;
    magicBytes?: string;
    detectedType?: string;
    isSuspicious?: boolean;
    processingTime?: number;
    complexityScore?: number;
    costEstimate?: number;
  };
  showDetails?: boolean;
}

const STAGES = [
  { id: 'preflight', label: 'Pre-Flight', icon: Shield, description: 'Size & spell check' },
  { id: 'magic', label: 'Magic Numbers', icon: Cpu, description: 'Binary signature analysis' },
  { id: 'routing', label: 'Tier Routing', icon: Cloud, description: 'Intelligent dispatch' },
  { id: 'processing', label: 'Processing', icon: Server, description: 'Content analysis' },
  { id: 'complete', label: 'Complete', icon: CheckCircle, description: 'Ready to render' },
];

const stageOrder = ['idle', 'preflight', 'magic', 'routing', 'processing', 'complete'];

export default function PipelineVisualizer({ stage, tier, details, showDetails = true }: PipelineVisualizerProps) {
  const currentIndex = stageOrder.indexOf(stage);

  if (stage === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      {/* Pipeline Steps */}
      <div className="flex items-center justify-between mb-6">
        {STAGES.map((s, i) => {
          const stageIdx = stageOrder.indexOf(s.id);
          const isActive = currentIndex === stageIdx;
          const isComplete = currentIndex > stageIdx;
          const Icon = s.icon;

          return (
            <div key={s.id} className="flex items-center">
              <motion.div
                className="relative flex flex-col items-center"
                animate={{ opacity: isComplete || isActive ? 1 : 0.3 }}
              >
                <motion.div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center
                    ${isComplete
                      ? 'bg-success/20 border border-success/30'
                      : isActive
                        ? 'bg-voila-500/20 border border-voila-400/40'
                        : 'bg-white/5 border border-white/10'
                    }
                  `}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                >
                  {isActive ? (
                    <Loader2 className="w-4 h-4 text-voila-400 animate-spin" />
                  ) : isComplete ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <Icon className="w-4 h-4 text-white/40" />
                  )}
                </motion.div>
                <span className={`
                  text-[10px] mt-1.5 whitespace-nowrap
                  ${isActive ? 'text-voila-300' : isComplete ? 'text-success/70' : 'text-white/30'}
                `}>
                  {s.label}
                </span>
              </motion.div>
              {i < STAGES.length - 1 && (
                <motion.div
                  className={`
                    h-px mx-1 mb-4
                    ${currentIndex > stageIdx + 1 ? 'bg-success/30' : 'bg-white/10'}
                  `}
                  initial={{ width: 8 }}
                  animate={{ width: 'auto' }}
                  style={{ minWidth: '2rem' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Panel with enhanced metrics */}
      <motion.div
        layout
        className="glass rounded-xl p-4 text-xs font-mono space-y-2"
      >
        {/* Complexity and Cost Metrics */}
        {showDetails && details.complexityScore !== undefined && details.costEstimate !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 pb-3 border-b border-white/[0.06] mb-3"
          >
            <div className="flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-voila-400" />
              <span className="text-white/30">complexity:</span>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: '4rem' }}
                >
                  <motion.div
                    className={`h-full rounded-full ${
                      details.complexityScore > 60
                        ? 'bg-danger'
                        : details.complexityScore > 30
                          ? 'bg-warning'
                          : 'bg-success'
                    }`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${details.complexityScore}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </motion.div>
                <span className={`${
                  details.complexityScore > 60
                    ? 'text-danger'
                    : details.complexityScore > 30
                      ? 'text-warning'
                      : 'text-success'
                }`}>
                  {details.complexityScore}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-voila-400" />
              <span className="text-white/30">cost:</span>
              <span className={details.costEstimate === 0 ? 'text-success' : details.costEstimate < 1 ? 'text-warning' : 'text-danger'}>
                {details.costEstimate === 0 ? 'FREE' : `$${details.costEstimate.toFixed(2)}`}
              </span>
            </div>
          </motion.div>
        )}

        {/* Technical Details */}
        {showDetails && (
          <>
            {details.spellCheck && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <span className="text-white/30">spell_check:</span>
                <span className="text-white/60">{details.spellCheck}</span>
              </motion.div>
            )}
            {details.magicBytes && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <span className="text-white/30">magic_bytes:</span>
                <span className="text-voila-300">{details.magicBytes}</span>
              </motion.div>
            )}
            {details.detectedType && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <span className="text-white/30">detected_type:</span>
                <span className="text-white/60">{details.detectedType}</span>
              </motion.div>
            )}
            {details.isSuspicious !== undefined && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <span className="text-white/30">suspicious:</span>
                <span className={details.isSuspicious ? 'text-danger' : 'text-success'}>
                  {details.isSuspicious ? 'true ⚠️' : 'false ✓'}
                </span>
              </motion.div>
            )}
          </>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
          <span className="text-white/30">routed_to:</span>
          <span className={`
            ${tier === 'tier1' ? 'text-success' : tier === 'tier2' ? 'text-warning' : 'text-danger'}
          `}>
            {tier === 'tier1' ? 'Tier 1 — Browser (WASM)' : tier === 'tier2' ? 'Tier 2 — Docker Container' : 'Tier 3 — Firecracker VM'}
          </span>
        </motion.div>
        {details.processingTime !== undefined && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <span className="text-white/30">processing_time:</span>
            <span className="text-white/60">{details.processingTime.toFixed(1)}ms</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
