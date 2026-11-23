import React from 'react';
import {
  Disc3,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatTimeSeconds, useMusic } from '../services/musicService';
import type { PageId } from '../types/universe';

export const GlobalMusicBar: React.FC<{
  onOpenPage: (page: PageId) => void;
}> = ({ onOpenPage }) => {
  const {
    publishedTracks,
    activeDisplayTrack,
    isPlaying,
    isBuffering,
    needsSoundUnlock,
    playbackStatusLabel,
    currentTime,
    duration,
    volume,
    unlockAudio,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
  } = useMusic();

  if (!activeDisplayTrack) {
    return null;
  }

  return (
    <aside
      aria-label="Pemutar Musik Global"
      className="fixed bottom-0 left-0 right-0 z-30 glass-nav border-t border-[#263C59]/10 dark:border-white/10"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2.5 sm:gap-3">
        {/* Info Lagu */}
        <button
          type="button"
          onClick={() => onOpenPage('music')}
          className="flex items-center gap-2 min-w-0 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB] rounded-lg pr-1"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-[#263C59]/10 dark:bg-white/10 shrink-0 relative flex items-center justify-center">
            {activeDisplayTrack.thumbnailUrl ? (
              <img
                src={activeDisplayTrack.thumbnailUrl}
                alt={activeDisplayTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <Disc3 className="w-4 h-4 text-[#263C59] dark:text-[#FFB6CB]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-[#263C59] dark:text-white truncate group-hover:underline">
              {activeDisplayTrack.title}
            </p>
            <p className="text-[10px] sm:text-[11px] text-[#263C59]/70 dark:text-slate-300 truncate">
              {playbackStatusLabel}
            </p>
          </div>
        </button>

        {/* Kontrol Pemutaran + Fallback Suara Kecil jika Diblokir Browser */}
        <div className="flex items-center gap-1.5 shrink-0">
          {needsSoundUnlock && (
            <button
              type="button"
              onClick={unlockAudio}
              className="px-2.5 py-1.5 rounded-full bg-[#FFB6CB] text-[#263C59] text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-[#ffa5bf] transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <VolumeX className="w-3.5 h-3.5 shrink-0" />
              <span>Aktifkan Suara</span>
            </button>
          )}

          {publishedTracks.length > 0 && (
            <button
              type="button"
              onClick={prevTrack}
              aria-label="Lagu sebelumnya"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#263C59] dark:text-slate-200 hover:bg-[#263C59]/10 dark:hover:bg-white/10 transition-colors"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={
              needsSoundUnlock
                ? 'Aktifkan suara musik'
                : isPlaying
                  ? 'Jeda musik'
                  : 'Lanjutkan musik'
            }
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] shadow-sm hover:opacity-90 transition-opacity"
          >
            {isBuffering ? (
              <Music className="w-4 h-4" />
            ) : isPlaying && !needsSoundUnlock ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          {publishedTracks.length > 0 && (
            <button
              type="button"
              onClick={nextTrack}
              aria-label="Lagu berikutnya"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#263C59] dark:text-slate-200 hover:bg-[#263C59]/10 dark:hover:bg-white/10 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Progres & Volume (Desktop) */}
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-md">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] font-mono tabular-nums text-[#263C59]/70 dark:text-slate-300 w-9 text-right">
              {formatTimeSeconds(currentTime)}
            </span>
            <input
              type="range"
              aria-label="Posisi durasi lagu"
              min={0}
              max={duration > 0 ? Math.floor(duration) : 100}
              value={duration > 0 ? Math.min(Math.floor(currentTime), Math.floor(duration)) : 0}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full accent-[#263C59] dark:accent-[#FFB6CB] h-1.5 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono tabular-nums text-[#263C59]/70 dark:text-slate-300 w-9">
              {formatTimeSeconds(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 w-28 shrink-0">
            <Volume2 className="w-4 h-4 text-[#263C59]/70 dark:text-slate-300 shrink-0" />
            <input
              type="range"
              aria-label="Volume musik"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-[#263C59] dark:accent-[#FFB6CB] h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
