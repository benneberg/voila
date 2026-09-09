import type { ProcessingResult } from '../../lib/fileProcessor';

export function DataPreview({ result }: { result: ProcessingResult }) {
  const isJson = result.language === 'json';
  const isCsv = result.language === 'csv';

  if (isJson) {
    try {
      const parsed = JSON.parse(result.content);
      return (
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-voila-500/10 text-voila-400 border border-voila-500/20">
              JSON
            </span>
          </div>
          <div className="p-4 overflow-auto max-h-[400px]">
            <pre className="text-[11px] text-white/60 font-mono whitespace-pre-wrap">
              {JSON.stringify(parsed, null, 2).slice(0, 5000)}
            </pre>
          </div>
        </div>
      );
    } catch {
      // Fall through to raw display
    }
  }

  if (isCsv) {
    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            CSV
          </span>
          {result.metadata.totalRows && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-white/40">
              {String(result.metadata.totalRows)} rows
            </span>
          )}
        </div>
        <div className="p-4 overflow-auto max-h-[400px]">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-white/[0.1]">
                {String(result.metadata.headers || '').split(',').map((h: string, i: number) => (
                  <th key={i} className="px-2 py-1 text-left text-white/40 font-medium">{h.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.content.split('\n').slice(0, 50).map((row: string, i: number) => (
                <tr key={i} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                  {row.split(',').map((cell: string, j: number) => (
                    <td key={j} className="px-2 py-1 text-white/50">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-voila-500/10 text-voila-400 border border-voila-500/20">
          {result.language || 'DATA'}
        </span>
      </div>
      <div className="p-4 overflow-auto max-h-[400px]">
        <pre className="text-[11px] text-white/60 font-mono whitespace-pre-wrap">
          {result.content.slice(0, 10000)}
        </pre>
      </div>
    </div>
  );
}

