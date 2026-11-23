import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const STORE_PATH = path.join(DATA_DIR, 'universe.json');

// Security: No hardcoded fallback credentials. OWNER_PASSCODE must be set via server env.
const OWNER_PASSCODE = (process.env.OWNER_PASSCODE || '').trim();
const SESSION_SECRET =
  (process.env.OWNER_SESSION_SECRET || '').trim() ||
  crypto.randomBytes(32).toString('hex');

// Optional Supabase server-side persistence (recommended for Cloud Run / ephemeral hosts)
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const SUPABASE_STORAGE_BUCKET =
  (process.env.SUPABASE_STORAGE_BUCKET || 'universe-photos').trim();
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const MAX_JSON_LIMIT = '4mb';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Sliding-window rate limit for /api/auth/verify (10 attempts per 15 min per IP)
const authAttempts = new Map<string, number[]>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_AUTH_ATTEMPTS = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (authAttempts.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= MAX_AUTH_ATTEMPTS) {
    authAttempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  authAttempts.set(ip, recent);
  return false;
}

function createDefaultStoreData() {
  const memories = Array.from({ length: 10 }, (_, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const frames = ['polaroid', 'linen', 'vintage'];
    return {
      id: `ityin-slot-${num}`,
      slotNumber: idx + 1,
      imageUrl: `/images/ityin/ityin-${num}.jpg`,
      title: `Potret Ityin #${idx + 1}`,
      date: 'Tanggal Dapat Diubah',
      description:
        'Tambahkan keterangan manis atau cerita favorit tentang potret Ityin ini melalui Studio Pemilik.',
      frameStyle: frames[idx % frames.length],
      isDefaultSlot: true,
    };
  });

  const initialTracks = [
    {
      youtubeUrl: 'https://youtu.be/9ZjGAn7v3C4?si=PA5mP1i-dnesFAzN',
      videoId: '9ZjGAn7v3C4',
      title: 'horimiya AMV // payphone',
      artist: "Lisy Amv's",
    },
    {
      youtubeUrl: 'https://youtu.be/KoDKT7jxRFs?si=SQuUCayH42YRIo9B',
      videoId: 'KoDKT7jxRFs',
      title: 'Miles Away - Bring Me Back (Lyrics) ft. Claire Ridgely',
      artist: 'Rishima Music',
    },
    {
      youtubeUrl: 'https://youtu.be/3kA4FaeV4z4?si=GOGVwl9txAiQtXua',
      videoId: '3kA4FaeV4z4',
      title: 'austin mahone - all i ever need (slowed + reverb)',
      artist: 'musicphilia',
    },
    {
      youtubeUrl: 'https://youtu.be/TP1xs1hF2ZE?si=6TdlAyq4hodYlbfF',
      videoId: 'TP1xs1hF2ZE',
      title: 'Anne-Marie - 2002 (Live At Brighton Music Hall 2018)',
      artist: 'Anne-Marie',
    },
    {
      youtubeUrl: 'https://youtu.be/oozQ4yV__Vw?si=VB7QNeZ-YcjgAI4b',
      videoId: 'oozQ4yV__Vw',
      title: 'Phillip Phillips - Gone, Gone, Gone (Official Music Video)',
      artist: 'PhilPhillipsVEVO',
    },
  ];

  const playlist = Array.from({ length: 10 }, (_, idx) => {
    const seed = initialTracks[idx];
    if (seed) {
      return {
        slotIndex: idx + 1,
        youtubeUrl: seed.youtubeUrl,
        videoId: seed.videoId,
        title: seed.title,
        artist: seed.artist,
        thumbnailUrl: `https://img.youtube.com/vi/${seed.videoId}/hqdefault.jpg`,
        addedAt: '2026-11-23T00:00:00.000Z',
      };
    }
    return {
      slotIndex: idx + 1,
      youtubeUrl: '',
      videoId: '',
      title: '',
      artist: '',
      thumbnailUrl: '',
      addedAt: null,
    };
  });

  return {
    siteConfig: {
      siteTitle: 'OUR LITTLE UNIVERSE',
      subtitle: 'Dunia Spesial yang Dibuat untuk Ityin',
      openingMessage: 'Welcome to my universe, Ityin ❤️',
      supportingMessage:
        'Dunia kecil milik kita — penuh kenangan, musik, surat cinta, impian, dan perjalanan yang sedang kita bangun bersama.',
      heroCtaLabel: 'Masuki Dunia Kita ♡',
      locationLabel: 'Interlaken, Swiss',
    },
    memories,
    playlist,
    letter: {
      title: 'Sebuah Surat Untukmu, Ityin.',
      date: 'Tanggal Dapat Diubah — Atur di Studio Pemilik',
      content: `Untuk Ityin tersayang,\n\nSelamat datang di sudut kecil dunia yang kubuat khusus untukmu. Kapan pun hari terasa riuh atau jarak terasa jauh, aku ingin kamu punya sebuah tempat tenang menghadap pegunungan bersalju, danau biru Swiss, dan kelopak bunga sakura yang selalu mengingatkan betapa berharganya dirimu.\n\nSetiap foto, setiap lagu yang kita simpan di sini, dan setiap impian di papan petunjuk kita adalah janji kecil bahwa bab-bab terindah masih menanti di depan kita. Terima kasih telah menghadirkan kehangatan, tawa, dan cahaya lembut di hari-hariku.\n\nJelajahi semesta kecil ini sepuasmu — semua ini dibuat untukmu.`,
      signature: 'Selamanya milikmu ♡',
    },
    journey: {
      startDate: null,
      partnerName: 'Ityin',
      milestones: [
        {
          id: 'milestone-sample-1',
          date: 'Tanggal Dapat Diubah',
          title: 'Momen Spesial Pertama (Contoh Tonggak)',
          location: 'Ubah di Studio Pemilik',
          description:
            'Ganti contoh ini dengan tanggal dan kisah nyata dari momen paling berkesan kalian berdua.',
        },
        {
          id: 'milestone-sample-2',
          date: 'Tanggal Dapat Diubah',
          title: 'Perjalanan Impian ke Pegunungan Swiss (Contoh)',
          location: 'Interlaken & Lauterbrunnen',
          description:
            'Tambahkan tonggak kisah nyata, perjalanan, dan hari spesial kalian langsung melalui Studio Pemilik.',
        },
      ],
    },
    quizQuestions: [
      {
        id: 'quiz-1',
        question:
          'Contoh Pertanyaan: Di mana kita paling cocok menikmati senja di semesta kecil ini?',
        options: [
          'Bersepeda berdua di jalan pedesaan Swiss menghadap danau',
          'Terjebak macet di jam pulang kantor',
          'Di ruang tunggu bandara yang ramai',
          'Di ruang rapat kantor',
        ],
        correctIndex: 0,
        note: 'Ubah seluruh pertanyaan dan jawaban di Studio Pemilik sesuai kenangan kalian!',
      },
      {
        id: 'quiz-2',
        question:
          'Contoh Pertanyaan: Minuman hangat apa yang menemani sore di balkon chalet?',
        options: [
          'Minuman energi dingin',
          'Dua cangkir cokelat panas mengepul',
          'Air soda tawar',
          'Kopi pahit dingin',
        ],
        correctIndex: 1,
        note: 'Cokelat hangat di bawah pemandangan puncak bersalju.',
      },
      {
        id: 'quiz-3',
        question:
          'Contoh Pertanyaan: Bunga apa yang berguguran lembut di taman alpen kita?',
        options: [
          'Kaktus gurun',
          'Bunga sakura & bunga liar alpen',
          'Daun kering musim gugur',
          'Bunga plastik',
        ],
        correctIndex: 1,
        note: 'Kamu bisa mengganti pertanyaan ini dengan candaan dan hal favorit kalian.',
      },
      {
        id: 'quiz-4',
        question:
          'Contoh Pertanyaan: Apa alasan terindah membuka Our Little Universe?',
        options: [
          'Untuk mengingat betapa Ityin selalu disayangi',
          'Untuk mengecek grafik pasar saham',
          'Untuk membayar tagihan listrik',
          'Untuk membaca buku panduan teknis',
        ],
        correctIndex: 0,
        note: 'Dibuat dengan cinta, khusus untuk Ityin.',
      },
    ],
    dreams: [
      {
        id: 'dream-1',
        title: 'Bersepeda & Naik Kereta Merah Menembus Lembah Interlaken',
        category: 'Travel',
        description:
          'Menikmati udara pegunungan Swiss berdua, melihat air terjun dari jendela kereta, dan duduk hangat di tepi danau.',
        targetDate: 'Target Dapat Diubah',
        completed: false,
        progress: 35,
      },
      {
        id: 'dream-2',
        title: 'Rumah Hangat yang Penuh Cahaya Matahari & Bunga',
        category: 'Home',
        description:
          'Membangun rumah yang nyaman dengan aksen kayu hangat, foto polaroid di dinding, dan alunan musik favorit.',
        targetDate: 'Target Dapat Diubah',
        completed: false,
        progress: 40,
      },
      {
        id: 'dream-3',
        title: 'Membangun Usaha Bermakna Bersama-Sama',
        category: 'Business',
        description:
          'Saling mendukung mimpi dan karya masing-masing, merayakan langkah kecil, dan bertumbuh berdua.',
        targetDate: 'Target Dapat Diubah',
        completed: false,
        progress: 25,
      },
      {
        id: 'dream-4',
        title: 'Menatap Langit Berbintang di Atas Pegunungan Bersalju',
        category: 'Future',
        description:
          'Menulis kisah kita tahun demi tahun dengan kesabaran, kelembutan, dan petualangan baru.',
        targetDate: 'Target Dapat Diubah',
        completed: false,
        progress: 50,
      },
      {
        id: 'dream-5',
        title: 'Selalu Mendukung Kebahagiaan & Impian Pribadi Ityin',
        category: 'Personal Dreams',
        description:
          'Menjadi penyemangat nomor satu bagi setiap cita-cita, kreativitas, dan senyum Ityin.',
        targetDate: 'Target Dapat Diubah',
        completed: false,
        progress: 60,
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function isSafeImageRef(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim() || url.length > 2048) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  );
}

function validateUniversePayload(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Payload must be an object.';
  const data = body as Record<string, unknown>;
  if (
    !data.siteConfig ||
    !Array.isArray(data.memories) ||
    !Array.isArray(data.playlist) ||
    !data.letter ||
    !data.journey ||
    !Array.isArray(data.quizQuestions) ||
    !Array.isArray(data.dreams)
  ) {
    return 'Missing required universe data sections.';
  }

  if (data.memories.length > 50) return 'Too many memory entries (max 50).';
  for (const m of data.memories) {
    if (!m || typeof m !== 'object') return 'Invalid memory entry.';
    const mem = m as Record<string, unknown>;
    if (!isSafeImageRef(mem.imageUrl)) {
      return 'Memory imageUrl must be a safe /images/, /uploads/, http://, or https:// path.';
    }
  }

  if (data.playlist.length > 10) return 'Playlist cannot exceed 10 slots.';
  for (const s of data.playlist) {
    if (!s || typeof s !== 'object') return 'Invalid playlist slot.';
    const slot = s as Record<string, unknown>;
    if (
      typeof slot.youtubeUrl === 'string' &&
      slot.youtubeUrl.trim() &&
      !slot.youtubeUrl.trim().startsWith('https://') &&
      !slot.youtubeUrl.trim().startsWith('http://')
    ) {
      return 'Playlist YouTube URL must use http:// or https://.';
    }
  }

  return null;
}

const PUBLIC_ITYIN_DIR = path.resolve(__dirname, 'public', 'images', 'ityin');

async function scanLocalItyinPhotos(): Promise<string[]> {
  try {
    const entries = await fs.readdir(PUBLIC_ITYIN_DIR, { withFileTypes: true });
    return entries
      .filter(
        (ent) =>
          ent.isFile() && /\.(jpe?g|png|webp|gif|avif)$/i.test(ent.name),
      )
      .map((ent) => ent.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  } catch {
    return [];
  }
}

async function applyDetectedItyinPhotos(
  universe: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const actualFiles = await scanLocalItyinPhotos();
  if (actualFiles.length === 0 || !Array.isArray(universe.memories)) {
    return universe;
  }

  const existingSet = new Set(actualFiles.map((f) => `/images/ityin/${f}`));
  const memories = universe.memories.map((entry, idx) => {
    if (!entry || typeof entry !== 'object') return entry;
    const mem = entry as Record<string, unknown>;
    const currentUrl = typeof mem.imageUrl === 'string' ? mem.imageUrl : '';
    const isUploadedOrCustom =
      currentUrl.startsWith('/uploads/') ||
      currentUrl.startsWith('https://') ||
      currentUrl.startsWith('http://');

    if (isUploadedOrCustom || existingSet.has(currentUrl)) {
      return mem;
    }

    // Jika slot default masih mengarah ke ityin-XX.jpg yang belum ada,
    // cocokkan dengan file aktual di public/images/ityin/ tanpa mengubah/memindahkan file aslinya.
    const matchedFile = actualFiles[idx];
    if (matchedFile) {
      return {
        ...mem,
        imageUrl: `/images/ityin/${matchedFile}`,
      };
    }
    return mem;
  });

  return {
    ...universe,
    memories,
  };
}

async function ensureDiskStorageReady() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    const initialData = createDefaultStoreData();
    await fs.writeFile(STORE_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

async function loadUniverseFromStorage(): Promise<Record<string, unknown>> {
  let rawData: Record<string, unknown>;

  if (USE_SUPABASE) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/universe_state?id=eq.main&select=data`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    if (!res.ok) {
      throw new Error(`Supabase read failed (${res.status})`);
    }
    const rows = (await res.json()) as Array<{ data: Record<string, unknown> }>;
    if (rows.length > 0 && rows[0]?.data) {
      rawData = rows[0].data;
    } else {
      const seeded = createDefaultStoreData();
      await saveUniverseToStorage(seeded);
      rawData = seeded;
    }
  } else {
    try {
      const raw = await fs.readFile(STORE_PATH, 'utf8');
      rawData = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      rawData = createDefaultStoreData();
    }
  }

  return applyDetectedItyinPhotos(rawData);
}

async function saveUniverseToStorage(
  updated: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (USE_SUPABASE) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/universe_state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id: 'main',
        data: updated,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase save failed (${res.status}): ${errText}`);
    }
    return updated;
  }

  const tmpPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(updated, null, 2), 'utf8');
  await fs.rename(tmpPath, STORE_PATH);
  return updated;
}

