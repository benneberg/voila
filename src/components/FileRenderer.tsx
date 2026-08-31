import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Image, FileText, Music, Video, FileCode, Archive, AlertTriangle, File,
  Box, Type, Database, Table, Cpu, HardDrive,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, FolderOpen,
  Play, Pause, Edit3, Terminal, Save, Loader2, Wand2, Image as ImageIcon, Sparkles,
  Brain, Cloud, Zap
} from 'lucide-react';
import type { ProcessingResult } from '../lib/fileProcessor';
import { voilaApi } from '../lib/api';
import { Model3DViewer } from './Model3DViewer';

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
        {result.type === '3d' && <Model3DViewer result={result} />}
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

// Audio Preview with WaveSurfer.js
function AudioPreview({ result }: { result: ProcessingResult }) {
  const [waveSurferLoaded, setWaveSurferLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [volume, setVolume] = useState(1);
  const waveSurferRef = useRef<any>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadWaveSurfer = async () => {
      if (window.WaveSurfer) {
        setWaveSurferLoaded(true);
        return;
      }

      // Load WaveSurfer.js from CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/wavesurfer.js@7';
      script.onload = () => setWaveSurferLoaded(true);
      document.head.appendChild(script);
    };

    loadWaveSurfer();
  }, []);

  useEffect(() => {
    if (!waveSurferLoaded || !waveformRef.current || !audioRef.current) return;

    const wavesurfer = window.WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4b5563',
      progressColor: '#a78bfa',
      cursorColor: '#a78bfa',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 80,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurfer.load(audioRef.current.src);
    waveSurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      setDuration(formatTime(wavesurfer.getDuration()));
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => setIsPlaying(false));

    return () => {
      wavesurfer.destroy();
    };
  }, [waveSurferLoaded]);

  const togglePlayPause = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.playPause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (waveSurferRef.current) {
      waveSurferRef.current.setVolume(newVolume);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={result.content} preload="metadata" />

      {/* Album Art Placeholder */}
      <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center border border-green-500/20">
        <Music className="w-12 h-12 text-green-400" />
      </div>

      {/* Waveform Visualization */}
      {waveSurferLoaded && (
        <div className="w-full max-w-md px-2">
          <div ref={waveformRef} className="cursor-pointer" />
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center gap-4 w-full max-w-md">
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center hover:bg-green-500/30 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-green-400" />
          ) : (
            <Play className="w-5 h-5 text-green-400 ml-0.5" />
          )}
        </button>

        <div className="flex-1 flex items-center gap-2 text-[11px] text-white/40">
          <span className="w-10 text-right">{currentTime}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500/50 rounded-full transition-all duration-100"
              style={{ width: `${(parseFloat(currentTime.split(':')[0]) * 60 + parseFloat(currentTime.split(':')[1])) / (parseFloat(duration.split(':')[0]) * 60 + parseFloat(duration.split(':')[1])) * 100}%` }}
            />
          </div>
          <span className="w-10">{duration}</span>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] mt-2">
        <MetadataRow label="Duration" value={String(result.metadata.duration)} />
        <MetadataRow label="Format" value={String(result.metadata.format).replace('audio/', '').toUpperCase()} />
        <MetadataRow label="Bitrate" value={String(result.metadata.bitrate)} />
        <MetadataRow label="Codec" value={String(result.metadata.codec)} />
      </div>
    </div>
  );
}

// Declare global WaveSurfer type
declare global {
  interface Window {
    WaveSurfer?: any;
  }
}

