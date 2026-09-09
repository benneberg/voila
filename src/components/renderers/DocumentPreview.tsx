import { useState, useEffect, useRef } from 'react';
import { FileText, AlertTriangle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, Loader2 } from 'lucide-react';
import type { ProcessingResult } from '../../lib/fileProcessor';

export function DocumentPreview({ result }: { result: ProcessingResult }) {
  const isPdf = String(result.metadata.format).includes('pdf');

  if (isPdf) {
    return <PDFViewer result={result} />;
  }

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="w-20 h-24 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center border border-orange-500/20">
        <FileText className="w-10 h-10 text-orange-400" />
      </div>
      <div className="text-center">
        <p className="text-sm text-white/60">{String(result.metadata.format)} Document</p>
        <p className="text-[11px] text-white/30 mt-1">{String(result.metadata.note || '')}</p>
      </div>
    </div>
  );
}

export function PDFViewer({ result }: { result: ProcessingResult }) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState('1');
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPdfJs = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).pdfjsLib) {
        setPdfjsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
      script.type = 'module';
      script.onload = () => {
        const workerScript = document.createElement('script');
        workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
        workerScript.onload = () => setPdfjsLoaded(true);
        document.head.appendChild(workerScript);
      };
      document.head.appendChild(script);
    };

    loadPdfJs();
  }, []);

  useEffect(() => {
    if (!pdfjsLoaded || !result.content) return;

    const loadPdf = async () => {
      try {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadingTask = (window as any).pdfjsLib.getDocument(result.content);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        await renderPage(pdf, 1, 1.0);
        setLoading(false);
      } catch (err) {
        setError('Failed to load PDF');
        setLoading(false);
      }
    };
    loadPdf();
  }, [pdfjsLoaded, result.content]);

  const renderPage = async (pdf: any, pageNum: number, scaleVal: number) => {
    if (!canvasRef.current) return;
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: scaleVal });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
    } catch (err) {
      console.error('Render error:', err);
    }
  };

  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages && pdfDoc) {
      setCurrentPage(page);
      setPageInput(String(page));
      await renderPage(pdfDoc, page, scale);
    }
  };

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput);
      if (!isNaN(page)) goToPage(page);
    }
  };

  const zoom = async (direction: 'in' | 'out') => {
    const newScale = direction === 'in' ? Math.min(scale + 0.25, 3) : Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    if (pdfDoc) await renderPage(pdfDoc, currentPage, newScale);
  };

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-surface-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 text-white/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 text-[11px] text-white/40">
            <input
              type="text"
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              onKeyDown={handlePageInput}
              className="w-10 bg-black/30 rounded px-1.5 py-0.5 text-center text-white/60"
            />
            <span>/ {totalPages}</span>
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 text-white/50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => zoom('out')} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/50">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-white/30 min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoom('in')} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/50">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => { setScale(1.0); goToPage(1); }} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/50">
            <RotateCcw className="w-4 h-4" />
          </button>
          <a href={result.content} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/50">
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex items-center justify-center bg-surface-2 min-h-[400px] overflow-auto p-4">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 border-2 border-voila-500/30 border-t-voila-500 rounded-full animate-spin" />
            <span className="text-[11px] text-white/30">Loading PDF...</span>
          </div>
        )}
        {error && (
          <div className="text-center text-white/40">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-warning" />
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && (
          <canvas ref={canvasRef} className="max-w-full shadow-2xl" />
        )}
      </div>

      {/* Metadata */}
      <div className="px-4 py-2 border-t border-white/[0.06] bg-surface-1 flex gap-4 text-[10px] text-white/30">
        <span>Page {currentPage} of {totalPages}</span>
        {result.metadata.pdfVersion && <span>v{String(result.metadata.pdfVersion)}</span>}
        {result.metadata.encryption && <span>{String(result.metadata.encryption)}</span>}
        {result.metadata.linearized && <span>Linearized</span>}
      </div>
    </div>
  );
}
