import { DEFAULT_UNIVERSE } from '../data/defaultUniverse';
import type { PersistenceMode, StorageStatus, UniverseData } from '../types/universe';

const LOCAL_DATA_KEY = 'our_little_universe_data_v1';
const OWNER_TOKEN_KEY = 'our_little_universe_owner_token_v1';

export interface StorageAdapter {
  loadUniverse(): Promise<{ data: UniverseData; mode: PersistenceMode; isPersistent: boolean }>;
  saveUniverse(data: UniverseData): Promise<{ data: UniverseData; mode: PersistenceMode; isPersistent: boolean }>;
  uploadPhoto(file: File): Promise<{ url: string; mode: PersistenceMode; isPersistent: boolean }>;
  verifyOwner(passcode: string): Promise<{ ok: boolean; error?: string }>;
  checkAuthStatus(): Promise<{
    isOwner: boolean;
    ownerAuthConfigured: boolean;
    mode: PersistenceMode;
    isPersistent: boolean;
  }>;
  lockOwner(): void;
  getToken(): string | null;
}

export function getSavedOwnerToken(): string | null {
  try {
    return localStorage.getItem(OWNER_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setSavedOwnerToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(OWNER_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(OWNER_TOKEN_KEY);
    }
  } catch {
    // Abaikan error penyimpanan pada iframe terbatas
  }
}

export async function fileToResizedDataUrl(file: File, maxDimension = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar yang dipilih.'));
    reader.onload = () => {
      const result = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        if (scale >= 1 && file.size <= 1.8 * 1024 * 1024) {
          resolve(result);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

class HybridStorageAdapter implements StorageAdapter {
  getToken(): string | null {
    return getSavedOwnerToken();
  }

  lockOwner(): void {
    setSavedOwnerToken(null);
  }

  async checkAuthStatus(): Promise<{
    isOwner: boolean;
    ownerAuthConfigured: boolean;
    mode: PersistenceMode;
    isPersistent: boolean;
  }> {
    const token = getSavedOwnerToken();
    try {
      const res = await fetch('/api/auth/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Gagal memeriksa status autentikasi');
      const json = (await res.json()) as {
        isOwner: boolean;
        ownerAuthConfigured: boolean;
        storageMode: PersistenceMode;
        isPersistent: boolean;
      };
      if (!json.isOwner && token) {
        setSavedOwnerToken(null);
      }
      return {
        isOwner: Boolean(json.isOwner),
        ownerAuthConfigured: Boolean(json.ownerAuthConfigured),
        mode: json.storageMode || 'ephemeral-disk',
        isPersistent: Boolean(json.isPersistent),
      };
    } catch {
      return {
        isOwner: false,
        ownerAuthConfigured: false,
        mode: 'browser-local',
        isPersistent: false,
      };
    }
  }

  async verifyOwner(passcode: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const json = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !json.token) {
        return { ok: false, error: json.error || 'Autentikasi pemilik gagal.' };
      }
      setSavedOwnerToken(json.token);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Tidak dapat terhubung ke server untuk verifikasi.' };
    }
  }

  async loadUniverse(): Promise<{
    data: UniverseData;
    mode: PersistenceMode;
    isPersistent: boolean;
  }> {
    try {
      const res = await fetch('/api/universe');
      if (!res.ok) throw new Error('Gagal memuat data');
      const modeHeader = res.headers.get('X-Storage-Mode') as PersistenceMode | null;
      const persistentHeader = res.headers.get('X-Storage-Persistent') === 'true';
      const serverData = (await res.json()) as UniverseData;
      try {
        localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(serverData));
      } catch {
        // Abaikan batas kuota browser
      }
      return {
        data: serverData,
        mode: modeHeader || 'ephemeral-disk',
        isPersistent: persistentHeader,
      };
    } catch {
      try {
        const cached = localStorage.getItem(LOCAL_DATA_KEY);
        if (cached) {
          return {
            data: JSON.parse(cached) as UniverseData,
            mode: 'browser-local',
            isPersistent: false,
          };
        }
      } catch {
        // Abaikan error parsing
      }
      return {
        data: DEFAULT_UNIVERSE,
        mode: 'browser-local',
        isPersistent: false,
      };
    }
  }

  async saveUniverse(
    data: UniverseData,
  ): Promise<{ data: UniverseData; mode: PersistenceMode; isPersistent: boolean }> {
    const token = getSavedOwnerToken();
    if (!token) {
      throw new Error('Studio Pemilik harus dibuka terlebih dahulu sebelum menyimpan perubahan.');
    }

    const res = await fetch('/api/universe', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) {
        setSavedOwnerToken(null);
      }
      throw new Error(errJson.error || 'Gagal menyimpan perubahan ke server.');
    }

    const modeHeader = res.headers.get('X-Storage-Mode') as PersistenceMode | null;
    const persistentHeader = res.headers.get('X-Storage-Persistent') === 'true';
    const saved = (await res.json()) as UniverseData;
    try {
      localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(saved));
    } catch {
      // Abaikan batas kuota browser
    }
    return {
      data: saved,
      mode: modeHeader || 'ephemeral-disk',
      isPersistent: persistentHeader,
    };
  }

  async uploadPhoto(
    file: File,
  ): Promise<{ url: string; mode: PersistenceMode; isPersistent: boolean }> {
    const token = getSavedOwnerToken();
    if (!token) {
      throw new Error('Studio Pemilik harus dibuka terlebih dahulu sebelum mengunggah foto.');
    }

    const dataUrl = await fileToResizedDataUrl(file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dataUrl }),
    });
    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) {
        setSavedOwnerToken(null);
      }
      throw new Error(errJson.error || 'Gagal mengunggah foto.');
    }
    const modeHeader = res.headers.get('X-Storage-Mode') as PersistenceMode | null;
    const persistentHeader = res.headers.get('X-Storage-Persistent') === 'true';
    const json = (await res.json()) as { url: string };
    return {
      url: json.url,
      mode: modeHeader || 'ephemeral-disk',
      isPersistent: persistentHeader,
    };
  }
}

export const storageAdapter: StorageAdapter = new HybridStorageAdapter();

export function getStorageBadgeLabel(status: StorageStatus, saveError?: string | null): string {
  if (saveError) return 'Gagal Menyimpan';
  if (status.mode === 'supabase' && status.isPersistent) {
    return 'Penyimpanan Cloud Aktif';
  }
  return 'Penyimpanan Sementara';
}

export function describeStorageStatus(status: StorageStatus): string {
  if (status.mode === 'supabase' && status.isPersistent) {
    return 'Penyimpanan Cloud Aktif: Data dan foto tersimpan permanen di Supabase PostgreSQL & Storage.';
  }
  if (status.mode === 'ephemeral-disk') {
    return 'Penyimpanan Sementara: Berjalan pada disk server sementara (data/universe.json & data/uploads/). Data akan terhapus saat kontainer restart atau deploy ulang jika Supabase belum dihubungkan.';
  }
  return 'Penyimpanan Sementara: Hanya cache browser lokal. Hubungkan server dan Supabase untuk penyimpanan permanen lintas perangkat.';
}
