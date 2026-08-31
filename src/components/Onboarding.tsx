import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Shield,
  Eye,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  details?: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'drop',
    title: 'Drop Any File',
    description: 'Simply drag and drop any file onto the dropzone. Voila! instantly analyzes it using magic number detection.',
    icon: <Upload className="w-8 h-8" />,
    details: [
      'Supports 100+ file formats',
      'Instant file type detection',
      'No upload required for small files'
    ]
  },
  {
    id: 'magic',
    title: 'Smart Analysis',
    description: 'The system reads the actual file content, not just the extension, to accurately identify any file type.',
    icon: <Sparkles className="w-8 h-8" />,
    details: [
      'Magic number detection',
      'Filename spell-checking',
      'Suspicious file warnings'
    ]
  },
  {
    id: 'tier',
    title: 'Intelligent Routing',
    description: 'Files are automatically routed to the optimal processing tier based on complexity and security risk.',
    icon: <Layers className="w-8 h-8" />,
    details: [
      'Tier 1: Free browser processing',
      'Tier 2: Cloud sandbox for scripts',
      'Tier 3: Secure VM for executables'
    ]
  },
  {
    id: 'preview',
    title: 'Instant Preview',
    description: 'Get immediate contextual rendering with syntax highlighting, metadata extraction, and AI-powered insights.',
    icon: <FileCode className="w-8 h-8" />,
    details: [
      'Syntax-highlighted code',
      'Image and video preview',
      'PDF and document viewer'
    ]
  },
  {
    id: 'expert',
    title: 'Expert Mode',
    description: 'Toggle expert mode to reveal technical details, processing costs, and deep metadata analysis.',
    icon: <Eye className="w-8 h-8" />,
    details: [
      'Processing pipeline visualization',
      'Cost tracking per operation',
      'Deep metadata extraction'
    ]
  },
  {
    id: 'security',
    title: 'Built-in Security',
    description: 'Your files are processed securely with sandboxing, virus scanning, and strict access controls.',
    icon: <Shield className="w-8 h-8" />,
    details: [
      'Sandboxed execution',
      'File corruption detection',
      'Rate limiting & cost controls'
    ]
  }
];

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function Onboarding({ isOpen, onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setDirection(1);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('voila_onboarding_complete', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('voila_onboarding_complete', 'true');
    onSkip();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'Escape') {
      handleSkip();
    }
  };

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl bg-surface-1 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="relative px-8 pt-8 pb-4">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
              aria-label="Close onboarding"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/40">Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
                <span className="text-xs text-voila-400 font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-voila-500 to-voila-400"
                />
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-4">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentStep ? 1 : -1);
                    setCurrentStep(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentStep
                      ? 'w-6 bg-voila-500'
                      : index < currentStep
                        ? 'bg-voila-500/50'
                        : 'bg-white/20 hover:bg-white/30'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-6 min-h-[320px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex flex-col items-center text-center"
              >
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-voila-500/20 to-voila-600/20 border border-voila-500/30 flex items-center justify-center mb-6 text-voila-400">
                  {step.icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-semibold text-white mb-3">{step.title}</h2>

                {/* Description */}
                <p className="text-sm text-white/60 leading-relaxed max-w-md mb-6">
                  {step.description}
                </p>

                {/* Details list */}
                {step.details && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {step.details.map((detail, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50"
                      >
                        <Check className="w-3 h-3 text-success" />
                        {detail}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-surface-0 border-t border-white/5">
            <div className="flex items-center justify-between">
              {/* Previous button */}
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 0
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Previous</span>
              </button>

              {/* Skip button */}
              <button
                onClick={handleSkip}
                className="text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                Skip onboarding
              </button>

              {/* Next / Finish button */}
              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  isLastStep
                    ? 'bg-success hover:bg-success/90 text-white'
                    : 'bg-voila-500 hover:bg-voila-600 text-white'
                }`}
              >
                <span className="text-sm">
                  {isLastStep ? 'Get Started' : 'Next'}
                </span>
                {isLastStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to check if onboarding is needed
export function useOnboarding() {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('voila_onboarding_complete');
    setNeedsOnboarding(!hasCompleted);
    setIsLoading(false);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('voila_onboarding_complete', 'true');
    setNeedsOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('voila_onboarding_complete');
    setNeedsOnboarding(true);
  };

  return { needsOnboarding, isLoading, completeOnboarding, resetOnboarding };
}
