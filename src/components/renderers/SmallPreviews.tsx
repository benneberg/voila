import { Archive, AlertTriangle, Type, Database, Table, Cpu, HardDrive } from 'lucide-react';
import type { ProcessingResult } from '../../lib/fileProcessor';
import { formatBytes } from '../../utils/format';
import { highlightSyntax } from './shared';

export function FontPreview({ result }: { result: ProcessingResult }) {
  const fontType = String(result.metadata.fontType || result.metadata.format);

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
        <Type className="w-12 h-12 text-amber-400" />
      </div>

      <div className="text-center">
        <p className="text-sm text-white/60">{fontType}</p>
        <p className="text-[11px] text-white/30 mt-1">Font File</p>
      </div>

      <div className="p-4 glass rounded-lg">
        <p className="text-2xl text-white/80">The quick brown fox</p>
        <p className="text-lg text-white/60">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
        <p className="text-sm text-white/40">abcdefghijklmnopqrstuvwxyz 0123456789</p>
      </div>
    </div>
  );
}

export function DatabasePreview({ result }: { result: ProcessingResult }) {
  const isSqlScript = result.language === 'sql';
  const format = String(result.metadata.format);

  if (isSqlScript) {
    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
            SQL
          </span>
          {result.metadata.statements && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-white/40">
              {String(result.metadata.statements)} statements
            </span>
          )}
        </div>
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full">
            <tbody>
              {result.content.split('\n').filter((l: string) => l.trim()).slice(0, 100).map((line: string, i: number) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-0.5 text-right text-[11px] text-white/15 select-none font-mono w-10 sticky left-0 bg-surface-1">
                    {i + 1}
                  </td>
                  <td className="px-3 py-0.5 text-[11px] text-white/60 font-mono">
                    {highlightSyntax(line, 'sql')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 flex items-center justify-center border border-teal-500/20">
        <Database className="w-12 h-12 text-teal-400" />
      </div>

      <div className="text-center">
        <p className="text-sm text-white/60">{format}</p>
        {result.metadata.verified && (
          <p className="text-[11px] text-white/30 mt-1">
            Header Verified: {String(result.metadata.verified)}
          </p>
        )}
      </div>

      <div className="text-[10px] text-white/20">
        {String(result.metadata.note || 'Database requires dedicated viewer')}
      </div>
    </div>
  );
}

export function SpreadsheetPreview({ result }: { result: ProcessingResult }) {
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-lime-500/20 to-green-500/10 flex items-center justify-center border border-lime-500/20">
        <Table className="w-12 h-12 text-lime-400" />
      </div>

      <div className="text-center">
        <p className="text-sm text-white/60">{String(result.metadata.format || 'Spreadsheet')}</p>
        <div className="flex gap-3 justify-center mt-1 text-[10px] text-white/30">
          {result.metadata.rows && <span>{String(result.metadata.rows)} rows</span>}
          {result.metadata.columns && <span>{String(result.metadata.columns)} cols</span>}
        </div>
      </div>

      <div className="text-[10px] text-white/20">
        {String(result.metadata.note || 'Spreadsheet preview requires cloud processing')}
      </div>
    </div>
  );
}

export function ArchivePreview({ result }: { result: ProcessingResult }) {
  const format = String(result.metadata.format || result.metadata.archiveType || 'Archive');
  const likelyFormat = result.metadata.likelyFormat;

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 flex items-center justify-center border border-yellow-500/20">
        <Archive className="w-12 h-12 text-yellow-400" />
      </div>

      <div className="text-center">
        <p className="text-sm text-white/60">{format}</p>
        {likelyFormat && (
          <p className="text-[11px] text-voila-400 mt-1">Contains: {String(likelyFormat)}</p>
        )}
        {result.metadata.contains && (
          <p className="text-[10px] text-white/30">{String(result.metadata.contains)}</p>
        )}
      </div>

      <div className="text-[10px] text-white/20">
        {String(result.metadata.note || 'Archive extraction requires cloud processing')}
      </div>
    </div>
  );
}

export function ExecutablePreview({ result }: { result: ProcessingResult }) {
  const isDangerous = String(result.metadata.securityLevel || '').includes('HIGH');

  return (
    <div className={`p-6 text-center ${isDangerous ? 'bg-danger/5' : ''}`}>
      <div className={`
        w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center
        ${isDangerous
          ? 'bg-danger/10 border border-danger/20'
          : 'bg-warning/10 border border-warning/20'
        }
      `}>
        {isDangerous ? (
          <AlertTriangle className="w-10 h-10 text-danger" />
        ) : (
          <Cpu className="w-10 h-10 text-warning" />
        )}
      </div>

      <p className="text-sm text-white/60 font-medium">{String(result.metadata.format)}</p>
      <div className="flex items-center justify-center gap-2 mt-1">
        <span className="text-[10px] text-white/30">{String(result.metadata.architecture)}</span>
        {result.metadata.size && (
          <>
            <span className="text-white/10">•</span>
            <span className="text-[10px] text-white/30">{formatBytes(Number(result.metadata.size))}</span>
          </>
        )}
      </div>

      {isDangerous && (
        <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
          <div className="flex items-center justify-center gap-2 text-danger text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Security Warning</span>
          </div>
          <p className="text-[10px] text-danger/70">{String(result.metadata.warning)}</p>
          <p className="text-[10px] text-white/30 mt-1">{String(result.metadata.note)}</p>
        </div>
      )}
    </div>
  );
}

export function BinaryPreview({ result }: { result: ProcessingResult }) {
  const isDangerous = String(result.metadata.securityLevel || '').includes('HIGH');

  return (
    <div className={`p-6 text-center ${isDangerous ? 'bg-danger/5' : ''}`}>
      <div className={`
        w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center
        ${isDangerous
          ? 'bg-danger/10 border border-danger/20'
          : 'bg-warning/10 border border-warning/20'
        }
      `}>
        {isDangerous ? (
          <AlertTriangle className="w-8 h-8 text-danger" />
        ) : (
          <HardDrive className="w-8 h-8 text-warning" />
        )}
      </div>
      <p className="text-sm text-white/60 font-medium">{String(result.metadata.format)} File</p>
      {isDangerous && (
        <p className="text-xs text-danger/70 mt-2">
          {String(result.metadata.securityLevel)}
        </p>
      )}
      <p className="text-[10px] text-white/20 mt-3">
        Routed to: {String(result.metadata.tier || 'Tier 2')}
      </p>
    </div>
  );
}

export function UnknownPreview({ result }: { result: ProcessingResult }) {
  return (
    <div className="p-6 text-center">
      <AlertTriangle className="w-10 h-10 text-white/20 mx-auto mb-3" />
      <p className="text-sm text-white/40">Unknown file format</p>
      <p className="text-[11px] text-white/20 mt-1">{String(result.metadata.note || 'Requires deep analysis')}</p>
      <div className="mt-4 text-[10px] text-white/20">
        Size: {formatBytes(Number(result.metadata.size) || 0)}
      </div>
    </div>
  );
}
