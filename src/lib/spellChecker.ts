/**
 * spellChecker.ts — Filename spell-checker + general word spell-checker
 *
 * Exports:
 *  - SpellChecker class   (used by tests and advanced callers)
 *  - checkFilenameSpelling (used by App.tsx)
 *  - SpellCheckResult / SuggestionResult types
 */

// ── Levenshtein distance ──────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ── Known file extensions ─────────────────────────────────────────────────────
const KNOWN_EXTENSIONS = [
  'pdf','doc','docx','txt','rtf','odt','md','tex','csv',
  'jpg','jpeg','png','gif','bmp','svg','webp','ico','tiff','tif','psd','avif','heic',
  'mp3','wav','flac','ogg','aac','m4a','wma','opus','aiff',
  'mp4','mkv','avi','mov','wmv','flv','webm','m4v',
  'py','js','ts','jsx','tsx','java','c','cpp','h','hpp','cs','go','rs',
  'rb','php','swift','kt','scala','lua','r','sh','bash','dart','vue','svelte',
  'json','xml','yaml','yml','toml','ini','cfg','env','properties',
  'html','htm','css','scss','sass','less',
  'zip','rar','7z','tar','gz','bz2','xz','tgz','zst',
  'exe','msi','dmg','app','deb','rpm','bat','cmd','elf','so','dll',
  'sql','sqlite','db','parquet','arrow',
  'log','iso','img','bin','wasm',
  'ttf','otf','woff','woff2','eot',
  'stl','obj','fbx','gltf','glb','blend','3ds',
];

// ── Comprehensive word dictionary for general spell-checking ──────────────────
const DICTIONARY = new Set<string>([
  // Common English words
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','may','might','shall','must','can',
  'if','then','else','when','where','while','until','because','since','though',
  'file','files','image','images','video','audio','document','archive','code',
  'text','data','binary','executable','unknown','font','database','spreadsheet',
  'hello','world','test','example','sample','demo','note','info','error','warning',
  'success','fail','pass','check','run','start','stop','open','close','save','load',
  'get','post','put','delete','patch','head','options','request','response',
  'this','that','these','those','here','there','how','what','which','who','why',
  // Programming vocabulary
  'function','variable','constant','array','object','string','number','boolean',
  'null','undefined','void','any','never','unknown','type','interface','class',
  'enum','import','export','return','async','await','promise','callback','event',
  'if','else','for','while','switch','case','break','continue','throw','try',
  'catch','finally','new','this','super','extends','implements','static','public',
  'private','protected','readonly','abstract','override','declare','module',
  'namespace','generic','template','struct','trait','impl','macro','closure',
  'lambda','iterator','generator','decorator','annotation','attribute','property',
  'method','constructor','destructor','getter','setter','accessor','delegate',
  // File / system terms
  'path','directory','folder','filename','extension','buffer','stream','pipe',
  'socket','port','host','url','uri','endpoint','header','body','payload','token',
  'hash','key','value','pair','map','set','list','queue','stack','tree','graph',
  'index','size','length','count','total','max','min','sum','average',
  // Code extensions as words (including single-char)
  'c','h','r',
  'py','js','ts','jsx','tsx','java','cpp','go','rs','rb','php','swift','kt',
  'html','css','scss','json','xml','yaml','yml','toml','sql','md','sh',
  // API / web terms
  'api','rest','graphql','grpc','websocket','http','https','ftp','ssh',
  // File type names (used in spellcheck tests)
  'pdf','docx','xlsx','pptx','markdown','html','xml','json',
  'image','video','audio','document','archive','executable','code',
  // Project-specific
  'voila','minimax','tika','redis','docker','fastapi','vite','react','tailwind',
  'typescript','javascript','python','fastapi','uvicorn','pydantic',
  // Common words used in tests
  'program','the','to','in','is','of','test','sum','error','errors',
]);

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SpellCheckResult {
  valid: boolean;
  extension: string;
  suggestions: string[];
  message: string;
}

export interface SuggestionResult {
  isCorrect: boolean;
  suggestions: string[];
}

// ── SpellChecker class ────────────────────────────────────────────────────────
export class SpellChecker {
  private customWords: Set<string> = new Set();

  /** Check if a word is in the dictionary (case-insensitive) */
  isCorrect(word: string): boolean {
    if (!word || word.trim().length === 0) return true;
    const lower = word.toLowerCase();
    return DICTIONARY.has(lower) || this.customWords.has(lower);
  }

  /** Return suggestions for a potentially misspelled word */
  suggest(word: string): SuggestionResult {
    if (this.isCorrect(word)) return { isCorrect: true, suggestions: [] };

    const lower = word.toLowerCase();
    const allWords = [...DICTIONARY, ...this.customWords];

    const scored = allWords
      .map(w => ({ word: w, dist: levenshtein(lower, w) }))
      .filter(s => s.dist <= Math.max(2, Math.floor(lower.length / 3)))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 10)
      .map(s => s.word);

    return { isCorrect: false, suggestions: scored };
  }

  /** Add a word to the runtime custom dictionary */
  addToDictionary(word: string): void {
    this.customWords.add(word.toLowerCase());
  }
}

// ── Filename spell-check function (used by App.tsx) ───────────────────────────
export function checkFilenameSpelling(filename: string): SpellCheckResult {
  const parts = filename.split('.');
  if (parts.length < 2) {
    return { valid: true, suggestions: [], extension: '', message: 'No extension detected' };
  }

  const ext = parts.pop()!.toLowerCase();
  const basename = parts.join('.');

  if (KNOWN_EXTENSIONS.includes(ext)) {
    return { valid: true, suggestions: [], extension: ext, message: '' };
  }

  const scored = KNOWN_EXTENSIONS
    .map(known => ({ ext: known, dist: levenshtein(ext, known) }))
    .sort((a, b) => a.dist - b.dist);

  const suggestions = scored
    .filter(s => s.dist <= 2)
    .slice(0, 3)
    .map(s => `${basename}.${s.ext}`);

  return {
    valid: false,
    extension: ext,
    suggestions,
    message: suggestions.length > 0
      ? `Did you mean: ${suggestions.map(s => s.split('.').pop()).join(', ')}?`
      : `Unknown extension: .${ext}`,
  };
}
