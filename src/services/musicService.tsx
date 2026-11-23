import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PlaylistSlot } from '../types/universe';

export const DEFAULT_SOUNDTRACK_VIDEO_ID = '9ZjGAn7v3C4';

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
            onError?: (event: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YTPlayer {
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

export function extractYouTubeVideoId(rawUrl: string): string | null {
  const input = rawUrl.trim();
  if (!input) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const parsed = new URL(input);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (
        segments.length >= 2 &&
        (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live')
      ) {
        const candidate = segments[1];
        return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatTimeSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export type MusicSource = 'playlist';

export interface ActiveTrackDisplay {
  source: MusicSource;
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
}

interface MusicContextValue {
  playerContainerRef: React.RefObject<HTMLDivElement | null>;
  publishedTracks: PlaylistSlot[];
  activeSource: MusicSource;
  activeSlotIndex: number | null;
  currentTrack: PlaylistSlot | null;
  activeDisplayTrack: ActiveTrackDisplay | null;
  isPlaying: boolean;
  isBuffering: boolean;
  isMuted: boolean;
  needsSoundUnlock: boolean;
  playbackStatusLabel: string;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: boolean;
  playerError: string | null;
  playerErrorCode: number | null;
  erroredVideos: Record<string, { code: number; message: string }>;
  unlockAudio: () => void;
  selectAndPlaySlot: (slotIndex: number) => void;
  togglePlayPause: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

let ytApiPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve();
    };
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return ytApiPromise;
}

export function MusicProvider({
  playlist,
  children,
}: {
  playlist: PlaylistSlot[];
  children: React.ReactNode;
}) {
  const publishedTracks = useMemo(
    () => playlist.filter((slot) => Boolean(slot.videoId && slot.title.trim())),
    [playlist],
  );

  const firstPublished = publishedTracks[0] ?? null;

  const [activeSource] = useState<MusicSource>('playlist');
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(
    firstPublished ? firstPublished.slotIndex : null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(Boolean(firstPublished));
  const [isMuted, setIsMuted] = useState(false);
  const [needsSoundUnlock, setNeedsSoundUnlock] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(75);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [playerErrorCode, setPlayerErrorCode] = useState<number | null>(null);
  const [erroredVideos, setErroredVideos] = useState<
    Record<string, { code: number; message: string }>
  >({});

  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const hasErroredRef = useRef(false);
  const activeVideoIdRef = useRef<string>(
    firstPublished?.videoId || DEFAULT_SOUNDTRACK_VIDEO_ID,
  );
  const publishedRef = useRef<PlaylistSlot[]>(publishedTracks);
  const activeSlotRef = useRef<number | null>(activeSlotIndex);
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const volumeRef = useRef(volume);
  const needsUnlockRef = useRef(needsSoundUnlock);

  publishedRef.current = publishedTracks;
  activeSlotRef.current = activeSlotIndex;
  repeatRef.current = repeat;
  shuffleRef.current = shuffle;
  volumeRef.current = volume;
  needsUnlockRef.current = needsSoundUnlock;

  // Inisialisasi Player B — Soundtrack (SATU-SATUNYA pemutar audio resmi, default Lagu Slot 01)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    let cancelled = false;
    let verifyTimer = 0;

    const initialVideoId = activeVideoIdRef.current;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !playerContainerRef.current || !window.YT?.Player || playerRef.current) {
        return;
      }

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        height: '100%',
        width: '100%',
        videoId: initialVideoId,
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
            if (cancelled || hasErroredRef.current) return;
            try {
              event.target.unMute();
              event.target.setVolume(volumeRef.current);
              event.target.playVideo();
            } catch {
              // Browser menahan pemutaran bersuara sebelum interaksi pengguna
            }

            // Periksa jujur setelah jeda singkat apakah autoplay bersuara berhasil atau diblokir browser
            verifyTimer = window.setTimeout(() => {
              if (cancelled || hasErroredRef.current || !playerRef.current) return;
              try {
                const state = playerRef.current.getPlayerState();
                const mutedNow = playerRef.current.isMuted();

                if (state === 1 && !mutedNow) {
                  setIsPlaying(true);
                  setIsBuffering(false);
                  setIsMuted(false);
                  setNeedsSoundUnlock(false);
                } else {
                  // Kebijakan browser menahan autoplay bersuara -> coba fallback muted sesuai aturan browser
                  playerRef.current.mute();
                  playerRef.current.playVideo();
                  setIsMuted(true);
                  setIsBuffering(false);
                  setNeedsSoundUnlock(true);
                }
              } catch {
                setIsBuffering(false);
                if (!hasErroredRef.current) {
                  setNeedsSoundUnlock(true);
                }
              }
            }, 1100);
          },
          onStateChange: (event) => {
            if (cancelled) return;
            const state = event.data;
            if (state === 1) {
              hasErroredRef.current = false;
              const currentVid = activeVideoIdRef.current;
              setErroredVideos((prev) => {
                if (!prev[currentVid]) return prev;
                const next = { ...prev };
                delete next[currentVid];
                return next;
              });
              setPlayerError(null);
              setPlayerErrorCode(null);
              setIsPlaying(true);
              setIsBuffering(false);
              setDuration(event.target.getDuration() || 0);
              try {
                const mutedNow = event.target.isMuted();
                setIsMuted(mutedNow);
                if (!mutedNow) {
                  setNeedsSoundUnlock(false);
                }
              } catch {
                // Abaikan
              }
            } else if (state === 2) {
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (state === 3) {
              setIsBuffering(true);
            } else if (state === 0) {
              setIsPlaying(false);
              setIsBuffering(false);

              const tracks = publishedRef.current;
              if (tracks.length === 0) return;

              if (repeatRef.current) {
                event.target.seekTo(0, true);
                event.target.playVideo();
                return;
              }

              const curIdx = tracks.findIndex(
                (t) => t.slotIndex === activeSlotRef.current,
              );
              let nextIdx = (curIdx + 1) % tracks.length;
              if (shuffleRef.current && tracks.length > 1) {
                do {
                  nextIdx = Math.floor(Math.random() * tracks.length);
                } while (nextIdx === curIdx);
              }
              const nextTrackItem = tracks[nextIdx];
              if (nextTrackItem) {
                activeVideoIdRef.current = nextTrackItem.videoId;
                setActiveSlotIndex(nextTrackItem.slotIndex);
                event.target.loadVideoById(nextTrackItem.videoId);
              }
            }
          },
          onError: (event) => {
            if (cancelled) return;
            hasErroredRef.current = true;
            if (verifyTimer) {
              window.clearTimeout(verifyTimer);
              verifyTimer = 0;
            }
            const failedVid = activeVideoIdRef.current;
            let message = `Video YouTube (${failedVid}) tidak dapat diputar dalam mode embed (kode ${event.data}).`;
            if (event.data === 101 || event.data === 150 || event.data === 153) {
              message = `Pemutaran video YouTube (${failedVid}) dibatasi oleh pemilik video atau kebijakan embed (kode ${event.data}).`;
            } else if (event.data === 100) {
              message = `Video YouTube (${failedVid}) tidak ditemukan atau bersifat pribadi (kode 100).`;
            }
            setIsPlaying(false);
            setIsBuffering(false);
            setNeedsSoundUnlock(false);
            setPlayerErrorCode(event.data);
            setPlayerError(message);
            setErroredVideos((prev) => ({
              ...prev,
              [failedVid]: { code: event.data, message },
            }));
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (verifyTimer) window.clearTimeout(verifyTimer);
    };
  }, []);

  const unlockAudio = useCallback(() => {
    setPlayerError(null);
    setPlayerErrorCode(null);
    if (!playerRef.current) return;
    try {
      playerRef.current.unMute();
      playerRef.current.setVolume(volumeRef.current);
      playerRef.current.playVideo();
      setIsMuted(false);
      setNeedsSoundUnlock(false);
      setIsPlaying(true);
    } catch {
      // Abaikan
    }
  }, []);

  // Buka suara otomatis pada interaksi pengguna pertama jika browser menahan suara saat awal muat
  useEffect(() => {
    if (!needsSoundUnlock) return;
    const handleFirstGesture = () => {
      if (needsUnlockRef.current && playerRef.current) {
        unlockAudio();
      }
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [needsSoundUnlock, unlockAudio]);

  useEffect(() => {
    if (publishedTracks.length === 0) {
      setActiveSlotIndex(null);
      setIsPlaying(false);
      setIsBuffering(false);
      setCurrentTime(0);
      setDuration(0);
      if (playerRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch {
          // Abaikan
        }
      }
      return;
    }

    const activeTrackStillExists = publishedTracks.find(
      (t) => t.slotIndex === activeSlotIndex,
    );

    if (!activeTrackStillExists) {
      const nextDefault = publishedTracks[0];
      setActiveSlotIndex(nextDefault.slotIndex);
      if (activeVideoIdRef.current !== nextDefault.videoId) {
        activeVideoIdRef.current = nextDefault.videoId;
        hasErroredRef.current = false;
        setPlayerError(null);
        setPlayerErrorCode(null);
        if (playerRef.current) {
          try {
            playerRef.current.loadVideoById(nextDefault.videoId);
          } catch {
            // Abaikan
          }
        }
      }
    }
  }, [publishedTracks, activeSlotIndex]);

  const currentTrack = useMemo(
    () => publishedTracks.find((t) => t.slotIndex === activeSlotIndex) ?? null,
    [publishedTracks, activeSlotIndex],
  );

  const activeDisplayTrack = useMemo<ActiveTrackDisplay | null>(() => {
    if (currentTrack) {
      return {
        source: 'playlist',
        videoId: currentTrack.videoId,
        title: currentTrack.title,
        artist: currentTrack.artist || 'Untuk Ityin',
        thumbnailUrl:
          currentTrack.thumbnailUrl || getYouTubeThumbnailUrl(currentTrack.videoId),
      };
    }
    return null;
  }, [currentTrack]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      if (playerRef.current) {
        try {
          setCurrentTime(playerRef.current.getCurrentTime() || 0);
          const dur = playerRef.current.getDuration();
          if (dur && Number.isFinite(dur)) setDuration(dur);
        } catch {
          // Abaikan
        }
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const loadAndPlay = useCallback((videoId: string) => {
    hasErroredRef.current = false;
    activeVideoIdRef.current = videoId;
    setPlayerError(null);
    setPlayerErrorCode(null);
    setIsBuffering(true);
    setNeedsSoundUnlock(false);
    setIsMuted(false);
    if (!playerRef.current) return;
    try {
      playerRef.current.unMute();
      playerRef.current.setVolume(volumeRef.current);
      playerRef.current.loadVideoById(videoId);
    } catch {
      setPlayerError('Gagal memuat video YouTube. Coba lagi.');
      setIsBuffering(false);
    }
  }, []);

  const selectAndPlaySlot = useCallback(
    (slotIndex: number) => {
      const track = publishedTracks.find((t) => t.slotIndex === slotIndex);
      if (!track) return;
      setActiveSlotIndex(slotIndex);
      setCurrentTime(0);
      setDuration(0);
      loadAndPlay(track.videoId);
    },
    [publishedTracks, loadAndPlay],
  );

  const pauseMusic = useCallback(() => {
    if (!playerRef.current) return;
    try {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } catch {
      // Abaikan
    }
  }, []);

  const resumeMusic = useCallback(() => {
    if (!playerRef.current) return;
    hasErroredRef.current = false;
    setPlayerError(null);
    setPlayerErrorCode(null);
    try {
      playerRef.current.unMute();
      playerRef.current.setVolume(volumeRef.current);
      playerRef.current.playVideo();
      setIsMuted(false);
      setNeedsSoundUnlock(false);
    } catch {
      if (activeDisplayTrack) {
        loadAndPlay(activeDisplayTrack.videoId);
      }
    }
  }, [activeDisplayTrack, loadAndPlay]);

  const togglePlayPause = useCallback(() => {
    if (!activeDisplayTrack) return;
    if (needsSoundUnlock) {
      unlockAudio();
      return;
    }
    if (isPlaying) {
      pauseMusic();
    } else {
      resumeMusic();
    }
  }, [activeDisplayTrack, needsSoundUnlock, isPlaying, unlockAudio, pauseMusic, resumeMusic]);

  const nextTrack = useCallback(() => {
    if (publishedTracks.length === 0) return;
    const idx = publishedTracks.findIndex((t) => t.slotIndex === activeSlotIndex);
    let nextIdx = idx === -1 ? 0 : (idx + 1) % publishedTracks.length;
    if (shuffle && publishedTracks.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * publishedTracks.length);
      } while (nextIdx === idx);
    }
    selectAndPlaySlot(publishedTracks[nextIdx].slotIndex);
  }, [publishedTracks, activeSlotIndex, shuffle, selectAndPlaySlot]);

  const prevTrack = useCallback(() => {
    if (publishedTracks.length === 0) return;
    const idx = publishedTracks.findIndex((t) => t.slotIndex === activeSlotIndex);
    const prevIdx = idx <= 0 ? publishedTracks.length - 1 : idx - 1;
    selectAndPlaySlot(publishedTracks[prevIdx].slotIndex);
  }, [publishedTracks, activeSlotIndex, selectAndPlaySlot]);

  const seekTo = useCallback((seconds: number) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    } catch {
      // Abaikan
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    setVolumeState(clamped);
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(clamped);
        setIsMuted(false);
        setNeedsSoundUnlock(false);
      } catch {
        // Abaikan
      }
    }
  }, []);

  const playbackStatusLabel = useMemo(() => {
    if (playerError) return 'Pemutaran dibatasi';
    if (needsSoundUnlock) {
      return isPlaying
        ? 'Berjalan tanpa suara (dibatasi browser)'
        : 'Suara menunggu interaksi browser';
    }
    if (isBuffering) return 'Memuat musik...';
    if (isPlaying) return 'Sedang diputar ♪';
    return 'Dijeda';
  }, [playerError, needsSoundUnlock, isPlaying, isBuffering]);

  const value = useMemo<MusicContextValue>(
    () => ({
      playerContainerRef,
      publishedTracks,
      activeSource,
      activeSlotIndex,
      currentTrack,
      activeDisplayTrack,
      isPlaying,
      isBuffering,
      isMuted,
      needsSoundUnlock,
      playbackStatusLabel,
      currentTime,
      duration,
      volume,
      shuffle,
      repeat,
      playerError,
      playerErrorCode,
      erroredVideos,
      unlockAudio,
      selectAndPlaySlot,
      togglePlayPause,
      pauseMusic,
      resumeMusic,
      nextTrack,
      prevTrack,
      seekTo,
      setVolume,
      toggleShuffle: () => setShuffle((s) => !s),
      toggleRepeat: () => setRepeat((r) => !r),
    }),
    [
      publishedTracks,
      activeSource,
      activeSlotIndex,
      currentTrack,
      activeDisplayTrack,
      isPlaying,
      isBuffering,
      isMuted,
      needsSoundUnlock,
      playbackStatusLabel,
      currentTime,
      duration,
      volume,
      shuffle,
      repeat,
      playerError,
      playerErrorCode,
      erroredVideos,
      unlockAudio,
      selectAndPlaySlot,
      togglePlayPause,
      pauseMusic,
      resumeMusic,
      nextTrack,
      prevTrack,
      seekTo,
      setVolume,
    ],
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error('useMusic harus digunakan di dalam MusicProvider');
  }
  return ctx;
}
