import React, { useEffect, useRef, useState } from 'react';
import { loadYouTubeIframeApi, type YTPlayer } from '../services/musicService';

export const SWISS_BG_VIDEO_ID = 'iqGAW57EudQ';
export const SWISS_BG_VIDEO_URL =
  'https://youtu.be/iqGAW57EudQ?si=s5Y27xDvQKjY9iw9';

const SWISS_FALLBACK_DAY_BG =
  '/src/assets/images/swiss_garden_dreams_bg_1795428587595.jpg';
const SWISS_FALLBACK_NIGHT_BG =
  '/src/assets/images/swiss_night_sky_bg_1795428588118.jpg';

export type BackgroundVideoStatus = 'loading' | 'playing' | 'fallback';

interface SwissVideoBackgroundProps {
  isDark: boolean;
}

/**
 * Player A — Background Video (`iqGAW57EudQ`)
 * - Selalu dalam mode muted (tanpa audio sepanjang waktu).
 * - Hanya bertugas menampilkan atmosfer visual di belakang enam kartu Swiss.
 * - Tidak terhubung ke GlobalMusicBar dan tidak pernah menjadi sumber audio.
 * - Jika embedding ditolak YouTube, otomatis menggunakan gambar Swiss fallback tanpa kotak error.
 */
export const SwissVideoBackground: React.FC<SwissVideoBackgroundProps> = ({
  isDark,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [status, setStatus] = useState<BackgroundVideoStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    let loadingTimeout = 0;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT?.Player) {
        return;
      }

      // Jika dalam 5 detik video belum masuk state playing/buffering, tampilkan fallback gambar Swiss dengan mulus
      loadingTimeout = window.setTimeout(() => {
        if (!cancelled) {
          setStatus((prev) => (prev === 'playing' ? prev : 'fallback'));
        }
      }, 5000);

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: SWISS_BG_VIDEO_ID,
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
          playlist: SWISS_BG_VIDEO_ID,
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
            const state = event.data;
            if (state === 1) {
              // Pastikan Player A selalu muted sepanjang waktu
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
            } else if (state === 0) {
              // Loop mulus saat video berakhir
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
      if (loadingTimeout) {
        window.clearTimeout(loadingTimeout);
      }
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
      data-bg-video-id={SWISS_BG_VIDEO_ID}
      data-bg-video-status={status}
      className="pointer-events-none select-none absolute inset-0 z-0 overflow-hidden [container-type:size]"
    >
      {/* Gambar Latar Swiss Cadangan (selalu siap & tampil mulus jika embed video dibatasi) */}
      <img
        src={isDark ? SWISS_FALLBACK_NIGHT_BG : SWISS_FALLBACK_DAY_BG}
        alt=""
        className="w-full h-full object-cover object-center transition-opacity duration-500 scale-[1.03]"
      />

      {/* Layer Player A YouTube IFrame (selalu muted, skala cover responsif 16:9 penuh) */}
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

      {/* Overlay Gradasi Gelap Transparan untuk keterbacaan teks & kartu glassmorphism */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-b from-[#0D1522] via-[#0b1526]/72 to-[#0D1522]'
            : 'bg-gradient-to-b from-[#0f1d33]/82 via-[#152845]/62 to-[#0f1d33]/84'
        }`}
      />

      {/* Transisi Gradasi Halus Atas & Bawah menuju Section Tetangga */}
      <div
        className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${
          isDark ? 'from-[#0D1522] to-transparent' : 'from-[#FFF7F0] to-transparent'
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${
          isDark ? 'from-[#0D1522] to-transparent' : 'from-[#FFF7F0] to-transparent'
        }`}
      />
    </div>
  );
};
