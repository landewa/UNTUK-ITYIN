import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarHeart,
  Download,
  Images,
  Lock,
  Mail,
  Music,
  ShieldCheck,
  Signpost,
  Sparkles,
  Unlock,
  Upload,
  X,
} from 'lucide-react';
import {
  describeStorageStatus,
  getStorageBadgeLabel,
} from '../services/storageService';
import type {
  PageId,
  SiteConfig,
  StorageStatus,
  UniverseData,
} from '../types/universe';

interface OwnerModalProps {
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
  onVerifyPasscode: (passcode: string) => Promise<{ ok: boolean; error?: string }>;
  onLockOwner: () => void;
  universe: UniverseData;
  onSaveSiteConfig: (nextConfig: SiteConfig) => Promise<void>;
  onImportUniverse: (imported: UniverseData) => Promise<void>;
  onNavigate: (page: PageId) => void;
  storageStatus: StorageStatus;
  saveError: string | null;
  petalsEnabled: boolean;
  onTogglePetals: () => void;
}

export const OwnerModal: React.FC<OwnerModalProps> = ({
  open,
  onClose,
  isOwner,
  onVerifyPasscode,
  onLockOwner,
  universe,
  onSaveSiteConfig,
  onImportUniverse,
  onNavigate,
  storageStatus,
  saveError,
  petalsEnabled,
  onTogglePetals,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [configDraft, setConfigDraft] = useState<SiteConfig>(universe.siteConfig);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setConfigDraft(universe.siteConfig);
  }, [universe.siteConfig]);

  if (!open) return null;

  const badgeLabel = getStorageBadgeLabel(storageStatus, saveError || error);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const res = await onVerifyPasscode(passcode);
      if (!res.ok) {
        setError(res.error || 'Kode sandi pemilik tidak sesuai.');
      } else {
        setPasscode('');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSaveSiteConfig(configDraft);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(universe, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'our-little-universe-cadangan.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as UniverseData;
      if (
        !parsed.siteConfig ||
        !Array.isArray(parsed.memories) ||
        !Array.isArray(parsed.playlist)
      ) {
        throw new Error('File JSON cadangan tidak valid.');
      }
      await onImportUniverse(parsed);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengimpor JSON.');
    }
  };

  const jumpTo = (page: PageId) => {
    onNavigate(page);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Studio Pemilik"
      className="fixed inset-0 z-50 bg-[#0c1422]/65 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#172336] text-[#263C59] dark:text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#263C59]/10 dark:border-white/10 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#FFB6CB]/30 text-[#263C59] dark:text-[#FFB6CB] flex items-center justify-center">
              {isOwner ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </span>
            <div>
              <h2 className="font-serif-display text-xl font-bold">
                Studio Pemilik
              </h2>
              <p className="text-xs text-[#263C59]/65 dark:text-slate-400">
                {isOwner
                  ? 'Mode Pemilik aktif — Kamu bisa mengelola foto, lagu, surat, tanggal, dan impian.'
                  : 'Pengunjung publik dapat melihat & mendengarkan musik; masuk sebagai pemilik untuk mengedit.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Studio Pemilik"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Indikator Status Penyimpanan */}
        <div
          className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
            saveError || error
              ? 'bg-rose-50 dark:bg-rose-950/35 border-rose-200 dark:border-rose-800/60'
              : storageStatus.isPersistent
                ? 'bg-emerald-50/75 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-amber-50/85 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
          }`}
        >
          <p className="font-semibold flex items-center gap-1.5 text-[#263C59] dark:text-white">
            {storageStatus.isPersistent && !saveError && !error ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>Status Penyimpanan: {badgeLabel}</span>
          </p>
          <p className="text-[#263C59]/85 dark:text-slate-200">
            {describeStorageStatus(storageStatus)}
          </p>
          <p className="text-[#263C59]/70 dark:text-slate-400">
            Catatan: Tautan publik dapat dilihat siapa saja yang memiliki URL; ini bukan penyimpanan rahasia terenkripsi.
          </p>
        </div>

        {/* Toggle Kelopak Bunga */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-[#263C59]/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#FFB6CB]" />
            <div>
              <p className="text-sm font-semibold">Efek Kelopak Bunga & Hati</p>
              <p className="text-xs text-[#263C59]/65 dark:text-slate-400">
                Aktifkan atau matikan kelopak sakura lembut di layar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTogglePetals}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
              petalsEnabled
                ? 'bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59]'
                : 'bg-[#263C59]/10 dark:bg-white/10'
            }`}
          >
            {petalsEnabled ? 'Aktif' : 'Nonaktif'}
          </button>
        </div>

        {(error || saveError) && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200"
          >
            Gagal Menyimpan: {error || saveError}
          </div>
        )}

        {savedNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-200">
            Perubahan berhasil disimpan!
          </div>
        )}

        {!isOwner ? (
          storageStatus.ownerAuthConfigured ? (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Kata Sandi Pemilik
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi pemilik yang telah dikonfigurasi di server"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="w-full py-2.5 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold disabled:opacity-50"
              >
                {verifying ? 'Memverifikasi...' : 'Masuk ke Studio Pemilik'}
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 leading-relaxed space-y-1">
              <p className="font-semibold">
                Studio Pemilik Terkunci (Environment Server Belum Diatur)
              </p>
              <p>
                Atur variabel environment server untuk autentikasi pemilik pada pengaturan deployment sebelum mengaktifkan mode pengeditan.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-5">
            {/* Pintasan Menu Studio Pemilik */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#263C59]/65 dark:text-slate-400 mb-2.5">
                Pintasan Pengelolaan Konten
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => jumpTo('memories')}
                  className="px-3 py-2.5 rounded-xl border border-[#263C59]/15 dark:border-white/15 text-xs font-semibold flex items-center gap-2 hover:bg-[#263C59]/5 dark:hover:bg-white/10"
                >
                  <Images className="w-4 h-4 text-[#FFB6CB]" />
                  <span>Kelola Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo('music')}
                  className="px-3 py-2.5 rounded-xl border border-[#263C59]/15 dark:border-white/15 text-xs font-semibold flex items-center gap-2 hover:bg-[#263C59]/5 dark:hover:bg-white/10"
                >
                  <Music className="w-4 h-4 text-[#FFB6CB]" />
                  <span>Tambah Lagu</span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo('letter')}
                  className="px-3 py-2.5 rounded-xl border border-[#263C59]/15 dark:border-white/15 text-xs font-semibold flex items-center gap-2 hover:bg-[#263C59]/5 dark:hover:bg-white/10"
                >
                  <Mail className="w-4 h-4 text-[#FFB6CB]" />
                  <span>Edit Surat</span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo('journey')}
                  className="px-3 py-2.5 rounded-xl border border-[#263C59]/15 dark:border-white/15 text-xs font-semibold flex items-center gap-2 hover:bg-[#263C59]/5 dark:hover:bg-white/10"
                >
                  <CalendarHeart className="w-4 h-4 text-[#FFB6CB]" />
                  <span>Tanggal Awal Hubungan</span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo('journey')}
                  className="px-3 py-2.5 rounded-xl border border-[#263C59]/15 dark:border-white/15 text-xs font-semibold flex items-center gap-2 hover:bg-[#263C59]/5 dark:hover:bg-white/10"
                >
                  <Sparkles className="w-4 h-4 text-[#FFB6CB]" />
                  <span>Kelola Kenangan</span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo('dreams')}
                  className="px-3 py-2.5 rounded-xl border border-[#263C59]/15 dark:border-white/15 text-xs font-semibold flex items-center gap-2 hover:bg-[#263C59]/5 dark:hover:bg-white/10"
                >
                  <Signpost className="w-4 h-4 text-[#FFB6CB]" />
                  <span>Kelola Impian</span>
                </button>
              </div>
            </div>

            {/* Petunjuk Upload 10 Foto Ityin */}
            <div className="p-3.5 rounded-2xl bg-[#FFF7F0] dark:bg-white/5 border border-[#263C59]/10 dark:border-white/10 text-xs leading-relaxed">
              <p className="font-semibold text-[#263C59] dark:text-[#B3D9F2] mb-1">
                Petunjuk Upload 10 Foto Ityin
              </p>
              <p className="text-[#263C59]/80 dark:text-slate-300">
                Kamu dapat menempatkan file lokal{' '}
                <code className="font-mono">ityin-01.jpg</code> sampai{' '}
                <code className="font-mono">ityin-10.jpg</code> di folder{' '}
                <code className="font-mono">public/images/ityin/</code>, atau langsung mengunggah foto melalui menu{' '}
                <strong>Kelola Foto</strong>. Rasio asli setiap foto selalu dipertahankan.
              </p>
            </div>

            {/* Pengaturan Teks Beranda */}
            <form onSubmit={handleSaveConfig} className="space-y-3">
              <h3 className="font-serif-display text-lg font-bold">
                Teks Beranda & Identitas Situs
              </h3>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Judul Website
                </label>
                <input
                  type="text"
                  required
                  value={configDraft.siteTitle}
                  onChange={(e) =>
                    setConfigDraft({ ...configDraft, siteTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Kalimat Pembuka
                </label>
                <input
                  type="text"
                  required
                  value={configDraft.openingMessage}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      openingMessage: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Pesan Pendukung
                </label>
                <textarea
                  rows={2}
                  value={configDraft.supportingMessage}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      supportingMessage: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-xs font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>

            {/* Cadangan JSON & Keluar */}
            <div className="pt-4 border-t border-[#263C59]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3.5 py-2 rounded-xl border border-[#263C59]/20 dark:border-white/20 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor Cadangan</span>
                </button>
                <label className="px-3.5 py-2 rounded-xl border border-[#263C59]/20 dark:border-white/20 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Impor JSON</span>
                  <input
                    type="file"
                    accept="application/json"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportJson(f);
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={onLockOwner}
                className="px-4 py-2 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 text-xs font-semibold"
              >
                Keluar dari Mode Pemilik
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
