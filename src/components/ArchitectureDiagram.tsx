import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Layers, Shield, Cpu, Cloud, Server, Zap, Globe, Database, Lock, DollarSign } from 'lucide-react';

export default function ArchitectureDiagram() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTier, setActiveTier] = useState<number | null>(null);

  const tiers = [
    {
      id: 0,
      label: 'Tier 0',
      title: 'Pre-Flight Intelligence',
      icon: Shield,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      cost: '$0',
      latency: '~0ms',
      tech: ['Magic Number Detection', 'File Size Validation', 'Spell Checking', 'Rate Limiting (localStorage)'],
      description: 'Client-side checks before any file touches the network. Zero cost, instant feedback.',
    },
    {
      id: 1,
      label: 'Tier 1',
      title: 'Browser Processing (WASM)',
      icon: Cpu,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      cost: '$0',
      latency: '~100ms',
      tech: ['ffmpeg.wasm', 'Pyodide', 'PDF.js', 'Monaco Editor', 'libvips-wasm', 'Video.js'],
      description: 'Full file processing in the browser via WebAssembly. Images, video, audio, Python scripts, documents.',
    },
    {
      id: 2,
      label: 'Tier 2',
      title: 'Cloud Gateway (Docker)',
      icon: Cloud,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      cost: '$0.001',
      latency: '~1s',
      tech: ['FastAPI', 'Redis + SlowAPI', 'Apache Tika', 'Pydantic Validation', 'Prometheus'],
      description: 'Ephemeral Docker containers for complex scripting, data parsing, and text manipulation.',
    },
    {
      id: 3,
      label: 'Tier 3',
      title: 'Firecracker Micro-VMs',
      icon: Server,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      cost: '$0.10',
      latency: '~150ms boot',
      tech: ['AWS Firecracker', 'WebRTC Streaming', 'Air-Gapped Network', 'Warm VM Pool', 'Spot Instances'],
      description: 'Isolated micro-VMs for executables and suspicious files. No outbound internet. Only WebRTC stream out.',
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mt-12">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 glass rounded-xl hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-voila-400" />
          <span className="text-sm text-white/60 font-medium">System Architecture</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {/* The Flow */}
              <div className="glass rounded-xl p-5">
                <h3 className="text-xs font-medium text-white/50 mb-4 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-voila-400" />
                  The Voilà Pipeline
                </h3>
                <div className="flex items-center justify-between text-[10px] text-white/30 mb-6">
                  <span>FILE DROP</span>
                  <span>→</span>
                  <span>PRE-FLIGHT</span>
                  <span>→</span>
                  <span>ROUTE</span>
                  <span>→</span>
                  <span>PROCESS</span>
                  <span>→</span>
                  <span>RENDER</span>
                </div>

                {/* Tier cards */}
                <div className="space-y-2">
                  {tiers.map((tier) => {
                    const Icon = tier.icon;
                    const isActive = activeTier === tier.id;

                    return (
                      <motion.div
                        key={tier.id}
                        onClick={() => setActiveTier(isActive ? null : tier.id)}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all
                          ${isActive ? `${tier.bg} ${tier.border}` : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'}
                        `}
                        layout
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg ${tier.bg} flex items-center justify-center`}>
                              <Icon className={`w-3.5 h-3.5 ${tier.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono ${tier.color}`}>{tier.label}</span>
                                <span className="text-xs text-white/60">{tier.title}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-white/20 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />{tier.cost}
                            </span>
                            <span className="text-white/20">{tier.latency}</span>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="text-[11px] text-white/40 mt-3 mb-2">{tier.description}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {tier.tech.map(t => (
                                  <span
                                    key={t}
                                    className={`text-[9px] px-2 py-0.5 rounded-full ${tier.bg} ${tier.border} border ${tier.color} opacity-70`}
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Key Principles */}
              <div className="grid grid-cols-3 gap-2">
                <div className="glass rounded-xl p-3 text-center">
                  <Globe className="w-4 h-4 text-voila-400 mx-auto mb-1.5" />
                  <p className="text-[10px] text-white/40 font-medium">Zero-Trust</p>
                  <p className="text-[9px] text-white/20 mt-0.5">Verify every byte</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <Lock className="w-4 h-4 text-voila-400 mx-auto mb-1.5" />
                  <p className="text-[10px] text-white/40 font-medium">Air-Gapped VMs</p>
                  <p className="text-[9px] text-white/20 mt-0.5">No outbound network</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <Database className="w-4 h-4 text-voila-400 mx-auto mb-1.5" />
                  <p className="text-[10px] text-white/40 font-medium">~$123/mo</p>
                  <p className="text-[9px] text-white/20 mt-0.5">Full production cost</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
