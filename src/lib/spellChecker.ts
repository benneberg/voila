// ─── Levenshtein Distance (no external dep) ───
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const KNOWN_EXTENSIONS = [
  // Documents
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'md', 'tex', 'csv',
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'psd',
  // Audio
  'mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma',
  // Video
  'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm',
  // Code
  'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'c', 'cpp', 'h', 'hpp',
  'go', 'rs', 'rb', 'php', 'swift', 'kt', 'cs', 'r', 'lua', 'sh',
  // Config / Data
  'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'env',
  // Web
  'html', 'css', 'scss', 'less',
  // Archives
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
  // Executables
  'exe', 'msi', 'dmg', 'app', 'deb', 'rpm', 'bat', 'cmd',
  // Database
  'sql', 'sqlite', 'db',
  // Other
  'log', 'iso', 'img', 'bin',
];

export interface SpellCheckResult {
  valid: boolean;
  extension: string;
  suggestions: string[];
  message: string;
}

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

  const distances = KNOWN_EXTENSIONS
    .map(known => ({ ext: known, distance: levenshtein(ext, known) }))
    .sort((a, b) => a.distance - b.distance);

  const suggestions = distances
    .filter(d => d.distance <= 2)
    .slice(0, 3)
    .map(d => `${basename}.${d.ext}`);

  return {
    valid: false,
    extension: ext,
    suggestions,
    message: suggestions.length > 0
      ? `Did you mean: ${suggestions.map(s => s.split('.').pop()).join(', ')}?`
      : `Unknown extension: .${ext}`,
  };
}
