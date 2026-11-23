import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Edit3,
  ExternalLink,
  Heart,
  Lock,
  MailOpen,
  Music,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  loadYouTubeIframeApi,
  useMusic,
  type YTPlayer,
} from '../services/musicService';
import type { LoveLetterData } from '../types/universe';

export const LETTER_VIDEO_ID = 't0Bt3a-MLGs';
export const LETTER_VIDEO_URL =
  'https://youtu.be/t0Bt3a-MLGs?si=rgUssLh7QhDaKKHM';
export const LETTER_VIDEO_TITLE =
  'Virgoun - Surat Cinta Untuk Starla (Official MV) | Caitlin Halderman & Jefri Nichol';
export const LETTER_VIDEO_ARTIST = 'Virgoun';
export const LETTER_VIDEO_THUMB = `https://img.youtube.com/vi/${LETTER_VIDEO_ID}/hqdefault.jpg`;

const LETTER_FALLBACK_DAY_BG =
  '/src/assets/images/swiss_sunset_vinyl_bg_1795428587303.jpg';
const LETTER_FALLBACK_NIGHT_BG =
  '/src/assets/images/swiss_night_sky_bg_1795428588118.jpg';

/**
 * Latar Video YouTube (muted) khusus saat amplop "Sebuah Surat Untukmu, Ityin." dibuka.
 * Otomatis fallback ke latar Swiss senja/malam jika YouTube membatasi embedding.
 */
