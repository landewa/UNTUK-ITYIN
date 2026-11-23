import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Heart,
  ImagePlus,
  Lock,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { MemoryItem } from '../types/universe';
import { storageAdapter } from '../services/storageService';

interface MemoriesPageProps {
  memories: MemoryItem[];
  isOwner: boolean;
  onUpdateMemories: (nextMemories: MemoryItem[]) => Promise<void>;
  onRequestUnlock: () => void;
}

export const MemoriesPage: React.FC<MemoriesPageProps> = ({
  memories,
  isOwner,
  onUpdateMemories,
  onRequestUnlock,
}) => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const touchStartX = useRef<number | null>(null);

  const handleImageError = useCallback((id: string) => {
    setBrokenImages((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    setLoadedImages((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    setBrokenImages((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % memories.length,
        );
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + memories.length) % memories.length,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, memories.length]);

  const handleFileUploadForSlot = async (file: File, targetId?: string) => {
    setErrorMsg(null);
    setUploading(true);
    try {
      const { url } = await storageAdapter.uploadPhoto(file);
      if (targetId) {
        const updated = memories.map((m) =>
          m.id === targetId ? { ...m, imageUrl: url } : m,
        );
        await onUpdateMemories(updated);
        setBrokenImages((prev) => {
          const copy = { ...prev };
          delete copy[targetId];
          return copy;
        });
      } else {
        setNewImageUrl(url);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengunggah gambar.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;
    setErrorMsg(null);
    try {
      const updated = memories.map((m) =>
        m.id === editingMemory.id ? editingMemory : m,
      );
      await onUpdateMemories(updated);
      setEditingMemory(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newImageUrl.trim()) {
      setErrorMsg('Silakan unggah foto atau masukkan URL gambar beserta judulnya.');
      return;
    }
    setErrorMsg(null);
    const nextItem: MemoryItem = {
      id: `memory-${Date.now()}`,
      slotNumber: memories.length + 1,
      imageUrl: newImageUrl.trim(),
      title: newTitle.trim(),
      date: newDate.trim() || 'Tanggal Dapat Diubah',
      description: newDescription.trim() || 'Potret indah Ityin yang selalu dikenang.',
      frameStyle: (['polaroid', 'linen', 'vintage'] as const)[
        memories.length % 3
      ],
      isDefaultSlot: false,
    };
    try {
      await onUpdateMemories([...memories, nextItem]);
      setAddingNew(false);
      setNewTitle('');
      setNewDate('');
      setNewDescription('');
      setNewImageUrl('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menambahkan foto.');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    setErrorMsg(null);
    try {
      const filtered = memories.filter((m) => m.id !== id);
      await onUpdateMemories(filtered);
      if (lightboxIndex !== null) setLightboxIndex(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menghapus foto.');
    }
  };

  const activeLightbox =
    lightboxIndex !== null ? memories[lightboxIndex] ?? null : null;

  const loadedCount = memories.filter((m) => loadedImages[m.id]).length;
  const missingCount = memories.filter((m) => brokenImages[m.id]).length;

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#263C59]/65 dark:text-[#B3D9F2] font-semibold">
            Koleksi Potret Pribadi Ityin · {loadedCount} Terpasang · {missingCount} Slot Siap Diisi
          </p>
          <h1 className="mt-1 font-serif-display text-3xl sm:text-4xl font-bold text-[#263C59] dark:text-white flex items-center gap-2 text-balance">
            <span>Our Memories</span>
            <Heart className="w-6 h-6 text-[#FFB6CB] fill-[#FFB6CB] shrink-0" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#263C59]/75 dark:text-slate-300">
            Menampilkan 10 slot potret Ityin dengan rasio asli dari folder{' '}
            <code className="text-xs px-1.5 py-0.5 rounded bg-[#263C59]/8 dark:bg-white/10">
              public/images/ityin/
            </code>{' '}
            atau unggahan langsung melalui Studio Pemilik.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOwner ? (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="px-4 py-2.5 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Tambah Foto</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequestUnlock}
              className="px-4 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/20 text-[#263C59] dark:text-slate-200 text-sm font-medium flex items-center gap-2 hover:bg-[#263C59]/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <Lock className="w-4 h-4" />
              <span>Buka Mode Pemilik untuk Mengelola</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm"
        >
          {errorMsg}
        </div>
      )}

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {memories.map((item, idx) => {
          const isMissing = Boolean(brokenImages[item.id]);
          const tiltClass =
            idx % 3 === 0
              ? 'sm:-rotate-1 hover:rotate-0'
              : idx % 3 === 1
                ? 'sm:rotate-1 hover:rotate-0'
                : 'hover:-translate-y-1';

          return (
            <article
              key={item.id}
              className={`break-inside-avoid bg-white dark:bg-[#172336] rounded-2xl p-3.5 pb-5 shadow-md border border-[#263C59]/10 dark:border-white/10 transition-all duration-200 ${tiltClass}`}
            >
              <div className="relative rounded-xl overflow-hidden bg-[#FFF7F0] dark:bg-[#0f1929]">
                {!isMissing ? (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="w-full block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB]"
                    aria-label={`Lihat ${item.title} dalam layar penuh`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={`${item.title} — ${item.description}`}
                      referrerPolicy="no-referrer"
                      onLoad={() => handleImageLoad(item.id)}
                      onError={() => handleImageError(item.id)}
                      className="w-full h-auto block object-contain"
                    />
                  </button>
                ) : (
                  <div className="aspect-[3/4] w-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#B3D9F2]/30 via-[#FFF7F0] to-[#FFB6CB]/30 dark:from-[#1b2b44] dark:via-[#142033] dark:to-[#2b213b]">
                    <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-white/10 flex items-center justify-center shadow-sm mb-3">
                      <Camera className="w-6 h-6 text-[#263C59] dark:text-[#FFB6CB]" />
                    </div>
                    <p className="font-serif-display text-base font-semibold text-[#263C59] dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-xs text-[#263C59]/70 dark:text-slate-300 max-w-[230px]">
                      Simpan file{' '}
                      <code className="font-mono">
                        ityin-{String(item.slotNumber).padStart(2, '0')}.jpg
                      </code>{' '}
                      di <code className="font-mono">public/images/ityin/</code> atau unggah langsung melalui Studio Pemilik.
                    </p>
                    {isOwner && (
                      <label className="mt-4 px-3.5 py-2 rounded-lg bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 hover:opacity-90">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploading ? 'Mengunggah...' : 'Unggah Potret'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUploadForSlot(f, item.id);
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 px-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-serif-display text-lg font-semibold text-[#263C59] dark:text-white leading-snug">
                      {item.title}
                    </h2>
                    <p className="text-xs text-[#263C59]/60 dark:text-slate-400 mt-0.5">
                      {item.date}
                    </p>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-1 shrink-0">
                      <label
                        title="Ganti foto"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#263C59]/70 dark:text-slate-300 hover:bg-[#263C59]/10 dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUploadForSlot(f, item.id);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditingMemory({ ...item })}
                        aria-label={`Edit ${item.title}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#263C59]/70 dark:text-slate-300 hover:bg-[#263C59]/10 dark:hover:bg-white/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {!item.isDefaultSlot && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMemory(item.id)}
                          aria-label={`Hapus ${item.title}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="mt-2 font-handwritten text-xl text-[#263C59]/85 dark:text-slate-200 leading-snug">
                  {item.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Lightbox Layar Penuh */}
      {activeLightbox && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeLightbox.title}
          className="fixed inset-0 z-50 bg-[#0c1422]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(diff) > 45) {
              if (diff < 0) {
                setLightboxIndex((lightboxIndex + 1) % memories.length);
              } else {
                setLightboxIndex(
                  (lightboxIndex - 1 + memories.length) % memories.length,
                );
              }
            }
            touchStartX.current = null;
          }}
        >
          <div className="flex items-center justify-between text-white">
            <div className="text-xs sm:text-sm text-white/75 tabular-nums">
              {lightboxIndex + 1} / {memories.length} · {activeLightbox.date}
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Tutup pratinjau foto"
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setLightboxIndex(
                  (lightboxIndex - 1 + memories.length) % memories.length,
                )
              }
              aria-label="Foto sebelumnya"
              className="hidden sm:flex absolute left-2 z-10 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={activeLightbox.imageUrl}
              alt={activeLightbox.title}
              referrerPolicy="no-referrer"
              className="max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl"
            />

            <button
              type="button"
              onClick={() =>
                setLightboxIndex((lightboxIndex + 1) % memories.length)
              }
              aria-label="Foto berikutnya"
              className="hidden sm:flex absolute right-2 z-10 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center max-w-xl mx-auto text-white pb-2">
            <h3 className="font-serif-display text-xl sm:text-2xl font-semibold">
              {activeLightbox.title}
            </h3>
            <p className="mt-1 font-handwritten text-xl text-[#FFB6CB]">
              {activeLightbox.description}
            </p>
            <p className="mt-1 text-[11px] text-white/50 sm:hidden">
              Geser ke kiri atau kanan untuk melihat foto lain
            </p>
          </div>
        </div>
      )}

      {/* Modal Edit Potret */}
      {editingMemory && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0c1422]/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md bg-white dark:bg-[#172336] rounded-2xl p-6 shadow-2xl border border-[#263C59]/10 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-xl font-bold text-[#263C59] dark:text-white">
                Edit Keterangan Potret
              </h3>
              <button
                type="button"
                onClick={() => setEditingMemory(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#263C59]/70 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Judul
              </label>
              <input
                type="text"
                required
                value={editingMemory.title}
                onChange={(e) =>
                  setEditingMemory({ ...editingMemory, title: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Tanggal
              </label>
              <input
                type="text"
                value={editingMemory.date}
                onChange={(e) =>
                  setEditingMemory({ ...editingMemory, date: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                URL atau Lokasi Gambar
              </label>
              <input
                type="text"
                required
                value={editingMemory.imageUrl}
                onChange={(e) =>
                  setEditingMemory({ ...editingMemory, imageUrl: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Deskripsi / Keterangan
              </label>
              <textarea
                rows={3}
                value={editingMemory.description}
                onChange={(e) =>
                  setEditingMemory({
                    ...editingMemory,
                    description: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMemory(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#263C59]/75 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Tambah Foto Baru */}
      {addingNew && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0c1422]/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleAddMemory}
            className="w-full max-w-md bg-white dark:bg-[#172336] rounded-2xl p-6 shadow-2xl border border-[#263C59]/10 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-xl font-bold text-[#263C59] dark:text-white">
                Tambah Foto Kenangan Baru
              </h3>
              <button
                type="button"
                onClick={() => setAddingNew(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#263C59]/70 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1.5">
                Unggah File Foto
              </label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#263C59]/30 dark:border-white/25 cursor-pointer hover:bg-[#263C59]/5 dark:hover:bg-white/5 text-sm text-[#263C59] dark:text-slate-200">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Mengunggah...' : 'Pilih foto dari perangkat'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUploadForSlot(f);
                  }}
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Atau Masukkan URL Foto
              </label>
              <input
                type="text"
                placeholder="/images/ityin/ityin-01.jpg atau URL gambar"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Judul
              </label>
              <input
                type="text"
                required
                placeholder="Senyum Sore di Musim Semi"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Tanggal
              </label>
              <input
                type="text"
                placeholder="November 2026"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Keterangan / Cerita
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan cerita manis di balik foto ini..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddingNew(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#263C59]/75 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold disabled:opacity-50"
              >
                Simpan Foto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
