import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Image, FileText, Music, Video, FileCode, Archive, AlertTriangle, File,
  Box, Type, Database, Table, Cpu, HardDrive, ZoomIn, ZoomOut, RotateCcw, Download, FolderOpen,
  Play, Edit3, Terminal, Save, Loader2, Sparkles,
  Brain, Cloud, Zap
} from 'lucide-react';
import type { ProcessingResult } from '../lib/fileProcessor';
import { voilaApi } from '../lib/api';
// PERF-001: Three.js (119KB gzip) lazy-loaded — only downloads when a 3D file is dropped
const Model3DViewer = React.lazy(() =>
  import('./Model3DViewer').then(m => ({ default: m.Model3DViewer }))
);
// QUAL-001: Extracted sub-renderers
import { AudioPreview } from './renderers/AudioPreview';
import { VideoPreview } from './renderers/VideoPreview';
import { DocumentPreview } from './renderers/DocumentPreview';
import { DataPreview } from './renderers/DataPreview';
import {
  FontPreview, DatabasePreview, SpreadsheetPreview,
  ArchivePreview, ExecutablePreview, BinaryPreview, UnknownPreview
} from './renderers/SmallPreviews';

interface FileRendererProps {
  result: ProcessingResult;
  fileName: string;
}

export default function FileRenderer({ result, fileName }: FileRendererProps) {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    voilaApi.checkHealth().then((health) => {
      setBackendStatus(health ? 'online' : 'offline');
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Backend Status Indicator */}
      <div className="flex items-center justify-end mb-2">
        <div className={`flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-full ${
          backendStatus === 'online'
            ? 'bg-green-500/10 text-green-400/70 border border-green-500/20'
            : backendStatus === 'offline'
            ? 'bg-white/5 text-white/30 border border-white/10'
            : 'bg-white/5 text-white/20 border border-white/10'
        }`}>
          {backendStatus === 'online' ? (
            <>
              <Cloud className="w-3 h-3" />
              <span>Backend Connected</span>
            </>
          ) : backendStatus === 'offline' ? (
            <>
              <Zap className="w-3 h-3" />
              <span>Client-Only Mode</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Checking...</span>
            </>
          )}
        </div>
      </div>

      {/* File Title */}
      <div className="flex items-center gap-3 mb-4">
        <FileIcon type={result.type} />
        <div>
          <h2 className="text-sm font-medium text-white/80 truncate max-w-md">{fileName}</h2>
          <p className="text-[11px] text-white/30">
            {result.type} • {result.processingTime.toFixed(0)}ms
            {result.language && <span className="ml-2 text-voila-400/50">({result.language})</span>}
          </p>
        </div>
      </div>

      {/* Render Area */}
      <div className="glass rounded-xl overflow-hidden">
        {result.type === 'image' && <ImagePreview result={result} fileName={fileName} />}
        {result.type === 'code' && <CodePreview result={result} fileName={fileName} />}
        {result.type === 'audio' && <AudioPreview result={result} />}
        {result.type === 'video' && <VideoPreview result={result} />}
        {result.type === 'document' && <DocumentPreview result={result} />}
        {result.type === 'data' && <DataPreview result={result} />}
        {result.type === '3d' && (
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-white/40 text-sm">Loading 3D viewer…</div>}>
            <Model3DViewer result={result} />
          </Suspense>
        )}
        {result.type === 'font' && <FontPreview result={result} />}
        {result.type === 'database' && <DatabasePreview result={result} />}
        {result.type === 'spreadsheet' && <SpreadsheetPreview result={result} />}
        {result.type === 'archive' && <ArchivePreview result={result} />}
        {result.type === 'executable' && <ExecutablePreview result={result} />}
        {result.type === 'binary' && <BinaryPreview result={result} />}
        {result.type === 'unknown' && <UnknownPreview result={result} />}
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20"
        >
          <div className="flex items-center gap-2 text-warning text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Processing Warnings</span>
          </div>
          <ul className="text-[11px] text-white/50 space-y-0.5">
            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}

function FileIcon({ type }: { type: string }) {
  const iconClass = "w-5 h-5";
  switch (type) {
    case 'image': return <Image className={`${iconClass} text-pink-400`} />;
    case 'code': return <FileCode className={`${iconClass} text-voila-400`} />;
    case 'audio': return <Music className={`${iconClass} text-green-400`} />;
    case 'video': return <Video className={`${iconClass} text-purple-400`} />;
    case 'document': return <FileText className={`${iconClass} text-orange-400`} />;
    case 'data': return <Table className={`${iconClass} text-cyan-400`} />;
    case '3d': return <Box className={`${iconClass} text-indigo-400`} />;
    case 'font': return <Type className={`${iconClass} text-amber-400`} />;
    case 'database': return <Database className={`${iconClass} text-teal-400`} />;
    case 'spreadsheet': return <Table className={`${iconClass} text-lime-400`} />;
    case 'archive': return <Archive className={`${iconClass} text-yellow-400`} />;
    case 'executable': return <Cpu className={`${iconClass} text-red-400`} />;
    case 'binary': return <HardDrive className={`${iconClass} text-gray-400`} />;
    case 'unknown': return <AlertTriangle className={`${iconClass} text-red-400`} />;
    default: return <File className={`${iconClass} text-white/40`} />;
  }
}

function ImagePreview({ result, fileName = "" }: { result: ProcessingResult; fileName?: string }) {
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const ext = String(result.metadata.format || '').replace('image/', '');

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleReset = () => setScale(1);

  return (
    <div className="relative">
      {/* Metadata Bar */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
        <div className="flex gap-2">
          {result.metadata.width && result.metadata.height && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-white/60 backdrop-blur-sm">
              {result.metadata.width}x{result.metadata.height}
            </span>
          )}
          {result.metadata.format && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-white/60 backdrop-blur-sm">
              {ext.toUpperCase()}
            </span>
          )}
          {result.metadata.megapixels && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-white/60 backdrop-blur-sm">
              {String(result.metadata.megapixels)}MP
            </span>
          )}
        </div>
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-black/40 text-white/60 backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] px-2 text-white/60 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-black/40 text-white/60 backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-black/40 text-white/60 backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg bg-black/40 text-white/60 backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <a
            href={result.content}
            download={fileName}
            className="p-1.5 rounded-lg bg-black/40 text-white/60 backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
            onClick={() => setIsFullscreen(false)}
          >
            <span className="text-2xl">&times;</span>
          </button>
          <img
            src={result.content}
            alt="Fullscreen"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      )}

      {/* Image container with zoom */}
      <div
        ref={containerRef}
        className="min-h-[200px] flex items-center justify-center bg-black"
        style={{ minHeight: '200px' }}
      >
        <img
          src={result.content}
          alt="Preview"
          className="max-w-full max-h-[500px] object-contain transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = '<div class="text-white/40 text-sm">Failed to load image</div>';
          }}
        />
      </div>

      {/* EXIF Data */}
      {result.metadata.ColorSpace && (
        <div className="border-t border-white/[0.06] px-4 py-2 flex gap-4 text-[10px] text-white/30">
          <span>Color: {String(result.metadata.ColorSpace)}</span>
          <span>Alpha: {String(result.metadata.hasAlpha)}</span>
          <span>Megapixels: {String(result.metadata.megapixels)}MP</span>
        </div>
      )}
    </div>
  );
}

