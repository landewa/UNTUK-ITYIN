import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Edit3,
  Heart,
  Lock,
  Plus,
  Signpost,
  Trash2,
  X,
} from 'lucide-react';
import type { DreamCategory, DreamItem } from '../types/universe';

const GARDEN_BG = '/src/assets/images/swiss_garden_dreams_bg_1795428587595.jpg';

const CATEGORIES: DreamCategory[] = [
  'Travel',
  'Home',
  'Business',
  'Future',
  'Personal Dreams',
];

const CATEGORY_LABELS: Record<DreamCategory, string> = {
  Travel: 'Perjalanan',
  Home: 'Rumah',
  Business: 'Usaha',
  Future: 'Masa Depan',
  'Personal Dreams': 'Impian Pribadi',
};

interface DreamSpacePageProps {
  dreams: DreamItem[];
  isOwner: boolean;
  onSaveDreams: (nextDreams: DreamItem[]) => Promise<void>;
  onRequestUnlock: () => void;
}

export const DreamSpacePage: React.FC<DreamSpacePageProps> = ({
  dreams,
  isOwner,
  onSaveDreams,
  onRequestUnlock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | DreamCategory>('All');
  const [editingDream, setEditingDream] = useState<DreamItem | null>(null);
  const [addingDream, setAddingDream] = useState(false);
  const [draft, setDraft] = useState<Omit<DreamItem, 'id'>>({
    title: '',
    category: 'Travel',
    description: '',
    targetDate: '',
    completed: false,
    progress: 20,
  });

  const filtered = useMemo(
    () =>
      selectedCategory === 'All'
        ? dreams
        : dreams.filter((d) => d.category === selectedCategory),
    [dreams, selectedCategory],
  );

  const completedCount = dreams.filter((d) => d.completed).length;
  const overallPercent =
    dreams.length === 0
      ? 0
      : Math.round(
          dreams.reduce((acc, d) => acc + (d.completed ? 100 : d.progress), 0) /
            dreams.length,
        );

  const handleToggleCompleted = async (id: string) => {
    if (!isOwner) {
      onRequestUnlock();
      return;
    }
    const next = dreams.map((d) =>
      d.id === id
        ? {
            ...d,
            completed: !d.completed,
            progress: !d.completed ? 100 : Math.min(d.progress, 80),
          }
        : d,
    );
    await onSaveDreams(next);
  };

  const handleCreateDream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    const item: DreamItem = {
      id: `dream-${Date.now()}`,
      title: draft.title.trim(),
      category: draft.category,
      description: draft.description.trim(),
      targetDate: draft.targetDate.trim() || 'Suatu Hari Bersama',
      completed: draft.completed,
      progress: draft.completed ? 100 : draft.progress,
    };
    await onSaveDreams([...dreams, item]);
    setAddingDream(false);
    setDraft({
      title: '',
      category: 'Travel',
      description: '',
      targetDate: '',
      completed: false,
      progress: 20,
    });
  };

  const handleUpdateDream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDream) return;
    const next = dreams.map((d) =>
      d.id === editingDream.id
        ? {
            ...editingDream,
            progress: editingDream.completed ? 100 : editingDream.progress,
          }
        : d,
    );
    await onSaveDreams(next);
    setEditingDream(null);
  };

  const handleDeleteDream = async (id: string) => {
    await onSaveDreams(dreams.filter((d) => d.id !== id));
  };

  return (
    <div className="relative min-h-screen pt-24 pb-28">
      {/* Latar Taman Bunga Alpen Swiss */}
      <div className="fixed inset-0 -z-10">
        <img
          src={GARDEN_BG}
          alt="Taman bunga pegunungan Alpen Swiss dan chalet kayu"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#172840]/72 via-[#1e314d]/68 to-[#131f33]/88" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#FFB6CB] font-semibold">
              Papan Petunjuk Impian Taman Alpen Swiss
            </p>
            <h1 className="mt-1 font-serif-display text-3xl sm:text-4xl font-bold flex items-center gap-2 text-balance">
              <span>Our Dream Space</span>
              <Heart className="w-6 h-6 text-[#FFB6CB] fill-[#FFB6CB] shrink-0" />
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-white/85">
              Setiap impian yang kita tanam bersama — mulai dari perjalanan, rumah impian, usaha, hingga masa depan yang ingin kita wujudkan berdua.
            </p>
          </div>

          <div className="shrink-0">
            {isOwner ? (
              <button
                type="button"
                onClick={() => setAddingDream(true)}
                className="px-4 py-2.5 rounded-xl bg-[#FFB6CB] text-[#263C59] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#ffa5bf]"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Impian</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequestUnlock}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-medium inline-flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Masuk untuk Edit Impian</span>
              </button>
            )}
          </div>
        </div>

        {/* Kartu Progres Keseluruhan */}
        <div className="rounded-3xl bg-white/14 backdrop-blur-xl border border-white/20 p-5 sm:p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 font-serif-display text-lg font-semibold">
              <Signpost className="w-5 h-5 text-[#FFB6CB]" />
              <span>Progres Impian Bersama</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-[#FFB6CB]">
              {completedCount} dari {dreams.length} Tercapai · {overallPercent}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FFB6CB] via-[#C7A6F5] to-[#B3D9F2] transition-all duration-300"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        {/* Tab Kategori Papan Kayu */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-[#FFB6CB] text-[#263C59]'
                : 'bg-white/12 text-white hover:bg-white/20 border border-white/15'
            }`}
          >
            Semua Impian ({dreams.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = dreams.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#FFB6CB] text-[#263C59]'
                    : 'bg-white/12 text-white hover:bg-white/20 border border-white/15'
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>

        {/* Kartu Impian */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-dashed border-white/25 p-12 text-center">
            <p className="font-serif-display text-xl font-semibold">
              Belum ada impian di kategori ini
            </p>
            <p className="text-sm text-white/75 mt-1">
              Tambahkan papan impian baru untuk mulai merencanakan masa depan bersama.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((dream) => (
              <article
                key={dream.id}
                className="rounded-2xl bg-white/14 backdrop-blur-xl border border-white/20 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-[#FFB6CB] font-medium">
                      <span>{CATEGORY_LABELS[dream.category] || dream.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-white/75">{dream.targetDate}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleCompleted(dream.id)}
                        aria-label={
                          dream.completed
                            ? `Tandai ${dream.title} belum tercapai`
                            : `Tandai ${dream.title} sudah tercapai`
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
                      >
                        {dream.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/60" />
                        )}
                      </button>

                      {isOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingDream({ ...dream })}
                            aria-label={`Edit ${dream.title}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/15"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDream(dream.id)}
                            aria-label={`Hapus ${dream.title}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-300 hover:bg-rose-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <h2
                    className={`mt-2 font-serif-display text-xl font-bold ${
                      dream.completed ? 'line-through text-white/70' : 'text-white'
                    }`}
                  >
                    {dream.title}
                  </h2>

                  <p className="mt-2 text-sm text-white/85 leading-relaxed">
                    {dream.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-white/75 mb-1.5 tabular-nums">
                    <span>
                      {dream.completed ? 'Tercapai ♡' : 'Progres Perjalanan'}
                    </span>
                    <span>{dream.completed ? 100 : dream.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        dream.completed ? 'bg-emerald-300' : 'bg-[#FFB6CB]'
                      }`}
                      style={{
                        width: `${dream.completed ? 100 : dream.progress}%`,
                      }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Impian */}
      {(addingDream || editingDream) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0c1422]/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={editingDream ? handleUpdateDream : handleCreateDream}
            className="w-full max-w-md bg-white dark:bg-[#172336] text-[#263C59] dark:text-white rounded-2xl p-6 shadow-2xl border border-[#263C59]/10 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-xl font-bold">
                {editingDream ? 'Edit Papan Impian' : 'Tanam Impian Baru'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setAddingDream(false);
                  setEditingDream(null);
                }}
                aria-label="Tutup jendela"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Judul Impian</label>
              <input
                type="text"
                required
                value={editingDream ? editingDream.title : draft.title}
                onChange={(e) =>
                  editingDream
                    ? setEditingDream({ ...editingDream, title: e.target.value })
                    : setDraft({ ...draft, title: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Kategori
              </label>
              <select
                value={editingDream ? editingDream.category : draft.category}
                onChange={(e) => {
                  const cat = e.target.value as DreamCategory;
                  editingDream
                    ? setEditingDream({ ...editingDream, category: cat })
                    : setDraft({ ...draft, category: cat });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-white dark:bg-[#172336] text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Target Waktu (Opsional)
              </label>
              <input
                type="text"
                placeholder="cth. Musim Semi 2027"
                value={
                  editingDream ? editingDream.targetDate : draft.targetDate
                }
                onChange={(e) =>
                  editingDream
                    ? setEditingDream({
                        ...editingDream,
                        targetDate: e.target.value,
                      })
                    : setDraft({ ...draft, targetDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Progres ({editingDream ? editingDream.progress : draft.progress}
                %)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={editingDream ? editingDream.progress : draft.progress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  editingDream
                    ? setEditingDream({ ...editingDream, progress: val })
                    : setDraft({ ...draft, progress: val });
                }}
                className="w-full accent-[#263C59] dark:accent-[#FFB6CB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Deskripsi
              </label>
              <textarea
                rows={3}
                value={
                  editingDream ? editingDream.description : draft.description
                }
                onChange={(e) =>
                  editingDream
                    ? setEditingDream({
                        ...editingDream,
                        description: e.target.value,
                      })
                    : setDraft({ ...draft, description: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAddingDream(false);
                  setEditingDream(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium opacity-75"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold"
              >
                Simpan Impian
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
