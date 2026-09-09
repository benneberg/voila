import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Wand2, ImageIcon } from 'lucide-react';
import type { ProcessingResult } from '../../lib/fileProcessor';

export function VideoPreview({ result }: { result: ProcessingResult }) {
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
