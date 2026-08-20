import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  BookOpen,
  HelpCircle,
  X,
  ChevronDown,
  ExternalLink,
  Upload,
  Layers,
  Shield,
  Zap,
  FileCode,
  Eye,
  Terminal,
  Cpu
} from 'lucide-react';

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'manual' | 'faq';

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What file formats does Voila! support?',
    answer: 'Voila! supports 100+ file formats including images (PNG, JPG, GIF, WebP), documents (PDF, DOCX, TXT), code files (Python, JavaScript, TypeScript, Rust, Go), videos (MP4, MOV, AVI), audio (MP3, WAV, FLAC), archives (ZIP, TAR, RAR), 3D models (OBJ, STL, GLTF), and executables (EXE, ELF, DLL).',
    category: 'General'
  },
  {
    question: 'Is my data processed securely?',
    answer: 'Yes. Voila! uses a multi-layered security approach: client-side magic number detection keeps your files local initially, cloud processing uses sandboxed Docker containers, and high-risk files run in isolated Firecracker VMs with no network access. All files are automatically deleted after processing.',
    category: 'Security'
  },
  {
    question: 'How does the tiered processing work?',
    answer: 'Files are automatically routed to the optimal tier: Tier 1 (free, browser-based) handles images, PDFs, and small code files using WebAssembly. Tier 2 (cloud sandbox) processes scripts and complex parsing. Tier 3 (secure VM) handles executables and unknown file types.',
    category: 'Processing'
  },
  {
    question: 'What are the costs for different tiers?',
    answer: 'Tier 1 processing is completely free. Tier 2 costs approximately $0.001 per file. Tier 3 (VM-based processing) costs around $0.10 per file. AI-powered insights cost approximately $0.02 per query. All costs are tracked per IP address with monthly limits.',
    category: 'Billing'
  },
  {
    question: 'How does magic number detection work?',
    answer: 'Instead of relying on file extensions, Voila! reads the first few bytes of each file to identify its true type. This prevents malicious files disguised with misleading extensions (e.g., an executable renamed as a .jpg file).',
    category: 'Technology'
  },
  {
    question: 'What is Expert Mode?',
    answer: 'Expert Mode reveals the technical details hidden beneath the simple interface. Toggle it to see processing pipeline visualizations, cost estimates, deep metadata extraction, and diagnostic information. Useful for developers and power users.',
    category: 'Features'
  },
  {
    question: 'Can I process files without uploading them?',
    answer: 'For common file types like images, PDFs, and small code files, most processing happens locally in your browser using WebAssembly technology. Only complex files requiring sandboxed execution or VM processing are uploaded to the cloud.',
    category: 'Processing'
  },
  {
    question: 'What happens to my files after processing?',
    answer: 'Uploaded files are automatically deleted from our servers after processing completes. Files are never shared with third parties and are only accessible during the active processing session.',
    category: 'Privacy'
  },
  {
    question: 'Why is my file flagged as suspicious?',
    answer: 'Files may be flagged if: the declared extension doesn\'t match the detected magic bytes, they contain patterns associated with potentially malicious code, or they\'re a polyglot file (valid as multiple formats). Suspicious files are still processed but in the highest-security Tier 3 sandbox.',
    category: 'Security'
  },
  {
    question: 'How do I reset the onboarding guide?',
    answer: 'Open the About page and look for the "Reset Onboarding" option at the bottom. This will show the guided tour again when you next visit the app.',
    category: 'Settings'
  }
];

