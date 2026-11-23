import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Disc3,
  Edit3,
  ExternalLink,
  Heart,
  Lock,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import {
  extractYouTubeVideoId,
  formatTimeSeconds,
  getYouTubeThumbnailUrl,
  useMusic,
} from '../services/musicService';
import type { PlaylistSlot } from '../types/universe';

const SUNSET_BG = '/src/assets/images/swiss_sunset_vinyl_bg_1795428587303.jpg';

interface MusicPageProps {
  playlist: PlaylistSlot[];
  isOwner: boolean;
  onUpdatePlaylist: (nextPlaylist: PlaylistSlot[]) => Promise<void>;
  onRequestUnlock: () => void;
}

export const MusicPage: React.FC<MusicPageProps> = ({
  playlist,
  isOwner,
  onUpdatePlaylist,
  onRequestUnlock,
}) => {
  const {
    publishedTracks,
    activeSource,
    activeSlotIndex,
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    playerError,
    erroredVideos,
    selectAndPlaySlot,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = useMusic();

  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [saving, setSaving] = useState(false);

  const openSlotEditor = (slot: PlaylistSlot) => {
    setFormError(null);
    setEditingSlotIndex(slot.slotIndex);
    setFormUrl(slot.youtubeUrl);
    setFormTitle(slot.title);
    setFormArtist(slot.artist);
  };

  const openFirstEmptySlot = () => {
    const empty = playlist.find((s) => !s.videoId) || playlist[0];
    openSlotEditor(empty);
  };

  const previewVideoId = extractYouTubeVideoId(formUrl);

  const handleFetchMetadata = async () => {
    if (!previewVideoId) {
      setFormError('Masukkan tautan YouTube yang valid terlebih dahulu.');
      return;
    }
    setFetchingMeta(true);
    setFormError(null);
    try {
      const res = await fetch(
        `/api/youtube-oembed?videoId=${encodeURIComponent(previewVideoId)}`,
      );
      if (!res.ok) {
        if (!formTitle.trim() && editingSlotIndex !== null) {
          setFormTitle(`Lagu Pilihan ${editingSlotIndex}`);
        }
        setFormError(
          'Metadata YouTube tidak tersedia; menggunakan label sementara yang dapat Anda edit.',
        );
        return;
      }
      const meta = (await res.json()) as { title?: string; artist?: string };
      if (meta.title) setFormTitle(meta.title);
      else if (!formTitle.trim() && editingSlotIndex !== null) {
        setFormTitle(`Lagu Pilihan ${editingSlotIndex}`);
      }
      if (meta.artist) setFormArtist(meta.artist);
    } catch {
      setFormError('Gagal mengambil metadata YouTube. Anda tetap bisa mengisi judul manual.');
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSlotIndex === null) return;

    const videoId = extractYouTubeVideoId(formUrl);
    if (!videoId) {
      setFormError(
        'Masukkan URL YouTube yang valid (contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/...).',
      );
      return;
    }

    const resolvedTitle =
      formTitle.trim() || `Lagu Pilihan ${editingSlotIndex}`;

    setSaving(true);
    setFormError(null);
    try {
      const next = playlist.map((slot) =>
        slot.slotIndex === editingSlotIndex
          ? {
              ...slot,
              youtubeUrl: formUrl.trim(),
              videoId,
              title: resolvedTitle,
              artist: formArtist.trim(),
              thumbnailUrl: getYouTubeThumbnailUrl(videoId),
              addedAt: slot.addedAt || new Date().toISOString(),
            }
          : slot,
      );
      await onUpdatePlaylist(next);
      setEditingSlotIndex(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan lagu.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearSlot = async (slotIndex: number) => {
    const next = playlist.map((slot) =>
      slot.slotIndex === slotIndex
        ? {
            slotIndex,
            youtubeUrl: '',
            videoId: '',
            title: '',
            artist: '',
            thumbnailUrl: '',
            addedAt: null,
          }
        : slot,
    );
    await onUpdatePlaylist(next);
  };

  const handleMoveSlot = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= playlist.length) return;
    const copy = [...playlist];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    const reindexed = copy.map((item, idx) => ({
      ...item,
      slotIndex: idx + 1,
    }));
    await onUpdatePlaylist(reindexed);
  };

  const isPlaylistMode = activeSource === 'playlist';
  const isPlaylistPlaying = isPlaylistMode && isPlaying;
  const activePlaylistError = isPlaylistMode ? playerError : null;
  const currentTrackWatchUrl = currentTrack
    ? currentTrack.youtubeUrl || `https://youtu.be/${currentTrack.videoId}`
    : '';

  return (
    <div className="relative min-h-screen pt-24 pb-28">
      <div className="fixed inset-0 -z-10">
        <img
          src={SUNSET_BG}
          alt="Matahari terbenam di danau Pegunungan Swiss"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#172840]/80 via-[#263C59]/75 to-[#141e30]/92" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-white">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#FFB6CB] font-semibold">
              Daftar Putar 10 Lagu YouTube
            </p>
            <h1 className="mt-1 font-serif-display text-3xl sm:text-4xl font-bold flex items-center gap-2 text-balance">
              <span>Our Soundtrack</span>
              <Heart className="w-6 h-6 text-[#FFB6CB] fill-[#FFB6CB] shrink-0" />
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-white/80">
              Pemutar piringan hitam bernuansa senja Pegunungan Swiss dengan YouTube IFrame Player API resmi. Pilih lagu mana saja di daftar putar untuk mendengarkan, dengan hanya satu pemutar aktif sekaligus.
            </p>
          </div>

          <div className="shrink-0">
            {isOwner ? (
              <button
                type="button"
                onClick={openFirstEmptySlot}
                className="px-4 py-2.5 rounded-xl bg-[#FFB6CB] text-[#263C59] text-sm font-semibold flex items-center gap-2 hover:bg-[#ffa5bf] transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Lagu</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequestUnlock}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Lock className="w-4 h-4" />
                <span>Kelola Lagu (Pemilik)</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Piringan Hitam & Kontrol Utama */}
          <div className="lg:col-span-5 rounded-3xl bg-white/12 backdrop-blur-xl border border-white/20 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between text-xs text-white/75 mb-4">
              <span>
                {currentTrack
                  ? `Lagu #${String(currentTrack.slotIndex).padStart(2, '0')}`
                  : 'Pemutar Lagu'}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  activePlaylistError
                    ? 'bg-rose-500/25 text-rose-100 border border-rose-300/35'
                    : isPlaylistPlaying
                      ? 'bg-[#FFB6CB]/25 text-[#FFB6CB] border border-[#FFB6CB]/40'
                      : 'bg-white/10 text-white/80'
                }`}
              >
                {activePlaylistError
                  ? 'Embed dibatasi'
                  : isPlaylistPlaying
                    ? 'Sedang diputar ♪'
                    : isPlaylistMode && isBuffering
                      ? 'Memuat lagu...'
                      : isPlaylistMode
                        ? 'Dijeda'
                        : 'Siap diputar'}
              </span>
            </div>

            <div className="relative w-52 h-52 sm:w-60 sm:h-60 mx-auto my-2 flex items-center justify-center">
              <div
                className={`w-full h-full rounded-full bg-gradient-to-tr from-[#111827] via-[#1f2937] to-[#0f172a] border-4 border-white/20 shadow-2xl flex items-center justify-center relative ${
                  isPlaylistPlaying ? 'animate-vinyl-spin' : 'animate-vinyl-paused'
                }`}
              >
                <div className="absolute inset-4 rounded-full border border-white/10" />
                <div className="absolute inset-8 rounded-full border border-white/10" />
                <div className="absolute inset-12 rounded-full border border-white/10" />
                <div className="absolute inset-16 rounded-full border border-white/10" />

                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FFB6CB] bg-[#263C59] flex items-center justify-center relative z-10">
                  {currentTrack?.thumbnailUrl ? (
                    <img
                      src={currentTrack.thumbnailUrl}
                      alt={currentTrack.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc3 className="w-9 h-9 text-[#FFB6CB]" />
                  )}
                  <span className="absolute w-3 h-3 rounded-full bg-[#111827] border border-white/60" />
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-white leading-snug">
                {currentTrack ? currentTrack.title : 'Belum Ada Lagu Dipilih'}
              </h2>
              <p className="text-sm text-[#FFB6CB] mt-1 truncate">
                {currentTrack
                  ? currentTrack.artist || 'Untuk Ityin'
                  : 'Daftar lagu masih kosong — 10 slot siap diisi'}
              </p>
            </div>

            {activePlaylistError && currentTrack && (
              <div
                role="alert"
                className="mt-4 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-300/40 text-xs text-rose-100 text-center space-y-2.5"
              >
                <div className="flex items-center justify-center gap-1.5 font-semibold text-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Lagu Tidak Dapat Diputar dalam Embed</span>
                </div>
                <p className="text-rose-100/90 leading-relaxed">
                  {activePlaylistError}
                </p>
                <a
                  href={currentTrackWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFB6CB] text-[#263C59] font-semibold hover:bg-[#ffa5bf] transition-colors"
                >
                  <span>Tonton di YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="mt-6">
              <input
                type="range"
                aria-label="Progres lagu"
                min={0}
                max={isPlaylistMode && duration > 0 ? Math.floor(duration) : 100}
                value={
                  isPlaylistMode && duration > 0
                    ? Math.min(Math.floor(currentTime), Math.floor(duration))
                    : 0
                }
                disabled={!currentTrack || !isPlaylistMode}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full accent-[#FFB6CB] h-1.5 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-xs text-white/70 mt-1.5 font-mono tabular-nums">
                <span>{isPlaylistMode ? formatTimeSeconds(currentTime) : '0:00'}</span>
                <span>{isPlaylistMode ? formatTimeSeconds(duration) : '0:00'}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={toggleShuffle}
                aria-label="Acak urutan lagu"
                aria-pressed={shuffle}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  shuffle
                    ? 'bg-[#FFB6CB] text-[#263C59]'
                    : 'text-white/75 hover:bg-white/10'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={prevTrack}
                disabled={publishedTracks.length === 0}
                aria-label="Lagu sebelumnya"
                className="w-11 h-11 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-35 transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentTrack && !isPlaylistMode) {
                    selectAndPlaySlot(currentTrack.slotIndex);
                  } else {
                    togglePlayPause();
                  }
                }}
                disabled={!currentTrack}
                aria-label={isPlaylistPlaying ? 'Jeda' : 'Putar'}
                className="w-14 h-14 rounded-full bg-[#FFB6CB] hover:bg-[#ffa5bf] text-[#263C59] flex items-center justify-center shadow-lg disabled:opacity-40 transition-all active:scale-95"
              >
                {isPlaylistMode && isBuffering ? (
                  <Music className="w-6 h-6" />
                ) : isPlaylistPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={nextTrack}
                disabled={publishedTracks.length === 0}
                aria-label="Lagu berikutnya"
                className="w-11 h-11 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-35 transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={toggleRepeat}
                aria-label="Ulangi lagu"
                aria-pressed={repeat}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  repeat
                    ? 'bg-[#FFB6CB] text-[#263C59]'
                    : 'text-white/75 hover:bg-white/10'
                }`}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3 px-2">
              <Volume2 className="w-4 h-4 text-white/75 shrink-0" />
              <input
                type="range"
                aria-label="Volume pemutar"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#FFB6CB] h-1.5 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-white/75 w-8 text-right">
                {volume}%
              </span>
            </div>
          </div>

          {/* 10 Slot Playlist */}
          <div className="lg:col-span-7 rounded-3xl bg-white/12 backdrop-blur-xl border border-white/20 p-5 sm:p-7 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="font-serif-display text-xl font-bold text-white">
                  Slot Daftar Lagu ({publishedTracks.length} / 10 Terisi)
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  {isOwner
                    ? 'Mode Pemilik aktif — tambah, edit, urutkan ulang, atau hapus slot 1–10.'
                    : publishedTracks.length < 10
                      ? `Klik lagu untuk memutar. Slot ${publishedTracks.length + 1}–10 dapat diisi melalui Studio Pemilik.`
                      : 'Klik lagu untuk memutar seluruh 10 lagu spesial untuk Ityin.'}
                </p>
              </div>
            </div>

            {publishedTracks.length === 0 && !isOwner ? (
              <div className="py-16 px-6 text-center rounded-2xl border border-dashed border-white/25 bg-white/5">
                <div className="w-14 h-14 rounded-2xl bg-[#FFB6CB]/20 text-[#FFB6CB] flex items-center justify-center mx-auto mb-4">
                  <Music className="w-7 h-7" />
                </div>
                <h4 className="font-serif-display text-xl font-semibold text-white">
                  Belum Ada Lagu yang Diunggah
                </h4>
                <p className="mt-2 text-sm text-white/75 max-w-md mx-auto leading-relaxed">
                  Daftar putar dimulai dalam keadaan kosong agar pemilik dapat memilih sendiri 1 hingga 10 lagu YouTube spesial untuk Ityin.
                </p>
                <button
                  type="button"
                  onClick={onRequestUnlock}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-[#FFB6CB] text-[#263C59] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#ffa5bf]"
                >
                  <Lock className="w-4 h-4" />
                  <span>Masuk Studio Pemilik untuk Menambah Lagu</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {playlist.map((slot, index) => {
                  const hasTrack = Boolean(slot.videoId && slot.title.trim());
                  const isSelected =
                    isPlaylistMode && activeSlotIndex === slot.slotIndex;
                  const trackErr = slot.videoId ? erroredVideos[slot.videoId] : undefined;
                  const watchUrl =
                    slot.youtubeUrl ||
                    (slot.videoId ? `https://youtu.be/${slot.videoId}` : '');

                  if (!hasTrack && !isOwner) {
                    return null;
                  }

                  return (
                    <div
                      key={slot.slotIndex}
                      className={`rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border transition-colors ${
                        isSelected && hasTrack
                          ? 'bg-[#FFB6CB]/22 border-[#FFB6CB]/65 shadow-md'
                          : 'bg-white/8 border-white/10 hover:bg-white/12'
                      }`}
                    >
                      {hasTrack ? (
                        <button
                          type="button"
                          onClick={() => selectAndPlaySlot(slot.slotIndex)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left"
                        >
                          <span className="text-xs font-mono tabular-nums text-white/65 w-6 shrink-0 text-center">
                            {isSelected && isPlaying ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FFB6CB] text-[#263C59]">
                                <Pause className="w-3 h-3" />
                              </span>
                            ) : (
                              String(slot.slotIndex).padStart(2, '0')
                            )}
                          </span>
                          <img
                            src={slot.thumbnailUrl || getYouTubeThumbnailUrl(slot.videoId)}
                            alt={slot.title}
                            referrerPolicy="no-referrer"
                            className="w-14 h-10 rounded-lg object-cover shrink-0 bg-black/40 border border-white/10"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white truncate">
                                {slot.title}
                              </p>
                              {isSelected && !trackErr && (
                                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-[#FFB6CB]/25 text-[#FFB6CB] font-semibold">
                                  {isPlaying ? 'Diputar' : 'Aktif'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/70 truncate">
                              {slot.artist || 'Untuk Ityin'}
                            </p>
                            {trackErr && (
                              <p className="mt-1 text-[11px] text-rose-200 flex flex-wrap items-center gap-2">
                                <span>Dibatasi embed (kode {trackErr.code})</span>
                              </p>
                            )}
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openSlotEditor(slot)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left py-1 text-white/60 hover:text-white transition-colors"
                        >
                          <span className="text-xs font-mono tabular-nums w-6 shrink-0 text-center">
                            {String(slot.slotIndex).padStart(2, '0')}
                          </span>
                          <span className="w-14 h-10 rounded-lg border border-dashed border-white/25 flex items-center justify-center shrink-0">
                            <Plus className="w-4 h-4" />
                          </span>
                          <span className="text-sm">
                            Slot Kosong #{slot.slotIndex} — Klik untuk menambah lagu YouTube
                          </span>
                        </button>
                      )}

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {hasTrack && trackErr && watchUrl && (
                          <a
                            href={watchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-full bg-[#FFB6CB] text-[#263C59] text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-[#ffa5bf] transition-colors"
                          >
                            <span>Tonton di YouTube</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {isOwner && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleMoveSlot(index, -1)}
                              disabled={index === 0}
                              aria-label={`Naikkan slot ${slot.slotIndex}`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 disabled:opacity-25"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSlot(index, 1)}
                              disabled={index === playlist.length - 1}
                              aria-label={`Turunkan slot ${slot.slotIndex}`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 disabled:opacity-25"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openSlotEditor(slot)}
                              aria-label={`Edit slot ${slot.slotIndex}`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {hasTrack && (
                              <button
                                type="button"
                                onClick={() => handleClearSlot(slot.slotIndex)}
                                aria-label={`Hapus slot ${slot.slotIndex}`}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-300 hover:bg-rose-500/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!isOwner && playlist.some((s) => !s.videoId) && (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70 border-t border-white/10 mt-3">
                    <span>
                      Slot {publishedTracks.length + 1}–10 masih kosong dan siap diisi oleh pemilik.
                    </span>
                    <button
                      type="button"
                      onClick={onRequestUnlock}
                      className="text-[#FFB6CB] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Isi di Studio Pemilik</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit Lagu */}
      {editingSlotIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0c1422]/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveSlot}
            className="w-full max-w-md bg-white dark:bg-[#172336] text-[#263C59] dark:text-white rounded-2xl p-6 shadow-2xl border border-[#263C59]/10 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-xl font-bold">
                Atur Lagu Slot #{editingSlotIndex}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSlotIndex(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">
                Tautan YouTube (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
                />
                <button
                  type="button"
                  disabled={!previewVideoId || fetchingMeta}
                  onClick={handleFetchMetadata}
                  className="px-3 py-2 rounded-xl border border-[#263C59]/20 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#263C59]/5 dark:hover:bg-white/10 disabled:opacity-40 shrink-0"
                  title="Ambil judul & artis dari YouTube"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{fetchingMeta ? 'Memuat...' : 'Ambil Info'}</span>
                </button>
              </div>
            </div>

            {previewVideoId && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FFF7F0] dark:bg-white/5 border border-[#263C59]/10 dark:border-white/10">
                <img
                  src={getYouTubeThumbnailUrl(previewVideoId)}
                  alt="Pratinjau video YouTube"
                  referrerPolicy="no-referrer"
                  className="w-16 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="text-xs text-[#263C59]/75 dark:text-slate-300">
                  ID YouTube terdeteksi:{' '}
                  <code className="font-mono font-semibold">{previewVideoId}</code>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">
                Judul Lagu
              </label>
              <input
                type="text"
                placeholder={`Lagu Pilihan ${editingSlotIndex}`}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Nama Penyanyi / Artis (Opsional)
              </label>
              <input
                type="text"
                placeholder="Nama artis atau channel"
                value={formArtist}
                onChange={(e) => setFormArtist(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSlotIndex(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium opacity-75 hover:opacity-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Lagu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
