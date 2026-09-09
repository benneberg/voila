import { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause } from 'lucide-react';
import type { ProcessingResult } from '../../lib/fileProcessor';
import { MetadataRow } from './shared';

export function AudioPreview({ result }: { result: ProcessingResult }) {
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