// Monaco Editor Component with Code Editing and IntelliSense
function CodePreview({ result, fileName }: { result: ProcessingResult; fileName: string }) {
  const content = result.content;
  const language = result.language || 'plaintext';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [, setEditorInstance] = useState<any>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);

  // Check backend availability on mount
  useEffect(() => {
    voilaApi.checkHealth().then((health) => {
      setIsBackendAvailable(health !== null);
    });
  }, []);

  // Load Monaco Editor
  useEffect(() => {
    const loadMonaco = async () => {
      if (window.monaco) {
        setMonacoLoaded(true);
        return;
      }

      // Load Monaco from CDN
      const loaderScript = document.createElement('script');
      loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
      loaderScript.onload = () => {
        (window as any).require.config({
          paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
        });
        (window as any).require(['vs/editor/editor.main'], () => {
          window.monaco = (window as any).monaco;
          setMonacoLoaded(true);
        });
      };
      document.head.appendChild(loaderScript);
    };

    loadMonaco();
  }, []);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!monacoLoaded || !editorRef.current || !window.monaco) return;

    // Map our language names to Monaco language IDs
    const languageMap: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      rust: 'rust',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      ruby: 'ruby',
      php: 'php',
      swift: 'swift',
      kotlin: 'kotlin',
      sql: 'sql',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      markdown: 'markdown',
      shell: 'shell',
      bash: 'shell',
      plaintext: 'plaintext',
    };

    const monacoLang = languageMap[language] || 'plaintext';

    // Define custom dark theme matching our design
    window.monaco.editor.defineTheme('voila-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'a78bfa' },
        { token: 'string', foreground: '4ade80' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: '60a5fa' },
        { token: 'function', foreground: 'c084fc' },
        { token: 'variable', foreground: 'f9fafb' },
      ],
      colors: {
        'editor.background': '#0a0a0f',
        'editor.foreground': '#f9fafb',
        'editor.lineHighlightBackground': '#1f1f2e',
        'editor.selectionBackground': '#a78bfa33',
        'editorCursor.foreground': '#a78bfa',
        'editorLineNumber.foreground': '#4b5563',
        'editorLineNumber.activeForeground': '#9ca3af',
      },
    });

    const editor = window.monaco.editor.create(editorRef.current, {
      value: editedContent,
      language: monacoLang,
      theme: 'voila-dark',
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      tabSize: 2,
      readOnly: !isEditing,
      renderLineHighlight: 'line',
      padding: { top: 12, bottom: 12 },
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      parameterHints: { enabled: true },
      folding: true,
      glyphMargin: false,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: false,
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
    });

    monacoRef.current = window.monaco;
    setEditorInstance(editor);

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      setEditedContent(editor.getValue());
    });

    return () => {
      editor.dispose();
    };
  }, [monacoLoaded]);

  const handleSave = useCallback(() => {
    // Create a blob and trigger download
    const blob = new Blob([editedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setIsEditing(false);
  }, [editedContent, fileName]);

  const handleAIExplain = useCallback(async () => {
    if (isExplaining || !isBackendAvailable) return;

    setIsExplaining(true);
    setAiExplanation(null);

    try {
      const response = await voilaApi.analyzeCode(editedContent, language);
      if (response.success) {
        setAiExplanation(response.explanation);
      } else {
        setAiExplanation('Failed to analyze code. Please try again.');
      }
    } catch (error) {
      setAiExplanation('Network error. Make sure the backend is running.');
    } finally {
      setIsExplaining(false);
    }
  }, [editedContent, language, isExplaining, isBackendAvailable]);

  const languageDisplay = language === 'plaintext' ? 'Plain Text' : language.toUpperCase();
  const hasChanges = editedContent !== content;

  return (
    <div className="relative">
      {/* Language Badge & Actions */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {hasChanges && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">
            Modified
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-voila-500/10 text-voila-400 border border-voila-500/20">
          {languageDisplay}
        </span>
        {result.linesOfCode !== undefined && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-white/40">
            {result.linesOfCode.toLocaleString()} lines
          </span>
        )}
      </div>

      {/* Editor Actions Bar */}
      <div className="border-b border-white/[0.06] px-4 py-2 flex items-center justify-between bg-surface-1">
        <div className="flex gap-4 text-[10px] text-white/30">
          {result.metadata.functions !== undefined && (
            <span className="text-voila-400/60">Functions: {String(result.metadata.functions)}</span>
          )}
          {result.metadata.classes !== undefined && (
            <span className="text-purple-400/60">Classes: {String(result.metadata.classes)}</span>
          )}
          {result.metadata.importStatements !== undefined && (
            <span className="text-green-400/60">Imports: {String(result.metadata.importStatements)}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* AI Explain Button */}
          <button
            onClick={handleAIExplain}
            disabled={isExplaining || !isBackendAvailable}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors ${
              isExplaining
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : aiExplanation
                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isExplaining ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-3 h-3" />
                AI Explain
              </>
            )}
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors ${
              isEditing
                ? 'bg-voila-500/20 text-voila-400 border border-voila-500/30'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.05]'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            {isEditing ? 'Editing' : 'Edit'}
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] bg-success/20 text-success border border-success/30 hover:bg-success/30 transition-colors"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          )}
        </div>
      </div>

      {/* AI Explanation Panel */}
      {aiExplanation && (
        <div className="border-b border-violet-500/20 bg-violet-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-violet-400">AI Code Analysis</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400/50 border border-violet-500/20">
                  Powered by OpenAI
                </span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed whitespace-pre-wrap">{aiExplanation}</p>
            </div>
            <button
              onClick={() => setAiExplanation(null)}
              className="text-white/20 hover:text-white/40 transition-colors"
            >
              <span className="text-lg">&times;</span>
            </button>
          </div>
        </div>
      )}

      {/* Monaco Editor Container */}
      <div className="relative" style={{ height: isEditing ? '500px' : '450px' }}>
        {!monacoLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-2">
            <Loader2 className="w-6 h-6 text-voila-400 animate-spin mb-2" />
            <span className="text-[11px] text-white/30">Loading Editor...</span>
          </div>
        )}
        <div ref={editorRef} className={`w-full h-full ${isEditing ? '' : 'pointer-events-none'}`} />
      </div>

      {/* Python Execution Panel (only for Python files) */}
      {language === 'python' && (
        <PythonExecutor code={editedContent} />
      )}
    </div>
  );
}

