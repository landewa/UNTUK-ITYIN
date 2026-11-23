import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CalendarHeart,
  Disc3,
  Gamepad2,
  Heart,
  Images,
  Mail,
  MapPin,
  Signpost,
  Sparkles,
  VolumeX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SwissVideoBackground } from '../components/SwissVideoBackground';
import { useMusic } from '../services/musicService';
import type { JourneyData, PageId, SiteConfig } from '../types/universe';

const HERO_DAY_BG = '/src/assets/images/hero_swiss_dream_bg_1795428603574.jpg';
const HERO_NIGHT_BG = '/src/assets/images/swiss_night_sky_bg_1795428588118.jpg';
const COUPLE_DECOR_IMG = '/src/assets/images/anime_couple_decor_1795428587235.jpg';

function computeElapsed(startIso: string | null, nowMs: number) {
  if (!startIso) return null;
  const startMs = new Date(startIso).getTime();
  if (Number.isNaN(startMs)) return null;
  const diff = Math.max(0, nowMs - startMs);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

interface HomeHeroSectionProps {
  siteConfig: SiteConfig;
  isDark: boolean;
  onEnterWorld: () => void;
  onNavigate: (page: PageId) => void;
}

export const HomeHeroSection: React.FC<HomeHeroSectionProps> = ({
  siteConfig,
  isDark,
  onEnterWorld,
  onNavigate,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { needsSoundUnlock, playerError, unlockAudio } = useMusic();

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const swissDateTime = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Europe/Zurich',
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(nowMs));

  const swissClock = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Europe/Zurich',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(nowMs));

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between pt-20 pb-20 sm:pb-16 px-4 sm:px-8 overflow-hidden">
      {/* Latar Belakang Pemandangan Pegunungan Swiss */}
      <div className="absolute inset-0 z-0">
        <img
          src={isDark ? HERO_NIGHT_BG : HERO_DAY_BG}
          alt="Pegunungan Swiss Alps dengan danau biru jernih dan bunga sakura"
          className="w-full h-full object-cover object-center transition-opacity duration-500"
        />
        <div
          className={`absolute inset-0 ${
            isDark
              ? 'bg-gradient-to-b from-[#0b1526]/75 via-[#0b1526]/48 to-[#0D1522]'
              : 'bg-gradient-to-b from-[#172b47]/58 via-[#172b47]/35 to-[#172b47]/78'
          }`}
        />
      </div>

      {/* Baris Atas Hero: Kontrol Suara Mungil (Hanya jika browser menahan suara autoplay) + Jam Interlaken */}
      <div className="relative z-10 max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          {needsSoundUnlock && !playerError && (
            <button
              type="button"
              onClick={unlockAudio}
              className="glass-panel px-3.5 py-2 rounded-full text-xs font-semibold text-[#263C59] dark:text-white inline-flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform"
            >
              <VolumeX className="w-3.5 h-3.5 text-[#e11d48] dark:text-[#FFB6CB]" />
              <span>Aktifkan Suara ♪</span>
            </button>
          )}
        </div>

        <div className="glass-panel px-4 py-2 rounded-2xl text-right shadow-sm ml-auto">
          <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-[#263C59] dark:text-[#B3D9F2]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{siteConfig.locationLabel}</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-[#263C59]/80 dark:text-slate-200 mt-0.5 tabular-nums">
            <span>{swissDateTime}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold">{swissClock}</span>
          </div>
        </div>
      </div>

      {/* Judul Utama & Pesan Pembuka (Fokus Penuh di Layar Pertama) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-3xl w-full mx-auto text-center my-auto py-8 space-y-5"
      >
        <p className="text-xs sm:text-sm tracking-[0.22em] uppercase text-[#FFF7F0]/90 font-medium">
          {siteConfig.subtitle}
        </p>

        <h1 className="font-serif-display text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.08] drop-shadow-md text-balance">
          {siteConfig.siteTitle}{' '}
          <span className="inline-block text-[#FFB6CB]" aria-hidden="true">
            ♡
          </span>
        </h1>

        <p className="text-xl sm:text-3xl md:text-4xl font-serif-display italic text-[#FFF7F0] drop-shadow">
          {siteConfig.openingMessage}
        </p>

        <p className="max-w-xl mx-auto text-sm sm:text-base md:text-lg text-white/95 leading-relaxed drop-shadow-sm">
          {siteConfig.supportingMessage}
        </p>

        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onEnterWorld}
            className="px-7 py-3.5 rounded-full bg-[#FFB6CB] hover:bg-[#ffa2bd] text-[#263C59] font-semibold text-sm sm:text-base shadow-lg shadow-[#263C59]/25 transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>{siteConfig.heroCtaLabel}</span>
            <ArrowDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('letter')}
            className="px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/40 backdrop-blur-md font-medium text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Baca Surat Cinta
          </button>
        </div>
      </motion.div>

      {/* Penunjuk Gulir Halus di Dasar Hero */}
      <div className="relative z-10 text-center text-xs text-white/85 flex items-center justify-center gap-1.5">
        <span>Gulir ke bawah untuk menonton video & melodi utama kita</span>
        <ArrowDown className="w-3.5 h-3.5 shrink-0" />
      </div>

      {/* Transisi Gradasi Halus antara Hero dan Section Video di Bawahnya */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-20 z-10 bg-gradient-to-b from-transparent ${
          isDark ? 'to-[#0D1522]' : 'to-[#FFF7F0]'
        }`}
      />
    </section>
  );
};

interface HomePortalsSectionProps {
  isDark: boolean;
  journey: JourneyData;
  memoriesCount: number;
  playlistCount: number;
  dreamsCount: number;
  completedDreamsCount: number;
  onNavigate: (page: PageId) => void;
}

export const HomePortalsSection: React.FC<HomePortalsSectionProps> = ({
  isDark,
  journey,
  memoriesCount,
  playlistCount,
  dreamsCount,
  completedDreamsCount,
  onNavigate,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = computeElapsed(journey.startDate, nowMs);

  return (
    <>
      <section
        id="home-portals-section"
        className="relative w-full overflow-hidden py-16 sm:py-24"
      >
        {/* Player A — Latar Video Swiss Muted Penuh + Fallback Otomatis */}
        <SwissVideoBackground isDark={isDark} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-xs uppercase tracking-[0.22em] text-[#FFB6CB] font-semibold drop-shadow-sm">
              Panorama Swiss &amp; Enam Sudut Dunia Kita
            </p>
            <h2 className="mt-1.5 font-serif-display text-2xl sm:text-4xl font-bold text-white drop-shadow text-balance">
              Enam Tempat Indah Menantimu di Swiss
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-white/90 drop-shadow-sm leading-relaxed">
              Pilih kartu mana saja di bawah ini untuk membuka galeri potret, daftar lagu, surat cinta, penghitung perjalanan, permainan mini, dan taman impian kita.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Kartu 1: Our Memories */}
        <button
          type="button"
          onClick={() => onNavigate('memories')}
          className="glass-portal-card rounded-2xl p-6 text-left flex flex-col justify-between gap-5 hover:-translate-y-1 transition-transform duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB]"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#B3D9F2]/40 dark:bg-[#B3D9F2]/15 text-[#263C59] dark:text-[#B3D9F2] flex items-center justify-center">
                <Images className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#263C59]/65 dark:text-slate-300 tabular-nums">
                {memoriesCount} Slot Potret
              </span>
            </div>
            <h3 className="mt-4 font-serif-display text-xl font-semibold text-[#263C59] dark:text-white flex items-center gap-1.5">
              <span>Our Memories</span>
              <Heart className="w-4 h-4 text-[#FFB6CB] fill-[#FFB6CB]" />
            </h3>
            <p className="mt-1.5 text-sm text-[#263C59]/75 dark:text-slate-300 leading-relaxed">
              Galeri scrapbook Polaroid khusus untuk 10 potret pribadi Ityin lengkap dengan keterangan dan tampilan layar penuh.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#263C59] dark:text-[#FFB6CB] group-hover:gap-2.5 transition-all">
            Buka Galeri <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        {/* Kartu 2: Our Soundtrack */}
        <button
          type="button"
          onClick={() => onNavigate('music')}
          className="glass-portal-card rounded-2xl p-6 text-left flex flex-col justify-between gap-5 hover:-translate-y-1 transition-transform duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB]"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFB6CB]/35 dark:bg-[#FFB6CB]/20 text-[#263C59] dark:text-[#FFB6CB] flex items-center justify-center">
                <Disc3 className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#263C59]/65 dark:text-slate-300 tabular-nums">
                {playlistCount}/10 Lagu
              </span>
            </div>
            <h3 className="mt-4 font-serif-display text-xl font-semibold text-[#263C59] dark:text-white flex items-center gap-1.5">
              <span>Our Soundtrack</span>
              <Heart className="w-4 h-4 text-[#FFB6CB] fill-[#FFB6CB]" />
            </h3>
            <p className="mt-1.5 text-sm text-[#263C59]/75 dark:text-slate-300 leading-relaxed">
              Pemutar piringan hitam berlatar senja Swiss dengan 10 slot lagu YouTube yang siap kamu isi sesuai selera.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#263C59] dark:text-[#FFB6CB] group-hover:gap-2.5 transition-all">
            Buka Daftar Lagu <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        {/* Kartu 3: A Letter for Ityin */}
        <button
          type="button"
          onClick={() => onNavigate('letter')}
          className="glass-portal-card rounded-2xl p-6 text-left flex flex-col justify-between gap-5 hover:-translate-y-1 transition-transform duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB]"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-[#FFB6CB] flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#263C59]/65 dark:text-slate-300">
                Segel Lilin
              </span>
            </div>
            <h3 className="mt-4 font-serif-display text-xl font-semibold text-[#263C59] dark:text-white flex items-center gap-1.5">
              <span>A Letter for Ityin</span>
              <Heart className="w-4 h-4 text-[#FFB6CB] fill-[#FFB6CB]" />
            </h3>
            <p className="mt-1.5 text-sm text-[#263C59]/75 dark:text-slate-300 leading-relaxed">
              Buka segel lilin berbentuk hati untuk membaca surat cinta yang muncul perlahan bersama kelopak bunga.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#263C59] dark:text-[#FFB6CB] group-hover:gap-2.5 transition-all">
            Buka Amplop <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        {/* Kartu 4: Our Journey */}
        <button
          type="button"
          onClick={() => onNavigate('journey')}
          className="glass-portal-card rounded-2xl p-6 text-left flex flex-col justify-between gap-5 hover:-translate-y-1 transition-transform duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB]"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#C7A6F5]/35 dark:bg-[#C7A6F5]/20 text-[#263C59] dark:text-[#C7A6F5] flex items-center justify-center">
                <CalendarHeart className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#263C59]/65 dark:text-slate-300 tabular-nums">
                {journey.milestones.length} Tonggak
              </span>
            </div>
            <h3 className="mt-4 font-serif-display text-xl font-semibold text-[#263C59] dark:text-white flex items-center gap-1.5">
              <span>Our Journey</span>
              <Heart className="w-4 h-4 text-[#FFB6CB] fill-[#FFB6CB]" />
            </h3>
            {elapsed ? (
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  ['Hari', elapsed.days],
                  ['Jam', elapsed.hours],
                  ['Menit', elapsed.minutes],
                  ['Detik', elapsed.seconds],
                ].map(([label, val]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl bg-white/80 dark:bg-white/10 py-2 px-1 border border-[#263C59]/10 dark:border-white/10"
                  >
                    <div className="text-base font-bold text-[#263C59] dark:text-white tabular-nums">
                      {val}
                    </div>
                    <div className="text-[10px] text-[#263C59]/70 dark:text-slate-300">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-[#263C59]/75 dark:text-slate-300 leading-relaxed">
                Penghitung waktu kebersamaan & linimasa kenangan — siap diatur tanggal aslinya melalui Studio Pemilik.
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#263C59] dark:text-[#FFB6CB] group-hover:gap-2.5 transition-all">
            Lihat Linimasa <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        {/* Kartu 5: Little Games */}
        <button
          type="button"
          onClick={() => onNavigate('games')}
          className="glass-portal-card rounded-2xl p-6 text-left flex flex-col justify-between gap-5 hover:-translate-y-1 transition-transform duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB]"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFB6CB]/35 dark:bg-[#FFB6CB]/20 text-[#263C59] dark:text-[#FFB6CB] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#263C59]/65 dark:text-slate-300">
                3 Permainan Mini
              </span>
            </div>
            <h3 className="mt-4 font-serif-display text-xl font-semibold text-[#263C59] dark:text-white flex items-center gap-1.5">
              <span>Little Games</span>
              <Heart className="w-4 h-4 text-[#FFB6CB] fill-[#FFB6CB]" />
            </h3>
            <p className="mt-1.5 text-sm text-[#263C59]/75 dark:text-slate-300 leading-relaxed">
              Mainkan Tangkap Hati, Cocokkan Memori, dan Kuis Kita yang ringan dimainkan di ponsel maupun laptop.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#263C59] dark:text-[#FFB6CB] group-hover:gap-2.5 transition-all">
            Mainkan Bersama <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        {/* Kartu 6: Our Dream Space */}
        <button
          type="button"
          onClick={() => onNavigate('dreams')}
          className="glass-portal-card rounded-2xl p-6 text-left flex flex-col justify-between gap-5 hover:-translate-y-1 transition-transform duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB]"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                <Signpost className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#263C59]/65 dark:text-slate-300 tabular-nums">
                {completedDreamsCount}/{dreamsCount} Tercapai
              </span>
            </div>
            <h3 className="mt-4 font-serif-display text-xl font-semibold text-[#263C59] dark:text-white flex items-center gap-1.5">
              <span>Our Dream Space</span>
              <Heart className="w-4 h-4 text-[#FFB6CB] fill-[#FFB6CB]" />
            </h3>
            <p className="mt-1.5 text-sm text-[#263C59]/75 dark:text-slate-300 leading-relaxed">
              Taman pegunungan Swiss dengan papan petunjuk kayu untuk impian Perjalanan, Rumah, Usaha, Masa Depan, dan Pribadi.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#263C59] dark:text-[#FFB6CB] group-hover:gap-2.5 transition-all">
            Kunjungi Taman <ArrowRight className="w-4 h-4" />
          </span>
        </button>
          </div>
        </div>
      </section>

      {/* Kartu Kenangan Pasangan */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-md border border-white/70 dark:border-white/10 max-w-sm mx-auto">
              <img
                src={COUPLE_DECOR_IMG}
                alt="Ilustrasi dekoratif pasangan anime duduk bersama menatap bunga sakura dan Pegunungan Swiss"
                loading="lazy"
                className="w-full h-auto block"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#263C59]/75 dark:text-[#B3D9F2]">
              <Sparkles className="w-4 h-4 text-[#FFB6CB]" />
              <span>Kenang-Kenangan Digital Pribadi</span>
            </div>
            <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#263C59] dark:text-white text-balance">
              Dibuat untuk Bertumbuh di Setiap Babak Kisah Kita
            </h3>
            <p className="text-sm sm:text-base text-[#263C59]/80 dark:text-slate-300 leading-relaxed">
              Setiap potret Ityin, setiap lagu YouTube di daftar putar 10 slot, setiap tanggal momen berharga, hingga papan impian di taman Swiss dapat diperbarui langsung melalui Studio Pemilik tanpa mengubah kode aplikasi.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('memories')}
                className="px-5 py-2.5 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Lihat Potret Ityin
              </button>
              <button
                type="button"
                onClick={() => onNavigate('music')}
                className="px-5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/20 text-[#263C59] dark:text-white text-sm font-medium hover:bg-[#263C59]/5 dark:hover:bg-white/10 transition-colors"
              >
                Atur Daftar Lagu
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
