/**
 * src/components/renderers/shared.tsx
 * Shared components and utilities for all preview renderers (QUAL-001)
 */
import React from 'react';
export { formatBytes } from '../../utils/format';

export function MetadataRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/30">{label}</span>
      <span className="text-white/60 text-right break-all">{String(value)}</span>
    </div>
  );
}

export function ProvenanceBadge({ provenance }: { provenance: string }) {
  const styles: Record<string, string> = {
    parsed:    'bg-green-500/10 text-green-400/70 border-green-500/20',
    detected:  'bg-blue-500/10 text-blue-400/70 border-blue-500/20',
    inferred:  'bg-yellow-500/10 text-yellow-400/70 border-yellow-500/20',
    computed:  'bg-purple-500/10 text-purple-400/70 border-purple-500/20',
    simulated: 'bg-red-500/10 text-red-400/70 border-red-500/20',
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${styles[provenance] ?? styles.inferred}`}>
      {provenance}
    </span>
  );
}

export function MetadataSection({ title, provenance, children }: {
  title: string; provenance?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <h4 className="text-[10px] font-medium text-white/20 uppercase tracking-wider">{title}</h4>
        {provenance && <ProvenanceBadge provenance={provenance} />}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function highlightSyntax(line: string, language: string): React.ReactNode {
  const keywords: Record<string, string[]> = {
    javascript: ['function','const','let','var','import','export','from','return','if','else','for','while','class','async','await','try','catch','finally','throw','new','this','true','false','null','undefined'],
    python: ['def','class','import','from','return','if','else','for','while','try','except','finally','raise','with','as','lambda','yield','True','False','None','self','and','or','not','in','is'],
    rust: ['fn','let','mut','const','struct','impl','trait','enum','match','use','mod','pub','return','if','else','for','while','loop','unsafe','async','await','move','self'],
    go: ['func','var','const','type','struct','interface','package','import','return','if','else','for','switch','case','default','defer','go','chan','select','range','true','false','nil'],
    sql: ['SELECT','FROM','WHERE','INSERT','UPDATE','DELETE','CREATE','DROP','ALTER','TABLE','JOIN','ON','AND','OR','NOT','NULL','AS','ORDER','BY','GROUP','HAVING','LIMIT'],
  };
  const kws = keywords[language] ?? keywords.javascript;
  const trimmed = line.trimStart();
  if (trimmed.startsWith('//') || trimmed.startsWith('#')) return <span className="text-white/20 italic">{line}</span>;
  const parts: React.ReactNode[] = [];
  let remaining = line;
  while (remaining.length > 0) {
    const kw = kws.find(k => { const r = new RegExp(`\\b${k}\\b`); return r.test(remaining); });
    if (!kw) { parts.push(remaining); break; }
    const r = new RegExp(`\\b${kw}\\b`);
    const m = r.exec(remaining);
    if (!m) { parts.push(remaining); break; }
    if (m.index > 0) parts.push(remaining.slice(0, m.index));
    parts.push(<span key={parts.length} className="text-voila-400">{kw}</span>);
    remaining = remaining.slice(m.index + kw.length);
  }
  return parts.length > 0 ? <>{parts}</> : line;
}
