import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Database, FileCode, Info, ShieldCheck, Clock, Layers } from 'lucide-react';
import type { ProcessingResult } from '../lib/fileProcessor';
import type { FileTypeResult } from '../lib/preflight';
import type { SpellCheckResult } from '../lib/spellChecker';
import { formatBytes } from '../lib/preflight';

interface ExpertPanelProps {
  result: ProcessingResult;
  fileTypeResult: FileTypeResult;
  spellCheckResult: SpellCheckResult;
  file: File;
  tier: string;
}

export default function ExpertPanel({ result, fileTypeResult, spellCheckResult, file, tier }: ExpertPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'metadata' | 'security' | 'diagnostics'>('metadata');

  const tabs = [
    { id: 'metadata' as const, label: 'Metadata', icon: Database },
    { id: 'security' as const, label: 'Security', icon: ShieldCheck },
    { id: 'diagnostics' as const, label: 'Diagnostics', icon: FileCode },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-3xl mx-auto mt-6"
    >
      {/* Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 glass rounded-xl hover:bg-white/[0.04] transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs text-white/40 font-medium">Expert Panel</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-voila-500/10 text-voila-400 border border-voila-500/20">
            {Object.keys(result.metadata).length} fields
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-xl mt-2 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-white/[0.06]">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors
                        ${activeTab === tab.id
                          ? 'text-voila-400 border-b border-voila-400 bg-voila-500/5'
                          : 'text-white/30 hover:text-white/50'
                        }
                      `}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="p-4">
                {activeTab === 'metadata' && (
                  <MetadataTab result={result} file={file} />
                )}
                {activeTab === 'security' && (
                  <SecurityTab fileTypeResult={fileTypeResult} spellCheckResult={spellCheckResult} tier={tier} />
                )}
                {activeTab === 'diagnostics' && (
                  <DiagnosticsTab result={result} fileTypeResult={fileTypeResult} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MetadataTab({ result, file }: { result: ProcessingResult; file: File }) {
  return (
    <div className="space-y-3">
      {/* File Identity */}
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2 flex items-center gap-1.5">
          <Info className="w-3 h-3" /> File Identity
        </h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <MetaRow label="Name" value={file.name} />
          <MetaRow label="Size" value={formatBytes(file.size)} />
          <MetaRow label="MIME" value={file.type || 'Not declared'} />
          <MetaRow label="Last Modified" value={new Date(file.lastModified).toLocaleDateString()} />
        </div>
      </div>

      {/* Extracted Metadata */}
      <div className="border-t border-white/[0.06] pt-3">
        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2 flex items-center gap-1.5">
          <Database className="w-3 h-3" /> Extracted Properties
        </h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {Object.entries(result.metadata).map(([key, value]) => (
            <MetaRow key={key} label={formatLabel(key)} value={String(value)} />
          ))}
        </div>
      </div>

      {/* Processing Info */}
      <div className="border-t border-white/[0.06] pt-3">
        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2 flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Performance
        </h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <MetaRow label="Processing Time" value={`${result.processingTime.toFixed(1)}ms`} />
          <MetaRow label="Content Type" value={result.type} />
          {result.linesOfCode && <MetaRow label="Lines of Code" value={String(result.linesOfCode)} />}
          {result.language && <MetaRow label="Language" value={result.language} />}
        </div>
      </div>
    </div>
  );
}