async function saveUploadedImage(
  buffer: Buffer,
  mime: string,
  ext: string,
): Promise<string> {
  const filename = `ityin-upload-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  if (USE_SUPABASE) {
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${filename}`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': mime,
          'x-upsert': 'false',
        },
        body: new Uint8Array(buffer),
      },
    );
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Supabase storage upload failed (${uploadRes.status}): ${errText}`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${filename}`;
  }

  const dest = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(dest, buffer);
  return `/uploads/${filename}`;
}

function signOwnerToken(): string {
  const payload = JSON.stringify({
    role: 'owner',
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyOwnerToken(token: string): boolean {
  if (!OWNER_PASSCODE) return false;
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const decoded = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as {
      role?: string;
      exp?: number;
    };
    return (
      decoded.role === 'owner' &&
      typeof decoded.exp === 'number' &&
      decoded.exp > Date.now()
    );
  } catch {
    return false;
  }
}

function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!OWNER_PASSCODE) {
    res.status(503).json({
      error:
        'Studio Pemilik dinonaktifkan karena OWNER_PASSCODE belum diatur di environment server.',
    });
    return;
  }
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!verifyOwnerToken(token)) {
    res.status(401).json({
      error: 'Otorisasi pemilik diperlukan. Buka Studio Pemilik terlebih dahulu.',
    });
    return;
  }
  next();
}

