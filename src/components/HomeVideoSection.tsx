import React from 'react';
import {
  AlertCircle,
  ArrowDown,
  Disc3,
  ExternalLink,
  Music,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useMusic } from '../services/musicService';

interface HomeVideoSectionProps {
  visible: boolean;
  isDark: boolean;
  onScrollToPortals: () => void;
  onOpenSoundtrack: () => void;
}

/**
 * Kontainer Player B — Soundtrack (Sumber audio resmi satu-satunya di website).
 * Secara default memutar Slot 01 dari Our Soundtrack dan terus hidup di latar saat berpindah halaman.
 */
export const HomeVideoSection: React.FC<HomeVideoSectionProps> = ({
  visible,
  isDark,
  onScrollToPortals,
  onOpenSoundtrack,
}) => {
  const {
    playerContainerRef,
    currentTrack,
    isPlaying,
    isMuted,
    needsSoundUnlock,
    playbackStatusLabel,
    playerError,
    unlockAudio,
    togglePlayPause,
  } = useMusic();

  const watchUrl =
    currentTrack?.youtubeUrl ||
    (currentTrack?.videoId ? `https://youtu.be/${currentTrack.videoId}` : 'https://www.youtube.com');

  return (
    <section
      id="home-video-section"
      aria-label="Pemutar lagu utama Our Soundtrack"
      aria-hidden={!visible}
      className={
        visible
          ? `relative py-14 sm:py-20 px-4 sm:px-6 transition-colors duration-300 ${
              isDark
                ? 'bg-gradient-to-b from-[#0D1522] via-[#121d30] to-[#0D1522]'
                : 'bg-gradient-to-b from-[#FFF7F0] via-[#fdebe1]/65 to-[#FFF7F0]'
            }`
          : 'fixed -left-[9999px] -top-[9999px] w-[320px] h-[180px] overflow-hidden opacity-0 pointer-events-none'
      }
    >
      <div className={visible ? 'max-w-5xl mx-auto' : 'w-full h-full'}>
        {visible && (
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#263C59]/65 dark:text-[#FFB6CB] font-semibold">
              Lagu Utama · Our Soundtrack
            </p>
            <h2 className="mt-1.5 font-serif-display text-2xl sm:text-4xl font-bold text-[#263C59] dark:text-white text-balance">
              Melodi Hangat untuk Ityin
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#263C59]/75 dark:text-slate-300">
              Sumber audio resmi website berasal dari daftar lagu Our Soundtrack — dimulai dari lagu pertama pilihan kita.
            </p>
          </div>
        )}

        {/* Kartu Player B (Our Soundtrack) Responsif 16:9 */}
        <div
          className={
            visible
              ? 'glass-panel rounded-3xl p-3 sm:p-5 shadow-2xl border border-white/70 dark:border-white/15'
              : 'w-full h-full'
          }
        >
          {visible && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-full bg-[#FFB6CB]/35 dark:bg-[#FFB6CB]/20 text-[#263C59] dark:text-[#FFB6CB] flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-[#263C59] dark:text-white truncate">
                    {currentTrack
                      ? `Slot ${String(currentTrack.slotIndex).padStart(2, '0')}: ${currentTrack.title}`
                      : 'Our Soundtrack'}
                  </p>
                  <p className="text-[11px] text-[#263C59]/70 dark:text-slate-300 truncate">
                    {currentTrack?.artist ? `${currentTrack.artist} · ` : ''}
                    {playbackStatusLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {needsSoundUnlock && !playerError && (
                  <button
                    type="button"
                    onClick={unlockAudio}
                    className="px-3 py-1.5 rounded-full bg-[#FFB6CB] text-[#263C59] text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:bg-[#ffa2bd] transition-colors"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Aktifkan Suara ♪</span>
                  </button>
                )}

                {!playerError && !needsSoundUnlock && currentTrack && (
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? 'Jeda lagu' : 'Putar lagu'}
                    className="px-3 py-1.5 rounded-full border border-[#263C59]/15 dark:border-white/15 text-xs font-medium text-[#263C59] dark:text-slate-200 hover:bg-[#263C59]/5 dark:hover:bg-white/10 inline-flex items-center gap-1.5 transition-colors"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Putar</span>
                      </>
                    )}
                    {isPlaying && !isMuted && (
                      <Volume2 className="w-3.5 h-3.5 text-[#263C59]/60 dark:text-[#FFB6CB]" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenSoundtrack}
                  className="px-3 py-1.5 rounded-full bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <Disc3 className="w-3.5 h-3.5" />
                  <span>Buka Our Soundtrack</span>
                </button>
              </div>
            </div>
          )}

          {/* Bingkai Video 16:9 — Kontainer playerContainerRef selalu tetap agar audio tidak terputus saat pindah halaman */}
          <div
            className={
              visible
                ? 'relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0c1422] shadow-inner'
                : 'w-full h-full'
            }
          >
            <div ref={playerContainerRef} className="w-full h-full" />

            {visible && playerError && (
              <div
                role="alert"
                className="absolute inset-0 bg-[#0d1626]/92 backdrop-blur-sm flex flex-col items-center justify-center text-center p-3 sm:p-6 text-white overflow-y-auto"
              >
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/20 border border-rose-300/30 text-rose-200 flex items-center justify-center mb-1.5 sm:mb-3 shrink-0">
                  <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <p className="font-serif-display text-sm sm:text-xl font-semibold leading-tight">
                  Lagu Utama Tidak Dapat Diputar dalam Embed
                </p>
                <p className="mt-1 sm:mt-2 max-w-md text-[11px] sm:text-sm text-white/80 leading-snug sm:leading-relaxed">
                  {playerError}
                </p>
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 sm:mt-4 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#FFB6CB] text-[#263C59] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#ffa2bd] transition-colors shrink-0"
                >
                  <span>Tonton di YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {visible && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onScrollToPortals}
              className="px-5 py-2.5 rounded-full border border-[#263C59]/20 dark:border-white/20 text-xs sm:text-sm font-semibold text-[#263C59] dark:text-slate-200 hover:bg-[#263C59]/5 dark:hover:bg-white/10 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Lanjutkan ke Enam Sudut Dunia Kita</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