// Video Preview with Thumbnail Extraction
function VideoPreview({ result }: { result: ProcessingResult }) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const extractThumbnails = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsExtracting(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;

    const thumbs: string[] = [];
    const thumbCount = 6;

    for (let i = 0; i < thumbCount; i++) {
      // Seek to different positions
      const time = (video.duration / thumbCount) * i;
      video.currentTime = time;

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
    }

    setThumbnails(thumbs);
    setSelectedThumb(0);
    setIsExtracting(false);
  };

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return;

    try {
      // Load FFmpeg WASM from CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/umd/ffmpeg.js';
      script.onload = async () => {
        const { FFmpeg } = (window as any).ffmpeg || {};
        if (FFmpeg) {
          const ffmpeg = new FFmpeg();
          await ffmpeg.load();
          ffmpegRef.current = ffmpeg;
          setFfmpegLoaded(true);
        }
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
    }
  }, []);

  useEffect(() => {
    loadFFmpeg();
  }, [loadFFmpeg]);

  return (
    <div className="bg-black">
      {/* Hidden canvas for thumbnail extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Player */}
      <video
        ref={videoRef}
        controls
        className="w-full max-h-[500px]"
        preload="metadata"
        onLoadedMetadata={() => {
          // Auto-extract thumbnails on load
          extractThumbnails();
        }}
        onError={(e) => {
          const video = e.target as HTMLVideoElement;
          video.style.display = 'none';
          video.parentElement!.innerHTML = '<div class="p-8 text-center text-white/40 text-sm">Failed to load video</div>';
        }}
      >
        <source src={result.content} />
        Your browser does not support video playback.
      </video>

      {/* Thumbnail Strip */}
      {thumbnails.length > 0 && (
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[10px] text-white/40">Scene Thumbnails</span>
            </div>
            <button
              onClick={extractThumbnails}
              disabled={isExtracting}
              className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/50 transition-colors disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3" />
                  Refresh
                </>
              )}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {thumbnails.map((thumb, i) => (
              <button
                key={i}
                onClick={() => setSelectedThumb(i)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedThumb === i ? 'border-voila-400' : 'border-transparent hover:border-white/20'
                }`}
              >
                <img
                  src={thumb}
                  alt={`Scene ${i + 1}`}
                  className="h-16 w-auto object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="px-4 py-3 bg-surface-1 border-t border-white/[0.06] flex flex-wrap gap-4 text-[10px] text-white/40">
        <span>Duration: {String(result.metadata.duration)}</span>
        <span>Resolution: {String(result.metadata.resolution)}</span>
        <span>Codec: {String(result.metadata.codec)}</span>
        <span>Bitrate: {String(result.metadata.bitrate)}</span>
        {ffmpegLoaded && (
          <span className="text-voila-400/50">FFmpeg Ready</span>
        )}
      </div>
    </div>
  );
}

function DocumentPreview({ result }: { result: ProcessingResult }) {
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

function PDFViewer({ result }: { result: ProcessingResult }) {
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

function DataPreview({ result }: { result: ProcessingResult }) {
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


function FontPreview({ result }: { result: ProcessingResult }) {
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

function DatabasePreview({ result }: { result: ProcessingResult }) {
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

function SpreadsheetPreview({ result }: { result: ProcessingResult }) {
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

function ArchivePreview({ result }: { result: ProcessingResult }) {
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

function ExecutablePreview({ result }: { result: ProcessingResult }) {
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

function BinaryPreview({ result }: { result: ProcessingResult }) {
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

function UnknownPreview({ result }: { result: ProcessingResult }) {
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

function MetadataRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/30">{label}</span>
      <span className="text-white/60">{String(value)}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Legacy syntax highlighter for non-Monaco use cases
function highlightSyntax(line: string, language: string): React.ReactNode {
  const keywords: Record<string, RegExp[]> = {
    javascript: [/\b(function|const|let|var|import|export|from|return|if|else|for|while|class|async|await|try|catch|finally|throw|new|this|true|false|null|undefined)\b/g],
    python: [/\b(def|class|import|from|return|if|else|for|while|try|except|finally|raise|with|as|lambda|yield|True|False|None|self|and|or|not|in|is)\b/g],
    rust: [/\b(fn|let|mut|const|struct|impl|trait|enum|match|use|mod|pub|return|if|else|for|while|loop|try|catch|unsafe|async|await|move|self|Self)\b/g],
    go: [/\b(func|var|const|type|struct|interface|package|import|return|if|else|for|switch|case|default|defer|go|chan|select|range|true|false|nil)\b/g],
    sql: [/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT)\b/gi],
  };

  const keywordRegexes = keywords[language] || keywords.javascript;
  const allKeywords = new RegExp(keywordRegexes.map(r => r.source).join('|'), 'g');

  const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g;

  const trimmed = line.trimStart();
  if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
    return <span className="text-white/20 italic">{line}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const allMatches: Array<{ index: number; length: number; type: 'keyword' | 'string' }> = [];

  let m: RegExpExecArray | null;
  while ((m = allKeywords.exec(line)) !== null) {
    allMatches.push({ index: m.index, length: m[0].length, type: 'keyword' });
  }
  allKeywords.lastIndex = 0;

  const stringRegex = new RegExp(strings.source, 'g');
  while ((m = stringRegex.exec(line)) !== null) {
    allMatches.push({ index: m.index, length: m[0].length, type: 'string' });
  }

  allMatches.sort((a, b) => a.index - b.index);

  for (const match of allMatches) {
    if (match.index < lastIndex) continue;
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    const text = line.slice(match.index, match.index + match.length);
    if (match.type === 'keyword') {
      parts.push(<span key={match.index} className="text-voila-400">{text}</span>);
    } else {
      parts.push(<span key={match.index} className="text-green-400/70">{text}</span>);
    }
    lastIndex = match.index + match.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : line;
}