const LetterVideoBackground: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'fallback'>('loading');

  useEffect(() => {
    let cancelled = false;
    let loadingTimeout = 0;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT?.Player) {
        return;
      }

      loadingTimeout = window.setTimeout(() => {
        if (!cancelled) {
          setStatus((prev) => (prev === 'playing' ? prev : 'fallback'));
        }
      }, 5000);

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: LETTER_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          loop: 1,
          playlist: LETTER_VIDEO_ID,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            try {
              event.target.mute();
              event.target.setVolume(0);
              event.target.playVideo();
            } catch {
              setStatus('fallback');
            }
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === 1) {
              try {
                event.target.mute();
                event.target.setVolume(0);
              } catch {
                // Abaikan
              }
              if (loadingTimeout) {
                window.clearTimeout(loadingTimeout);
                loadingTimeout = 0;
              }
              setStatus('playing');
            } else if (event.data === 0) {
              try {
                event.target.mute();
                event.target.setVolume(0);
                event.target.seekTo(0, true);
                event.target.playVideo();
              } catch {
                // Abaikan
              }
            }
          },
          onError: () => {
            if (cancelled) return;
            if (loadingTimeout) {
              window.clearTimeout(loadingTimeout);
              loadingTimeout = 0;
            }
            setStatus('fallback');
            try {
              playerRef.current?.destroy();
            } catch {
              // Abaikan
            }
            playerRef.current = null;
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (loadingTimeout) window.clearTimeout(loadingTimeout);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Abaikan
        }
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-letter-bg-video-id={LETTER_VIDEO_ID}
      data-letter-bg-status={status}
      className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden [container-type:size]"
    >
      <img
        src={isDark ? LETTER_FALLBACK_NIGHT_BG : LETTER_FALLBACK_DAY_BG}
        alt=""
        className="w-full h-full object-cover object-center scale-[1.03]"
      />

      {status !== 'fallback' && (
        <div
          className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ${
            status === 'playing' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[max(100cqw,calc(100cqh*16/9))] h-[max(100cqh,calc(100cqw*9/16))]">
            <div ref={containerRef} className="w-full h-full" />
          </div>
        </div>
      )}

      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-b from-[#09111f]/85 via-[#0d182b]/75 to-[#09111f]/90'
            : 'bg-gradient-to-b from-[#16243b]/78 via-[#1d2f4d]/68 to-[#121e33]/85'
        }`}
      />
    </div>
  );
};

/**
 * Pemutar Video YouTube terlihat di bagian surat yang terbuka (t0Bt3a-MLGs).
 * Terkoordinasi dengan GlobalMusicBar agar tidak terjadi audio ganda.
 */
const LetterFeaturedVideoCard: React.FC = () => {
  const { isPlaying: globalIsPlaying, pauseMusic } = useMusic();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [embedError, setEmbedError] = useState<number | null>(null);

  // Jeda lagu GlobalMusicBar saat video surat diputar agar tidak bertabrakan
  useEffect(() => {
    pauseMusic();
  }, [pauseMusic]);

  // Jika pengguna menyalakan kembali GlobalMusicBar, jeda video surat agar tidak ada audio ganda
  useEffect(() => {
    if (globalIsPlaying && playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch {
        // Abaikan
      }
    }
  }, [globalIsPlaying]);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT?.Player) {
        return;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: LETTER_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            try {
              event.target.unMute();
              event.target.playVideo();
            } catch {
              // Abaikan jika browser menahan autoplay bersuara
            }
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === 1) {
              setEmbedError(null);
              pauseMusic();
            }
          },
          onError: (event) => {
            if (cancelled) return;
            setEmbedError(event.data);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Abaikan
        }
        playerRef.current = null;
      }
    };
  }, [pauseMusic]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="rounded-3xl bg-[#131e31]/88 backdrop-blur-xl border border-white/20 p-4 sm:p-6 shadow-2xl text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FFB6CB]/25 border border-[#FFB6CB]/40 text-[#FFB6CB] flex items-center justify-center shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FFB6CB] font-semibold">
              Melodi Pengiring Surat
            </p>
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">
              {LETTER_VIDEO_TITLE}
            </h3>
            <p className="text-xs text-white/70 truncate">{LETTER_VIDEO_ARTIST}</p>
          </div>
        </div>

        <a
          href={LETTER_VIDEO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-full bg-white/12 hover:bg-white/20 border border-white/20 text-xs font-medium text-white inline-flex items-center gap-1.5 transition-colors shrink-0"
        >
          <span>Buka di YouTube</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0c1422] shadow-inner">
        <div ref={containerRef} className="w-full h-full" />

        {embedError !== null && (
          <div
            role="alert"
            className="absolute inset-0 bg-[#0d1626]/92 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 sm:p-6 text-white overflow-y-auto"
          >
            <img
              src={LETTER_VIDEO_THUMB}
              alt={LETTER_VIDEO_TITLE}
              referrerPolicy="no-referrer"
              className="w-28 sm:w-36 aspect-video object-cover rounded-xl border border-white/20 mb-2.5 shadow-lg shrink-0"
            />
            <div className="flex items-center gap-1.5 text-rose-200 text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Video Tidak Dapat Diputar dalam Embed (kode {embedError})</span>
            </div>
            <p className="mt-1 max-w-md text-[11px] sm:text-xs text-white/80 leading-relaxed">
              Pemutaran embed {LETTER_VIDEO_TITLE} dibatasi oleh pemilik video atau kebijakan YouTube.
            </p>
            <a
              href={LETTER_VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 px-4 py-2 rounded-full bg-[#FFB6CB] text-[#263C59] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#ffa2bd] transition-colors shrink-0"
            >
              <span>Tonton di YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface LoveLetterPageProps {
  letter: LoveLetterData;
  isOwner: boolean;
  isDark?: boolean;
  onSaveLetter: (nextLetter: LoveLetterData) => Promise<void>;
  onRequestUnlock: () => void;
}

export const LoveLetterPage: React.FC<LoveLetterPageProps> = ({
  letter,
  isOwner,
  isDark = false,
  onSaveLetter,
  onRequestUnlock,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LoveLetterData>(letter);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(letter);
  }, [letter]);

  useEffect(() => {
    if (!isOpen) {
      setRevealedChars(0);
      return;
    }
    if (revealedChars >= letter.content.length) return;

    const timer = window.setTimeout(() => {
      setRevealedChars((prev) => Math.min(letter.content.length, prev + 3));
    }, 22);

    return () => window.clearTimeout(timer);
  }, [isOpen, revealedChars, letter.content.length]);

  const isComplete = revealedChars >= letter.content.length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveLetter(draft);
      setEditing(false);
      setRevealedChars(draft.content.length);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 pb-28 px-4 sm:px-6">
      {/* Video Latar YouTube (t0Bt3a-MLGs, muted) saat surat dibuka */}
      {isOpen && <LetterVideoBackground isDark={isDark} />}

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p
              className={`text-xs uppercase tracking-[0.2em] font-semibold ${
                isOpen
                  ? 'text-[#FFB6CB]'
                  : 'text-[#263C59]/65 dark:text-[#B3D9F2]'
              }`}
            >
              A Letter for Ityin
            </p>
            <h1
              className={`mt-1 font-serif-display text-3xl sm:text-4xl font-bold flex items-center gap-2 text-balance ${
                isOpen
                  ? 'text-white drop-shadow'
                  : 'text-[#263C59] dark:text-white'
              }`}
            >
              <span>{letter.title}</span>
              <Heart className="w-6 h-6 text-[#FFB6CB] fill-[#FFB6CB] shrink-0" />
            </h1>
          </div>

          <div className="shrink-0">
            {isOwner ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="px-4 py-2.5 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold flex items-center gap-2 hover:opacity-90"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Surat</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequestUnlock}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                  isOpen
                    ? 'border-white/25 bg-white/10 text-white hover:bg-white/20'
                    : 'border-[#263C59]/20 dark:border-white/20 text-[#263C59] dark:text-slate-200 hover:bg-[#263C59]/5 dark:hover:bg-white/10'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Edit Pemilik</span>
              </button>
            )}
          </div>
        </div>

        {!isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-8 max-w-lg mx-auto"
          >
            <div className="relative rounded-3xl bg-gradient-to-br from-[#FFFDF9] to-[#F7ECE2] dark:from-[#1b293f] dark:to-[#131e30] border border-[#e6d6c7] dark:border-white/15 shadow-2xl p-8 sm:p-12 text-center overflow-hidden">
              <svg
                viewBox="0 0 400 180"
                aria-hidden="true"
                className="w-full max-w-xs mx-auto mb-6 text-[#d8c4b2] dark:text-white/15"
              >
                <rect
                  x="10"
                  y="16"
                  width="380"
                  height="150"
                  rx="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  d="M14 20 L200 118 L386 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
              </svg>

              <div className="-mt-16 mb-6 relative z-10 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#e11d48] shadow-lg shadow-rose-900/25 flex items-center justify-center border-4 border-[#fda4af]/50">
                  <Heart className="w-7 h-7 text-white fill-white" />
                </div>
              </div>

              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#263C59] dark:text-white">
                {letter.title}
              </h2>
              <p className="mt-2 text-sm text-[#263C59]/70 dark:text-slate-300">
                {letter.date}
              </p>

              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="mt-8 px-8 py-3.5 rounded-full bg-[#e11d48] hover:bg-[#be123c] text-white font-semibold text-sm sm:text-base shadow-lg shadow-rose-900/20 transition-all active:scale-95 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB]"
              >
                <span>BUKA SURATKU 💌</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <motion.article
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-3xl bg-[#FFFDF9]/96 dark:bg-[#172336]/94 backdrop-blur-md border border-[#eadbc8] dark:border-white/15 shadow-2xl p-6 sm:p-12"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#263C59]/10 dark:border-white/10">
                <div>
                  <p className="text-xs text-[#263C59]/60 dark:text-slate-400">
                    {letter.date}
                  </p>
                  <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#263C59] dark:text-white mt-1">
                    {letter.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {!isComplete && (
                    <button
                      type="button"
                      onClick={() => setRevealedChars(letter.content.length)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#263C59]/8 dark:bg-white/10 text-xs font-medium text-[#263C59] dark:text-slate-200 hover:bg-[#263C59]/15"
                    >
                      Tampilkan Semua
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setRevealedChars(0)}
                    aria-label="Ulangi efek ketik"
                    className="px-3 py-1.5 rounded-lg bg-[#263C59]/8 dark:bg-white/10 text-xs font-medium text-[#263C59] dark:text-slate-200 hover:bg-[#263C59]/15 inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ulangi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#263C59]/8 dark:bg-white/10 text-xs font-medium text-[#263C59] dark:text-slate-200 hover:bg-[#263C59]/15 inline-flex items-center gap-1"
                  >
                    <MailOpen className="w-3.5 h-3.5" />
                    <span>Lipat Amplop</span>
                  </button>
                </div>
              </div>

              <div className="py-8 whitespace-pre-line text-base sm:text-lg leading-relaxed text-[#263C59] dark:text-slate-100 font-sans min-h-[220px]">
                {letter.content.slice(0, revealedChars)}
                {!isComplete && (
                  <span className="inline-block w-0.5 h-5 bg-[#e11d48] align-middle ml-0.5 animate-pulse" />
                )}
              </div>

              <div className="pt-6 border-t border-[#263C59]/10 dark:border-white/10 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-xs text-[#263C59]/60 dark:text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB6CB]" />
                  <span>Ditulis khusus untuk Ityin</span>
                </div>
                <p className="font-handwritten text-3xl text-[#e11d48] dark:text-[#FFB6CB]">
                  {letter.signature}
                </p>
              </div>
            </motion.article>

            {/* Video YouTube t0Bt3a-MLGs tampil saat surat dibuka */}
            <LetterFeaturedVideoCard />
          </div>
        )}
      </div>

      {/* Modal Edit Surat */}
      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0c1422]/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-xl bg-white dark:bg-[#172336] rounded-2xl p-6 shadow-2xl border border-[#263C59]/10 dark:border-white/10 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-xl font-bold text-[#263C59] dark:text-white">
                Edit Surat Cinta
              </h3>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Judul Surat
              </label>
              <input
                type="text"
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Tanggal
              </label>
              <input
                type="text"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Isi Surat
              </label>
              <textarea
                rows={8}
                required
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Tanda Tangan
              </label>
              <input
                type="text"
                required
                value={draft.signature}
                onChange={(e) =>
                  setDraft({ ...draft, signature: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#263C59]/75 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