export default function About({ isOpen, onClose }: AboutProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: <Info className="w-4 h-4" /> },
    { id: 'manual' as TabType, label: 'Manual', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'faq' as TabType, label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> }
  ];

  const features = [
    { icon: <Upload className="w-5 h-5" />, title: 'Universal File Support', desc: 'Drop any file, any format' },
    { icon: <Layers className="w-5 h-5" />, title: 'Intelligent Routing', desc: 'Auto-selects optimal processing tier' },
    { icon: <Shield className="w-5 h-5" />, title: 'Sandboxed Security', desc: 'Isolated execution environments' },
    { icon: <Zap className="w-5 h-5" />, title: 'Instant Preview', desc: 'Contextual rendering on upload' },
    { icon: <Eye className="w-5 h-5" />, title: 'Expert Mode', desc: 'Deep diagnostics for power users' },
    { icon: <Cpu className="w-5 h-5" />, title: 'AI Insights', desc: 'Smart code explanations' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-4xl max-h-[90vh] bg-surface-1 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">About Voila!</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-voila-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-voila-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Hero Section */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Super Minimalism Meets Extreme Capability</h3>
                  <p className="text-sm text-white/50 max-w-2xl mx-auto">
                    Voila! is a universal file handler that masks a massively complex, multi-modal distributed system
                    behind a single, ultra-minimalist interface.
                  </p>
                </div>

                {/* Problem it solves */}
                <div className="glass rounded-xl p-6">
                  <h4 className="text-sm font-medium text-voila-400 mb-3">The Problem</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Users often need to quickly inspect or analyze files they don't fully understand.
                    Opening unknown files can be risky, specialized tools are scattered across different
                    applications, and technical details are hidden from casual users who just want results.
                  </p>
                </div>

                {/* Solution */}
                <div className="glass rounded-xl p-6">
                  <h4 className="text-sm font-medium text-voila-400 mb-3">The Solution</h4>
                  <p className="text-sm text-white/70 leading-relaxed mb-4">
                    Drop any file onto Voila! and get instant, contextual understanding. The system handles
                    everything automatically — from identifying file types through magic bytes to routing
                    complex files to appropriate processing environments.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-voila-500/10 text-voila-400 border border-voila-500/20">
                      Drag & Drop
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-voila-500/10 text-voila-400 border border-voila-500/20">
                      Auto-Detection
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-voila-500/10 text-voila-400 border border-voila-500/20">
                      Safe Processing
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-voila-500/10 text-voila-400 border border-voila-500/20">
                      Instant Preview
                    </span>
                  </div>
                </div>

                {/* Target Users */}
                <div className="glass rounded-xl p-6">
                  <h4 className="text-sm font-medium text-voila-400 mb-3">Who It's For</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-voila-500/10 flex items-center justify-center text-voila-400">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-white/80">Developers</p>
                      <p className="text-[10px] text-white/40">Quick code inspection</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-success/10 flex items-center justify-center text-success">
                        <Terminal className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-white/80">Data Scientists</p>
                      <p className="text-[10px] text-white/40">Format conversion</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                        <Shield className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-white/80">Security Researchers</p>
                      <p className="text-[10px] text-white/40">Safe sandbox analysis</p>
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass rounded-lg p-4"
                    >
                      <div className="w-8 h-8 rounded-lg bg-voila-500/10 flex items-center justify-center text-voila-400 mb-3">
                        {feature.icon}
                      </div>
                      <h5 className="text-xs font-medium text-white/80 mb-1">{feature.title}</h5>
                      <p className="text-[10px] text-white/40">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Philosophy */}
                <div className="text-center pt-4 border-t border-white/5">
                  <p className="text-xs text-white/30 italic">
                    "One input, infinite understanding."
                  </p>
                  <p className="text-[10px] text-white/20 mt-2">
                    Simple for everyone. Powerful for experts.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'manual' && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Getting Started */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-voila-500 flex items-center justify-center text-xs text-white">1</span>
                    Getting Started
                  </h3>
                  <div className="glass rounded-xl p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-2">Step 1: Drop a File</h4>
                      <p className="text-xs text-white/50">
                        Drag any file onto the dropzone or click to browse. There's no limit on what you can drop —
                        Voila! handles everything from images to executables.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-2">Step 2: Watch the Magic</h4>
                      <p className="text-xs text-white/50">
                        The system instantly analyzes your file using magic number detection. You'll see the
                        processing pipeline visualize in real-time, showing which tier is handling your file.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-2">Step 3: Get Results</h4>
                      <p className="text-xs text-white/50">
                        Your file renders in the optimal viewer. Toggle Expert Mode for deep metadata,
                        cost tracking, and AI-powered insights.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Core Concepts */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-voila-500 flex items-center justify-center text-xs text-white">2</span>
                    Core Concepts
                  </h3>
                  <div className="space-y-4">
                    <div className="glass rounded-xl p-5">
                      <h4 className="text-sm font-medium text-voila-400 mb-2">Tiered Processing</h4>
                      <p className="text-xs text-white/50 mb-3">
                        Voila! routes files through three processing tiers based on complexity:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success text-xs font-bold">T1</div>
                          <div>
                            <p className="text-xs font-medium text-white/80">Browser (Free)</p>
                            <p className="text-[10px] text-white/40">Images, PDFs, small code files • 100% free</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning text-xs font-bold">T2</div>
                          <div>
                            <p className="text-xs font-medium text-white/80">Cloud Sandbox ($0.001)</p>
                            <p className="text-[10px] text-white/40">Scripts, archives, complex parsing</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-danger/5 border border-danger/20">
                          <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center text-danger text-xs font-bold">T3</div>
                          <div>
                            <p className="text-xs font-medium text-white/80">Secure VM ($0.10)</p>
                            <p className="text-[10px] text-white/40">Executables, unknown files, high-risk content</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-xl p-5">
                      <h4 className="text-sm font-medium text-voila-400 mb-2">Magic Number Detection</h4>
                      <p className="text-xs text-white/50">
                        Instead of trusting file extensions, Voila! reads the first few bytes of each file to
                        determine its true type. This catches malicious files disguised with fake extensions.
                      </p>
                    </div>

                    <div className="glass rounded-xl p-5">
                      <h4 className="text-sm font-medium text-voila-400 mb-2">Expert Mode</h4>
                      <p className="text-xs text-white/50">
                        Toggle Expert Mode using the button in the header to reveal technical details including
                        processing pipeline, cost estimates, metadata extraction, and diagnostic information.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Supported Formats */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-voila-500 flex items-center justify-center text-xs text-white">3</span>
                    Supported Formats
                  </h3>
                  <div className="glass rounded-xl p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      {[
                        { cat: 'Images', formats: 'PNG, JPG, GIF, WebP, SVG, BMP, TIFF' },
                        { cat: 'Documents', formats: 'PDF, DOCX, TXT, MD, RTF, ODT' },
                        { cat: 'Code', formats: 'PY, JS, TS, JAVA, C++, RUST, GO' },
                        { cat: 'Media', formats: 'MP4, MP3, WAV, FLAC, MOV, AVI' },
                        { cat: 'Archives', formats: 'ZIP, TAR, RAR, 7Z, GZ' },
                        { cat: '3D Models', formats: 'OBJ, STL, GLTF, FBX' },
                        { cat: 'Data', formats: 'JSON, XML, CSV, SQL' },
                        { cat: 'Executables', formats: 'EXE, ELF, DLL, APP' }
                      ].map((item, index) => (
                        <div key={index} className="p-3 rounded-lg bg-white/[0.02]">
                          <p className="text-xs font-medium text-voila-400 mb-1">{item.cat}</p>
                          <p className="text-[10px] text-white/30">{item.formats}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Best Practices */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-voila-500 flex items-center justify-center text-xs text-white">4</span>
                    Best Practices
                  </h3>
                  <div className="glass rounded-xl p-5 space-y-3">
                    {[
                      { tip: 'Use Expert Mode for debugging', desc: 'Toggle it to see detailed processing information and cost tracking.' },
                      { tip: 'Watch for suspicious file warnings', desc: 'If a file is flagged, it\'s being processed in the highest-security sandbox.' },
                      { tip: 'Cost-conscious processing', desc: 'Most common files are free. Only complex processing incurs costs.' },
                      { tip: 'Spell-check helps', desc: 'The system catches filename typos and suggests corrections.' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-voila-500/20 flex items-center justify-center text-voila-400 text-xs mt-0.5">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white/80">{item.tip}</p>
                          <p className="text-[10px] text-white/40">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'faq' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Frequently Asked Questions</h3>
                  <span className="text-xs text-white/30">{FAQ_ITEMS.length} questions</span>
                </div>
                {FAQ_ITEMS.map((faq, index) => (
                  <div
                    key={index}
                    className="glass rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-sm font-medium text-white/80 pr-4">{faq.question}</span>
                      <motion.div
                        animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expandedFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-xs text-white/50 leading-relaxed border-t border-white/5 pt-3">
                              {faq.answer}
                            </p>
                            {faq.category && (
                              <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                                {faq.category}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-0 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-white/30">Voila! v1.0.0</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