// Python Executor with Pyodide
function PythonExecutor({ code }: { code: string }) {
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const pyodideRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current) return true;

    try {
      // Load Pyodide from CDN
      if (!(window as any).loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide'));
          document.head.appendChild(script);
        });
      }

      pyodideRef.current = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      });

      setPyodideLoaded(true);
      return true;
    } catch (err) {
      setError('Failed to load Python runtime');
      return false;
    }
  }, []);

  useEffect(() => {
    loadPyodide();
  }, [loadPyodide]);

  const runCode = async () => {
    if (!pyodideRef.current) {
      const loaded = await loadPyodide();
      if (!loaded) return;
    }

    setIsRunning(true);
    setOutput('');
    setError(null);

    const startTime = performance.now();

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(performance.now() - startTime);
    }, 100);

    try {
      // Capture stdout
      await pyodideRef.current.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      // Run the user's code
      await pyodideRef.current.runPythonAsync(code);

      // Get output
      const stdout = await pyodideRef.current.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await pyodideRef.current.runPythonAsync('sys.stderr.getvalue()');

      if (stderr && !stdout) {
        setError(stderr);
      } else {
        setOutput(stdout || (stderr ? `Warnings:\n${stderr}` : 'No output'));
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime(0);
    }
  };

  return (
    <div className="border-t border-white/[0.06] bg-surface-1">
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[10px] text-white/50 font-medium">Python Console (Pyodide)</span>
          {pyodideLoaded && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400/60 border border-green-500/20">
              Ready
            </span>
          )}
        </div>
        <button
          onClick={runCode}
          disabled={isRunning || !pyodideLoaded}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Running... {elapsedTime > 0 && `(${Math.round(elapsedTime)}ms)`}
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Run Code
            </>
          )}
        </button>
      </div>

      {/* Output */}
      <div className="p-3 font-mono text-[11px] min-h-[80px] max-h-[150px] overflow-auto">
        {error ? (
          <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
        ) : output ? (
          <pre className="text-green-400/80 whitespace-pre-wrap">{output}</pre>
        ) : (
          <span className="text-white/20 italic">Click "Run Code" to execute Python...</span>
        )}
      </div>
    </div>
  );
}

// Declare global types
declare global {
  interface Window {
    monaco?: any;
    loadPyodide?: any;
  }
}