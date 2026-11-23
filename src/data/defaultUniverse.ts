import type { MemoryItem, PlaylistSlot, UniverseData } from '../types/universe';

const DEFAULT_MEMORIES: MemoryItem[] = Array.from({ length: 10 }, (_, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const frames: Array<'polaroid' | 'linen' | 'vintage'> = [
    'polaroid',
    'linen',
    'vintage',
  ];
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

const INITIAL_SOUNDS: Array<{
  youtubeUrl: string;
  videoId: string;
  title: string;
  artist: string;
}> = [
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

const INITIAL_PLAYLIST: PlaylistSlot[] = Array.from({ length: 10 }, (_, idx) => {
  const seed = INITIAL_SOUNDS[idx];
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

export const DEFAULT_UNIVERSE: UniverseData = {
  siteConfig: {
    siteTitle: 'OUR LITTLE UNIVERSE',
    subtitle: 'Dunia Spesial yang Dibuat untuk Ityin',
    openingMessage: 'Welcome to my universe, Ityin ❤️',
    supportingMessage:
      'Dunia kecil milik kita — penuh kenangan, musik, surat cinta, impian, dan perjalanan yang sedang kita bangun bersama.',
    heroCtaLabel: 'Masuki Dunia Kita ♡',
    locationLabel: 'Interlaken, Swiss',
  },
  memories: DEFAULT_MEMORIES,
  playlist: INITIAL_PLAYLIST,
  letter: {
    title: 'Sebuah Surat Untukmu, Ityin.',
    date: 'Tanggal Dapat Diubah — Atur di Studio Pemilik',
    content: `Untuk Ityin tersayang,

Selamat datang di sudut kecil dunia yang kubuat khusus untukmu. Kapan pun hari terasa riuh atau jarak terasa jauh, aku ingin kamu punya sebuah tempat tenang menghadap pegunungan bersalju, danau biru Swiss, dan kelopak bunga sakura yang selalu mengingatkan betapa berharganya dirimu.

Setiap foto, setiap lagu yang kita simpan di sini, dan setiap impian di papan petunjuk kita adalah janji kecil bahwa bab-bab terindah masih menanti di depan kita. Terima kasih telah menghadirkan kehangatan, tawa, dan cahaya lembut di hari-hariku.

Jelajahi semesta kecil ini sepuasmu — semua ini dibuat untukmu.`,
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