function SecurityTab({ fileTypeResult, spellCheckResult, tier }: {
  fileTypeResult: FileTypeResult;
  spellCheckResult: SpellCheckResult;
  tier: string;
}) {
  return (
    <div className="space-y-3">
      {/* Threat Assessment */}
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Threat Assessment</h4>
        <div className={`
          p-3 rounded-lg border text-xs
          ${fileTypeResult.isSuspicious
            ? 'bg-danger/5 border-danger/20 text-danger/80'
            : 'bg-success/5 border-success/20 text-success/80'
          }
        `}>
          {fileTypeResult.isSuspicious
            ? `⚠️ MISMATCH DETECTED: ${fileTypeResult.warningMessage}`
            : '✓ No file type mismatch detected. Extension matches magic bytes.'
          }
        </div>
      </div>

      {/* Filename Analysis */}
      <div className="border-t border-white/[0.06] pt-3">
        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Filename Analysis</h4>
        <div className={`
          p-3 rounded-lg border text-xs
          ${spellCheckResult.valid
            ? 'bg-success/5 border-success/20 text-success/80'
            : 'bg-warning/5 border-warning/20 text-warning/80'
          }
        `}>
          {spellCheckResult.valid
            ? `✓ Extension ".${spellCheckResult.extension}" is recognized`
            : `⚠️ Unknown extension ".${spellCheckResult.extension}". ${spellCheckResult.message}`
          }
        </div>
      </div>

      {/* Execution Tier */}
      <div className="border-t border-white/[0.06] pt-3">
        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Sandbox Classification</h4>
        <div className="grid grid-cols-3 gap-2">
          {['tier1', 'tier2', 'tier3'].map(t => (
            <div key={t} className={`
              p-2.5 rounded-lg border text-center text-[11px]
              ${t === tier
                ? t === 'tier1' ? 'bg-success/10 border-success/30 text-success'
                  : t === 'tier2' ? 'bg-warning/10 border-warning/30 text-warning'
                  : 'bg-danger/10 border-danger/30 text-danger'
                : 'bg-white/[0.02] border-white/[0.06] text-white/20'
              }
            `}>
              <div className="font-medium">{t === 'tier1' ? 'Browser' : t === 'tier2' ? 'Docker' : 'Firecracker'}</div>
              <div className="text-[9px] mt-0.5 opacity-60">
                {t === 'tier1' ? '$0 • 0ms' : t === 'tier2' ? '$0.001 • ~1s' : '$0.10 • ~150ms'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Magic Bytes */}
      <div className="border-t border-white/[0.06] pt-3">
        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Magic Bytes (Header)</h4>
        <div className="font-mono text-[11px] text-voila-300 bg-black/30 p-2.5 rounded-lg overflow-x-auto">
          {fileTypeResult.magicBytes}
        </div>
        <p className="text-[10px] text-white/20 mt-1">
          Confidence: <span className={`
            ${fileTypeResult.confidence === 'high' ? 'text-success' : 'text-warning'}
          `}>{fileTypeResult.confidence}</span>
          {fileTypeResult.detectedType && ` • Detected: ${fileTypeResult.detectedType.mime}`}
        </p>
      </div>
    </div>
  );
}

function DiagnosticsTab({ result, fileTypeResult }: { result: ProcessingResult; fileTypeResult: FileTypeResult }) {
  // Extract corruption info if available
  const corruptionInfo = fileTypeResult.corruptionCheck;

  return (
    <div className="space-y-3">
      {/* Processing Pipeline Log */}
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Pipeline Log</h4>
        <div className="font-mono text-[11px] bg-black/30 rounded-lg p-3 space-y-1">
          <LogLine time="0.0" level="info" msg="File received by Pre-Flight module" />
          <LogLine time="0.1" level="info" msg={`Magic number scan: ${fileTypeResult.magicBytes.slice(0, 23)}...`} />
          <LogLine time="0.2" level="info" msg={`Detected: ${fileTypeResult.detectedType?.mime || 'text/plain (fallback)'}`} />
          <LogLine time="0.3" level="info" msg={`Confidence: ${fileTypeResult.confidence}`} />
          {fileTypeResult.isSuspicious && (
            <LogLine time="0.4" level="warn" msg={`TYPE MISMATCH: ${fileTypeResult.warningMessage}`} />
          )}
          {corruptionInfo && (
            <LogLine
              time="0.5"
              level={corruptionInfo.isHealthy ? 'ok' : 'warn'}
              msg={`Integrity: ${corruptionInfo.isHealthy ? 'PASS' : `FAIL (${corruptionInfo.issues.length} issues)`}`}
            />
          )}
          <LogLine
            time={`${(result.processingTime / 1000).toFixed(1)}`}
            level="ok"
            msg={`Processing complete (${result.processingTime.toFixed(1)}ms)`}
          />
        </div>
      </div>

      {/* Integrity Check Details */}
      {corruptionInfo && !corruptionInfo.isHealthy && (
        <div className="border-t border-white/[0.06] pt-3">
          <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Integrity Issues</h4>
          <div className="space-y-1">
            {corruptionInfo.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-warning/80">
                <span className="text-warning">•</span>
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Structure Analysis for code files */}
      {result.type === 'code' && result.metadata.functions !== undefined && (
        <div className="border-t border-white/[0.06] pt-3">
          <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Code Structure Analysis</h4>
          <div className="grid grid-cols-4 gap-2">
            <StatBox label="Functions" value={String(result.metadata.functions)} color="text-voila-400" />
            <StatBox label="Classes" value={String(result.metadata.classes || 0)} color="text-purple-400" />
            <StatBox label="Imports" value={String(result.metadata.importStatements || 0)} color="text-green-400" />
            <StatBox label="Comments" value={String(result.metadata.commentLines || 0)} color="text-white/40" />
          </div>
        </div>
      )}

      {/* Binary Analysis */}
      {result.type === 'binary' || result.type === 'executable' ? (
        <div className="border-t border-white/[0.06] pt-3">
          <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Binary Analysis</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <MetaRow label="Format" value={String(result.metadata.format || 'Unknown')} />
            <MetaRow label="Architecture" value={String(result.metadata.architecture || 'N/A')} />
            {result.metadata.securityLevel && (
              <MetaRow label="Security" value={String(result.metadata.securityLevel)} />
            )}
            <MetaRow label="Execution Tier" value={String(result.metadata.tier || 'Tier 2')} />
          </div>
        </div>
      ) : null}

      {/* Raw Analysis */}
      <div className="border-t border-white/[0.06] pt-3">
        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Raw Output (JSON)</h4>
        <div className="relative">
          <pre className="font-mono text-[10px] text-white/40 bg-black/30 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify({
              fileType: {
                ...fileTypeResult,
                magicBytes: fileTypeResult.magicBytes.slice(0, 64) + '...'
              },
              metadata: result.metadata,
              performance: {
                processingTime: result.processingTime.toFixed(2) + 'ms',
                category: result.type
              }
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[11px] text-white/25">{label}</span>
      <span className="text-[11px] text-white/60 font-mono truncate ml-2 max-w-[200px]">{value}</span>
    </div>
  );
}

function LogLine({ time, level, msg }: { time: string; level: 'info' | 'warn' | 'ok'; msg: string }) {
  const color = level === 'ok' ? 'text-success' : level === 'warn' ? 'text-warning' : 'text-white/40';
  return (
    <div className={`${color}`}>
      <span className="text-white/20">[{time}s]</span>{' '}
      <span className={`uppercase text-[9px] ${color}`}>{level}</span>{' '}
      {msg}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <div className={`${color} text-sm font-mono font-medium`}>{value}</div>
      <div className="text-[9px] text-white/30 mt-0.5">{label}</div>
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}