function safeComparePasscode(input: string, target: string): boolean {
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(target).digest();
  return crypto.timingSafeEqual(a, b);
}

function setStorageHeaders(res: Response) {
  res.setHeader('X-Storage-Mode', USE_SUPABASE ? 'supabase' : 'ephemeral-disk');
  res.setHeader('X-Storage-Persistent', USE_SUPABASE ? 'true' : 'false');
}

async function startServer() {
  if (!USE_SUPABASE) {
    await ensureDiskStorageReady();
  }

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: MAX_JSON_LIMIT }));

  // Serve locally uploaded photos when running in ephemeral-disk mode
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      maxAge: '7d',
      fallthrough: false,
    }),
  );

  app.get('/api/health', async (_req, res) => {
    setStorageHeaders(res);
    const localPhotos = await scanLocalItyinPhotos();
    res.json({
      ok: true,
      storageMode: USE_SUPABASE ? 'supabase' : 'ephemeral-disk',
      isPersistent: USE_SUPABASE,
      ownerAuthConfigured: Boolean(OWNER_PASSCODE),
      detectedLocalPhotosCount: localPhotos.length,
    });
  });

  app.get('/api/youtube-oembed', async (req, res) => {
    const rawId = typeof req.query.videoId === 'string' ? req.query.videoId.trim() : '';
    if (!/^[a-zA-Z0-9_-]{11}$/.test(rawId)) {
      res.status(400).json({ error: 'ID video YouTube tidak valid.' });
      return;
    }
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${rawId}`)}&format=json`,
      );
      if (!oembedRes.ok) {
        res.status(404).json({ error: 'Metadata video YouTube tidak tersedia.' });
        return;
      }
      const meta = (await oembedRes.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      res.json({
        videoId: rawId,
        title: typeof meta.title === 'string' ? meta.title.trim() : '',
        artist: typeof meta.author_name === 'string' ? meta.author_name.trim() : '',
        thumbnailUrl:
          typeof meta.thumbnail_url === 'string'
            ? meta.thumbnail_url
            : `https://img.youtube.com/vi/${rawId}/hqdefault.jpg`,
      });
    } catch {
      res.status(502).json({ error: 'Gagal menghubungi YouTube oEmbed.' });
    }
  });

  app.get('/api/auth/status', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    setStorageHeaders(res);
    res.json({
      isOwner: verifyOwnerToken(token),
      ownerAuthConfigured: Boolean(OWNER_PASSCODE),
      storageMode: USE_SUPABASE ? 'supabase' : 'ephemeral-disk',
      isPersistent: USE_SUPABASE,
    });
  });

  app.post('/api/auth/verify', (req, res) => {
    if (!OWNER_PASSCODE) {
      res.status(503).json({
        error:
          'OWNER_PASSCODE belum diatur di server. Atur OWNER_PASSCODE pada environment variables deployment.',
      });
      return;
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        error: 'Terlalu banyak percobaan kode sandi. Silakan tunggu 15 menit lalu coba lagi.',
      });
      return;
    }

    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    if (!passcode || !safeComparePasscode(passcode, OWNER_PASSCODE)) {
      res.status(401).json({ error: 'Kode sandi pemilik tidak sesuai.' });
      return;
    }

    const token = signOwnerToken();
    res.json({ token, isOwner: true });
  });

  app.get('/api/universe', async (_req, res) => {
    setStorageHeaders(res);
    try {
      const data = await loadUniverseFromStorage();
      res.json(data);
    } catch (err) {
      console.error('Failed to load universe data:', err);
      res.status(500).json({ error: 'Gagal memuat data dari penyimpanan server.' });
    }
  });

  app.put('/api/universe', requireOwner, async (req, res) => {
    setStorageHeaders(res);
    const validationError = validateUniversePayload(req.body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const updated = {
      ...(req.body as Record<string, unknown>),
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = await saveUniverseToStorage(updated);
      res.json(saved);
    } catch (err) {
      console.error('Failed to persist universe data:', err);
      res.status(500).json({ error: 'Gagal menyimpan perubahan data.' });
    }
  });

  app.post('/api/upload', requireOwner, async (req, res) => {
    setStorageHeaders(res);
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(
      dataUrl,
    );
    if (!match) {
      res.status(400).json({ error: 'Format gambar tidak valid.' });
      return;
    }

    const mime = match[1].toLowerCase();
    const ext = ALLOWED_MIME_EXT[mime];
    if (!ext) {
      res
        .status(400)
        .json({ error: 'Tipe gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.' });
      return;
    }

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_UPLOAD_BYTES) {
      res.status(400).json({ error: 'Ukuran gambar maksimal 5 MB.' });
      return;
    }

    try {
      const url = await saveUploadedImage(buffer, mime, ext);
      res.json({ url });
    } catch (err) {
      console.error('Failed to store uploaded image:', err);
      res.status(500).json({ error: 'Gagal menyimpan foto yang diunggah.' });
    }
  });

  app.use(
    (
      err: Error & { status?: number },
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      if (err.status === 404) {
        res.status(404).json({ error: 'Data atau file tidak ditemukan.' });
        return;
      }
      res.status(err.status || 500).json({ error: err.message || 'Terjadi kesalahan pada server.' });
    },
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Our Little Universe listening on http://0.0.0.0:${PORT} (storage=${USE_SUPABASE ? 'supabase' : 'ephemeral-disk'}, ownerAuthConfigured=${Boolean(OWNER_PASSCODE)})`,
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
