import React, { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CalendarHeart,
  Edit3,
  Heart,
  Lock,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { JourneyData, MilestoneItem } from '../types/universe';

interface JourneyPageProps {
  journey: JourneyData;
  isOwner: boolean;
  onSaveJourney: (nextJourney: JourneyData) => Promise<void>;
  onRequestUnlock: () => void;
}

function getElapsedParts(startIso: string | null, nowMs: number) {
  if (!startIso) return null;
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return null;
  const diff = Math.max(0, nowMs - start);
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { totalDays, hours, minutes, seconds };
}

function computeUpcomingAnniversaries(startIso: string | null, nowMs: number) {
  if (!startIso) return [];
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return [];

  const results: Array<{ label: string; dateStr: string; daysAway: number }> = [];
  const dayMs = 1000 * 60 * 60 * 24;
  const elapsedDays = Math.floor((nowMs - start.getTime()) / dayMs);

  // Perayaan 100 hari berikutnya
  const nextHundred = (Math.floor(Math.max(0, elapsedDays) / 100) + 1) * 100;
  const hundredDate = new Date(start.getTime() + nextHundred * dayMs);
  const hundredAway = Math.max(0, Math.ceil((hundredDate.getTime() - nowMs) / dayMs));
  results.push({
    label: `${nextHundred} Hari Bersama`,
    dateStr: hundredDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    daysAway: hundredAway,
  });

  // Hari jadi tahunan berikutnya
  const now = new Date(nowMs);
  let nextYear = now.getFullYear();
  let anniv = new Date(start);
  anniv.setFullYear(nextYear);
  if (anniv.getTime() < nowMs - dayMs) {
    nextYear += 1;
    anniv = new Date(start);
    anniv.setFullYear(nextYear);
  }
  const yearsCount = Math.max(1, nextYear - start.getFullYear());
  const annivAway = Math.max(0, Math.ceil((anniv.getTime() - nowMs) / dayMs));
  results.push({
    label: `Hari Jadi ke-${yearsCount} Tahun`,
    dateStr: anniv.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    daysAway: annivAway,
  });

  // Peringatan bulanan berikutnya
  const nextMonth = new Date(now.getFullYear(), now.getMonth(), start.getDate());
  if (nextMonth.getTime() < nowMs - dayMs) {
    nextMonth.setMonth(nextMonth.getMonth() + 1);
  }
  const monthAway = Math.max(0, Math.ceil((nextMonth.getTime() - nowMs) / dayMs));
  results.push({
    label: 'Hari Jadi Bulanan',
    dateStr: nextMonth.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    daysAway: monthAway,
  });

  return results;
}

export const JourneyPage: React.FC<JourneyPageProps> = ({
  journey,
  isOwner,
  onSaveJourney,
  onRequestUnlock,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [editingDate, setEditingDate] = useState(false);
  const [startInput, setStartInput] = useState(journey.startDate || '');
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(
    null,
  );
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Omit<MilestoneItem, 'id'>>({
    date: '',
    title: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setStartInput(journey.startDate || '');
  }, [journey.startDate]);

  const elapsed = useMemo(
    () => getElapsedParts(journey.startDate, nowMs),
    [journey.startDate, nowMs],
  );

  const anniversaries = useMemo(
    () => computeUpcomingAnniversaries(journey.startDate, nowMs),
    [journey.startDate, nowMs],
  );

  const handleSaveStartDate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveJourney({
      ...journey,
      startDate: startInput ? startInput : null,
    });
    setEditingDate(false);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.title.trim()) return;
    const item: MilestoneItem = {
      id: `milestone-${Date.now()}`,
      date: newMilestone.date.trim() || 'Tanggal Spesial',
      title: newMilestone.title.trim(),
      location: newMilestone.location.trim() || 'Bersama',
      description: newMilestone.description.trim(),
    };
    await onSaveJourney({
      ...journey,
      milestones: [...journey.milestones, item],
    });
    setAddingMilestone(false);
    setNewMilestone({ date: '', title: '', location: '', description: '' });
  };

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;
    await onSaveJourney({
      ...journey,
      milestones: journey.milestones.map((m) =>
        m.id === editingMilestone.id ? editingMilestone : m,
      ),
    });
    setEditingMilestone(null);
  };

  const handleDeleteMilestone = async (id: string) => {
    await onSaveJourney({
      ...journey,
      milestones: journey.milestones.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-28 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#263C59]/65 dark:text-[#B3D9F2] font-semibold">
            Penghitung Waktu & Lini Masa Hubungan
          </p>
          <h1 className="mt-1 font-serif-display text-3xl sm:text-4xl font-bold text-[#263C59] dark:text-white flex items-center gap-2 text-balance">
            <span>Our Journey</span>
            <Heart className="w-6 h-6 text-[#FFB6CB] fill-[#FFB6CB] shrink-0" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#263C59]/75 dark:text-slate-300">
            Setiap hari, jam, menit, dan detik dihitung langsung dari tanggal awal kalian yang sebenarnya, lengkap dengan momen berkesan dan pengingat hari jadi.
          </p>
        </div>

        <div className="shrink-0">
          {isOwner ? (
            <button
              type="button"
              onClick={() => setEditingDate(true)}
              className="px-4 py-2.5 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold flex items-center gap-2 hover:opacity-90"
            >
              <CalendarHeart className="w-4 h-4" />
              <span>
                {journey.startDate ? 'Ubah Tanggal Mulai' : 'Atur Tanggal Mulai'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequestUnlock}
              className="px-4 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/20 text-[#263C59] dark:text-slate-200 text-sm font-medium flex items-center gap-2 hover:bg-[#263C59]/5 dark:hover:bg-white/10"
            >
              <Lock className="w-4 h-4" />
              <span>Atur Tanggal (Pemilik)</span>
            </button>
          )}
        </div>
      </div>

      {/* Kartu Penghitung Langsung */}
      <section className="glass-panel rounded-3xl p-6 sm:p-10 shadow-xl mb-10">
        {elapsed ? (
          <div className="text-center">
            <p className="text-sm font-medium text-[#263C59]/70 dark:text-[#B3D9F2]">
              Menghitung langkah bersama sejak{' '}
              <span className="font-semibold text-[#263C59] dark:text-white">
                {new Date(journey.startDate!).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                ['Hari', elapsed.totalDays],
                ['Jam', elapsed.hours],
                ['Menit', elapsed.minutes],
                ['Detik', elapsed.seconds],
              ].map(([label, val]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl bg-white/85 dark:bg-[#172336] border border-[#263C59]/10 dark:border-white/10 py-6 px-4 shadow-sm"
                >
                  <div className="font-serif-display text-4xl sm:text-5xl font-bold text-[#263C59] dark:text-white tabular-nums">
                    {String(val).padStart(2, '0')}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-widest text-[#263C59]/65 dark:text-[#FFB6CB] font-semibold">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#FFB6CB]/30 text-[#263C59] dark:text-[#FFB6CB] flex items-center justify-center mx-auto mb-4">
              <CalendarHeart className="w-7 h-7" />
            </div>
            <h2 className="font-serif-display text-2xl font-bold text-[#263C59] dark:text-white">
              Tanggal Awal Hubungan Belum Diatur
            </h2>
            <p className="mt-2 text-sm text-[#263C59]/75 dark:text-slate-300 leading-relaxed">
              Kami tidak pernah mengarang tanggal mulai hubungan kalian. Masuk ke Studio Pemilik untuk mengisi tanggal awal yang sebenarnya dan mengaktifkan penghitung Hari · Jam · Menit · Detik serta pengingat hari jadi.
            </p>
            <button
              type="button"
              onClick={() => (isOwner ? setEditingDate(true) : onRequestUnlock())}
              className="mt-5 px-5 py-2.5 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold"
            >
              {isOwner ? 'Atur Tanggal Awal Kita' : 'Masuk ke Studio Pemilik'}
            </button>
          </div>
        )}
      </section>

      {/* Pengingat Hari Jadi */}
      {anniversaries.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <BellRing className="w-5 h-5 text-[#e11d48] dark:text-[#FFB6CB]" />
            <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#263C59] dark:text-white">
              Pengingat Hari Jadi Berikutnya
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {anniversaries.map((ann) => (
              <div
                key={ann.label}
                className="rounded-2xl bg-white/85 dark:bg-[#172336] border border-[#263C59]/10 dark:border-white/10 p-5 shadow-sm"
              >
                <p className="text-xs font-semibold text-[#e11d48] dark:text-[#FFB6CB]">
                  {ann.daysAway === 0
                    ? 'Hari Ini!'
                    : `${ann.daysAway} hari lagi`}
                </p>
                <h3 className="mt-1 font-serif-display text-lg font-bold text-[#263C59] dark:text-white">
                  {ann.label}
                </h3>
                <p className="mt-1 text-sm text-[#263C59]/70 dark:text-slate-300">
                  {ann.dateStr}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lini Masa Momen Berkesan */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="font-serif-display text-2xl font-bold text-[#263C59] dark:text-white">
            Lini Masa Momen Berkesan
          </h2>
          {isOwner && (
            <button
              type="button"
              onClick={() => setAddingMilestone(true)}
              className="px-4 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kenangan</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {journey.milestones.map((m, idx) => (
            <article
              key={m.id}
              className="rounded-2xl bg-white/85 dark:bg-[#172336] border border-[#263C59]/10 dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#B3D9F2]/35 dark:bg-[#B3D9F2]/15 text-[#263C59] dark:text-[#B3D9F2] font-serif-display font-bold flex items-center justify-center shrink-0 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#263C59]/65 dark:text-slate-400">
                    <span>{m.date}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {m.location}
                    </span>
                  </div>
                  <h3 className="mt-1 font-serif-display text-xl font-semibold text-[#263C59] dark:text-white">
                    {m.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#263C59]/80 dark:text-slate-300 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>

              {isOwner && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingMilestone({ ...m })}
                    aria-label={`Edit ${m.title}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#263C59]/70 dark:text-slate-300 hover:bg-[#263C59]/10 dark:hover:bg-white/10"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(m.id)}
                    aria-label={`Hapus ${m.title}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Modal Tanggal Mulai */}
      {editingDate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0c1422]/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveStartDate}
            className="w-full max-w-md bg-white dark:bg-[#172336] rounded-2xl p-6 shadow-2xl border border-[#263C59]/10 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-xl font-bold text-[#263C59] dark:text-white">
                Atur Tanggal Awal Hubungan
              </h3>
              <button
                type="button"
                onClick={() => setEditingDate(false)}
                aria-label="Tutup jendela"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Tanggal & Waktu Mulai
              </label>
              <input
                type="datetime-local"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
              <p className="mt-1.5 text-xs text-[#263C59]/65 dark:text-slate-400">
                Kosongkan lalu simpan jika ingin mengembalikan ke status belum diatur.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDate(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#263C59]/75 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold"
              >
                Simpan Tanggal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Tambah / Edit Kenangan */}
      {(addingMilestone || editingMilestone) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0c1422]/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={editingMilestone ? handleUpdateMilestone : handleAddMilestone}
            className="w-full max-w-md bg-white dark:bg-[#172336] rounded-2xl p-6 shadow-2xl border border-[#263C59]/10 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-xl font-bold text-[#263C59] dark:text-white">
                {editingMilestone ? 'Edit Kenangan' : 'Tambah Kenangan'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setAddingMilestone(false);
                  setEditingMilestone(null);
                }}
                aria-label="Tutup jendela"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Judul Kenangan
              </label>
              <input
                type="text"
                required
                value={
                  editingMilestone ? editingMilestone.title : newMilestone.title
                }
                onChange={(e) =>
                  editingMilestone
                    ? setEditingMilestone({
                        ...editingMilestone,
                        title: e.target.value,
                      })
                    : setNewMilestone({
                        ...newMilestone,
                        title: e.target.value,
                      })
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
                placeholder="cth. 14 Oktober 2025"
                value={
                  editingMilestone ? editingMilestone.date : newMilestone.date
                }
                onChange={(e) =>
                  editingMilestone
                    ? setEditingMilestone({
                        ...editingMilestone,
                        date: e.target.value,
                      })
                    : setNewMilestone({ ...newMilestone, date: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Lokasi
              </label>
              <input
                type="text"
                placeholder="Kota atau tempat spesial"
                value={
                  editingMilestone
                    ? editingMilestone.location
                    : newMilestone.location
                }
                onChange={(e) =>
                  editingMilestone
                    ? setEditingMilestone({
                        ...editingMilestone,
                        location: e.target.value,
                      })
                    : setNewMilestone({
                        ...newMilestone,
                        location: e.target.value,
                      })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#263C59] dark:text-slate-200 mb-1">
                Cerita / Catatan
              </label>
              <textarea
                rows={3}
                value={
                  editingMilestone
                    ? editingMilestone.description
                    : newMilestone.description
                }
                onChange={(e) =>
                  editingMilestone
                    ? setEditingMilestone({
                        ...editingMilestone,
                        description: e.target.value,
                      })
                    : setNewMilestone({
                        ...newMilestone,
                        description: e.target.value,
                      })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm text-[#263C59] dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAddingMilestone(false);
                  setEditingMilestone(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#263C59]/75 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold"
              >
                Simpan Kenangan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
