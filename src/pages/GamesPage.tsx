import React, { useEffect, useRef, useState } from 'react';
import {
  Edit3,
  Gamepad2,
  Heart,
  HelpCircle,
  Lock,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import type { QuizQuestion } from '../types/universe';

interface GamesPageProps {
  quizQuestions: QuizQuestion[];
  isOwner: boolean;
  onSaveQuiz: (nextQuestions: QuizQuestion[]) => Promise<void>;
  onRequestUnlock: () => void;
}

type GameTab = 'catcher' | 'memory' | 'quiz';

// ==================== GAME A: TANGKAP HATI ====================
const HeartCatcherGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);

  const basketXRef = useRef(220);
  const keysRef = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const scoreRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setFinished(true);
          setBestScore((b) => Math.max(b, scoreRef.current));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    interface FallingItem {
      x: number;
      y: number;
      speed: number;
      kind: 'heart' | 'blossom' | 'storm';
      radius: number;
    }

    const items: FallingItem[] = [];
    let spawnCooldown = 0;
    let rafId = 0;

    const drawStatic = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#B3D9F2');
      grad.addColorStop(0.65, '#FFF7F0');
      grad.addColorStop(1, '#FFE4EC');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Siluet puncak Alpen Swiss di kejauhan
      ctx.fillStyle = 'rgba(38, 60, 89, 0.14)';
      ctx.beginPath();
      ctx.moveTo(0, height - 40);
      ctx.lineTo(90, height - 130);
      ctx.lineTo(175, height - 70);
      ctx.lineTo(270, height - 155);
      ctx.lineTo(360, height - 85);
      ctx.lineTo(440, height - 135);
      ctx.lineTo(width, height - 45);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Keranjang
      const bx = basketXRef.current;
      const by = height - 34;
      ctx.fillStyle = '#263C59';
      ctx.beginPath();
      ctx.roundRect(bx - 36, by, 72, 20, 10);
      ctx.fill();
      ctx.fillStyle = '#FFB6CB';
      ctx.fillRect(bx - 24, by + 6, 48, 5);
    };

    if (!running) {
      drawStatic();
      return;
    }

    const loop = () => {
      if (keysRef.current.left) basketXRef.current -= 6.5;
      if (keysRef.current.right) basketXRef.current += 6.5;
      basketXRef.current = Math.max(40, Math.min(width - 40, basketXRef.current));

      spawnCooldown -= 1;
      if (spawnCooldown <= 0) {
        const roll = Math.random();
        items.push({
          x: 24 + Math.random() * (width - 48),
          y: -18,
          speed: 2.2 + Math.random() * 2.1,
          kind: roll < 0.65 ? 'heart' : roll < 0.88 ? 'blossom' : 'storm',
          radius: 14,
        });
        spawnCooldown = 26 + Math.floor(Math.random() * 18);
      }

      drawStatic();

      for (let i = items.length - 1; i >= 0; i -= 1) {
        const it = items[i];
        it.y += it.speed;

        // Gambar item jatuh
        ctx.save();
        ctx.translate(it.x, it.y);
        if (it.kind === 'heart') {
          ctx.fillStyle = '#e11d48';
          ctx.beginPath();
          ctx.moveTo(0, 6);
          ctx.bezierCurveTo(-12, -4, -12, -14, 0, -6);
          ctx.bezierCurveTo(12, -14, 12, -4, 0, 6);
          ctx.fill();
        } else if (it.kind === 'blossom') {
          ctx.fillStyle = '#FFB6CB';
          for (let p = 0; p < 5; p += 1) {
            ctx.rotate((Math.PI * 2) / 5);
            ctx.beginPath();
            ctx.ellipse(0, -6, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#FFF7F0';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(-5, 0, 7, 0, Math.PI * 2);
          ctx.arc(5, 0, 7, 0, Math.PI * 2);
          ctx.arc(0, -5, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Cek tabrakan dengan keranjang
        const bx = basketXRef.current;
        const by = height - 34;
        if (
          it.y + it.radius >= by &&
          it.y - it.radius <= by + 20 &&
          Math.abs(it.x - bx) <= 42
        ) {
          if (it.kind === 'heart') {
            scoreRef.current += 10;
          } else if (it.kind === 'blossom') {
            scoreRef.current += 20;
          } else {
            scoreRef.current = Math.max(0, scoreRef.current - 15);
          }
          setScore(scoreRef.current);
          items.splice(i, 1);
          continue;
        }

        if (it.y > height + 24) {
          items.splice(i, 1);
        }
      }

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [running]);

  const startGame = () => {
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(40);
    setFinished(false);
    setRunning(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!running || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
    basketXRef.current = Math.max(40, Math.min(canvasRef.current.width - 40, relX));
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-8 shadow-xl max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-[#263C59] dark:text-white">
            Tangkap Hati
          </h2>
          <p className="text-xs sm:text-sm text-[#263C59]/75 dark:text-slate-300">
            Tangkap hati (+10) dan kelopak sakura (+20). Hindari awan abu-abu (-15).
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold tabular-nums">
          <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 text-[#263C59] dark:text-white">
            Skor: {score}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 text-[#263C59] dark:text-white">
            Waktu: {timeLeft} dtk
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-[#263C59]/15 dark:border-white/15">
        <canvas
          ref={canvasRef}
          width={520}
          height={340}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          className="w-full h-auto block touch-none cursor-crosshair"
        />

        {!running && (
          <div className="absolute inset-0 bg-[#172336]/55 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            {finished ? (
              <>
                <Trophy className="w-10 h-10 text-[#FFB6CB] mb-2" />
                <h3 className="font-serif-display text-2xl font-bold">
                  Skor Akhir: {score}
                </h3>
                <p className="text-sm text-white/85 mt-1 tabular-nums">
                  Skor Terbaik: {bestScore}
                </p>
              </>
            ) : (
              <>
                <Heart className="w-10 h-10 text-[#FFB6CB] fill-[#FFB6CB] mb-2" />
                <h3 className="font-serif-display text-2xl font-bold">
                  Siap Menangkap Cinta?
                </h3>
                <p className="text-xs sm:text-sm text-white/85 mt-1">
                  Gerakkan keranjang dengan mouse, geser jari di layar, atau tombol panah Kiri / Kanan.
                </p>
              </>
            )}
            <button
              type="button"
              onClick={startGame}
              className="mt-5 px-6 py-2.5 rounded-full bg-[#FFB6CB] text-[#263C59] font-semibold text-sm hover:bg-[#ffa5bf] transition-colors"
            >
              {finished ? 'Main Lagi' : 'Mulai Main'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== GAME B: COCOKKAN MEMORI ====================
const CARD_SYMBOLS = [
  { key: 'heart', label: 'Hati', symbol: '❤️' },
  { key: 'blossom', label: 'Sakura', symbol: '🌸' },
  { key: 'mountain', label: 'Pegunungan Swiss', symbol: '🏔️' },
  { key: 'train', label: 'Kereta Alpen', symbol: '🚞' },
  { key: 'star', label: 'Cahaya Bintang', symbol: '✨' },
  { key: 'cocoa', label: 'Cokelat Hangat', symbol: '☕' },
  { key: 'letter', label: 'Surat Cinta', symbol: '💌' },
  { key: 'couple', label: 'Bersama', symbol: '🫶' },
];

interface MemoryCard {
  uid: number;
  key: string;
  label: string;
  symbol: string;
  matched: boolean;
}

function createShuffledDeck(): MemoryCard[] {
  const doubled = [...CARD_SYMBOLS, ...CARD_SYMBOLS].map((item, idx) => ({
    ...item,
    uid: idx,
    matched: false,
  }));
  for (let i = doubled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled;
}

const MemoryMatchGame: React.FC = () => {
  const [cards, setCards] = useState<MemoryCard[]>(() => createShuffledDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const matchedCount = cards.filter((c) => c.matched).length;
  const isWon = matchedCount === cards.length;

  const resetGame = () => {
    setCards(createShuffledDeck());
    setFlipped([]);
    setMoves(0);
    setLocked(false);
  };

  const handleFlip = (index: number) => {
    if (locked || flipped.includes(index) || cards[index].matched) return;
    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [firstIdx, secondIdx] = nextFlipped;
      if (cards[firstIdx].key === cards[secondIdx].key) {
        setCards((prev) =>
          prev.map((c, i) =>
            i === firstIdx || i === secondIdx ? { ...c, matched: true } : c,
          ),
        );
        setFlipped([]);
        setLocked(false);
      } else {
        window.setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 700);
      }
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-8 shadow-xl max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-[#263C59] dark:text-white">
            Cocokkan Memori
          </h2>
          <p className="text-xs sm:text-sm text-[#263C59]/75 dark:text-slate-300">
            Temukan seluruh 8 pasang kartu romantis bernuansa Swiss.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 text-sm font-semibold text-[#263C59] dark:text-white tabular-nums">
            Langkah: {moves}
          </span>
          <button
            type="button"
            onClick={resetGame}
            className="px-3.5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mulai Ulang</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
        {cards.map((card, idx) => {
          const isRevealed = flipped.includes(idx) || card.matched;
          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => handleFlip(idx)}
              aria-label={isRevealed ? card.label : 'Kartu memori tertutup'}
              className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 select-none ${
                card.matched
                  ? 'bg-[#FFB6CB]/35 border-[#FFB6CB] scale-[0.98]'
                  : isRevealed
                    ? 'bg-white dark:bg-[#1e2e46] border-[#263C59]/20 dark:border-white/25'
                    : 'bg-[#263C59] dark:bg-[#162235] border-white/15 hover:bg-[#314c70] text-white/70'
              }`}
            >
              {isRevealed ? (
                <>
                  <span className="text-2xl sm:text-3xl">{card.symbol}</span>
                  <span className="mt-1 text-[10px] sm:text-xs font-medium text-[#263C59] dark:text-slate-200">
                    {card.label}
                  </span>
                </>
              ) : (
                <Heart className="w-5 h-5 text-[#FFB6CB]/70" />
              )}
            </button>
          );
        })}
      </div>

      {isWon && (
        <div className="mt-6 p-5 rounded-2xl bg-[#FFB6CB]/25 border border-[#FFB6CB] text-center">
          <h3 className="font-serif-display text-xl font-bold text-[#263C59] dark:text-white">
            Semua 8 Pasang Cocok dalam {moves} Langkah!
          </h3>
          <button
            type="button"
            onClick={resetGame}
            className="mt-3 px-5 py-2 rounded-full bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold"
          >
            Main Lagi
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== GAME C: KUIS KITA ====================
const OurQuizGame: React.FC<{
  questions: QuizQuestion[];
  isOwner: boolean;
  onSaveQuiz: (next: QuizQuestion[]) => Promise<void>;
  onRequestUnlock: () => void;
}> = ({ questions, isOwner, onSaveQuiz, onRequestUnlock }) => {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState<QuizQuestion[]>(questions);

  useEffect(() => {
    setDraftQuestions(questions);
  }, [questions]);

  const current = questions[step];

  const handleSelectOption = (optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    if (optIdx === current.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (step + 1 >= questions.length) {
      setFinished(true);
    } else {
      setStep((s) => s + 1);
      setSelected(null);
    }
  };

  const restartQuiz = () => {
    setStep(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const handleSaveQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveQuiz(draftQuestions);
    setEditingQuiz(false);
    restartQuiz();
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-8 shadow-xl max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-[#263C59] dark:text-white">
            Kuis Kita
          </h2>
          <p className="text-xs sm:text-sm text-[#263C59]/75 dark:text-slate-300">
            Pertanyaan manis yang bisa kamu ubah dan sesuaikan di Studio Pemilik.
          </p>
        </div>
        {isOwner ? (
          <button
            type="button"
            onClick={() => setEditingQuiz(true)}
            className="px-3.5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Pertanyaan</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onRequestUnlock}
            className="px-3.5 py-2 rounded-xl border border-[#263C59]/20 dark:border-white/20 text-xs font-medium text-[#263C59] dark:text-slate-200 inline-flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sesuaikan Kuis</span>
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-10 text-sm text-[#263C59]/75 dark:text-slate-300">
          Belum ada pertanyaan kuis yang diatur.
        </div>
      ) : finished ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FFB6CB]/35 text-[#e11d48] dark:text-[#FFB6CB] flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-serif-display text-3xl font-bold text-[#263C59] dark:text-white">
            Skor Kamu {score} / {questions.length}!
          </h3>
          <p className="text-sm text-[#263C59]/80 dark:text-slate-300 max-w-md mx-auto">
            {score === questions.length
              ? 'Nilai sempurna! Semua jawaban di semesta kecil kita memang milikmu.'
              : 'Usaha yang manis! Siap mencoba putaran berikutnya kapan saja.'}
          </p>
          <button
            type="button"
            onClick={restartQuiz}
            className="px-6 py-2.5 rounded-full bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold"
          >
            Main Kuis Lagi
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs text-[#263C59]/65 dark:text-slate-400 mb-3 tabular-nums">
            <span>
              Pertanyaan {step + 1} dari {questions.length}
            </span>
            <span>Skor: {score}</span>
          </div>

          <h3 className="font-serif-display text-xl font-semibold text-[#263C59] dark:text-white mb-5">
            {current.question}
          </h3>

          <div className="space-y-2.5">
            {current.options.map((opt, idx) => {
              const isSelected = selected === idx;
              const isCorrect = idx === current.correctIndex;
              let btnClass =
                'bg-white/80 dark:bg-white/5 border-[#263C59]/15 dark:border-white/15 hover:bg-white dark:hover:bg-white/10';
              if (selected !== null) {
                if (isCorrect) {
                  btnClass =
                    'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-900 dark:text-emerald-100';
                } else if (isSelected) {
                  btnClass =
                    'bg-rose-100 dark:bg-rose-900/40 border-rose-500 text-rose-900 dark:text-rose-100';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  disabled={selected !== null}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#263C59]/10 dark:border-white/10">
              <p className="text-xs sm:text-sm text-[#263C59]/80 dark:text-slate-300">
                {current.note}
              </p>
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold shrink-0"
              >
                {step + 1 >= questions.length ? 'Lihat Hasil' : 'Pertanyaan Berikutnya'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Editor Kuis Pemilik */}
      {editingQuiz && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0c1422]/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveQuestions}
            className="w-full max-w-2xl bg-white dark:bg-[#172336] rounded-2xl p-6 shadow-2xl border border-[#263C59]/10 dark:border-white/10 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-xl font-bold text-[#263C59] dark:text-white">
                Sesuaikan Kuis Kita
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuiz(false)}
                aria-label="Tutup jendela"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {draftQuestions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-[#263C59]/15 dark:border-white/15 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#263C59] dark:text-[#FFB6CB]">
                      Pertanyaan #{qIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftQuestions((prev) =>
                          prev.filter((_, i) => i !== qIdx),
                        )
                      }
                      className="text-rose-600 dark:text-rose-400 text-xs inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={q.question}
                    onChange={(e) =>
                      setDraftQuestions((prev) =>
                        prev.map((item, i) =>
                          i === qIdx ? { ...item, question: e.target.value } : item,
                        ),
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#263C59]/20 dark:border-white/15 bg-transparent text-sm"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctIndex === oIdx}
                          onChange={() =>
                            setDraftQuestions((prev) =>
                              prev.map((item, i) =>
                                i === qIdx ? { ...item, correctIndex: oIdx } : item,
                              ),
                            )
                          }
                        />
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) =>
                            setDraftQuestions((prev) =>
                              prev.map((item, i) =>
                                i === qIdx
                                  ? {
                                      ...item,
                                      options: item.options.map((o, oi) =>
                                        oi === oIdx ? e.target.value : o,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#263C59]/20 dark:border-white/15 bg-transparent text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setDraftQuestions((prev) => [
                  ...prev,
                  {
                    id: `quiz-${Date.now()}`,
                    question: 'Pertanyaan baru untuk Ityin',
                    options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                    correctIndex: 0,
                    note: 'Catatan kenangan manis',
                  },
                ])
              }
              className="px-4 py-2 rounded-xl border border-dashed border-[#263C59]/30 dark:border-white/25 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Pertanyaan
            </button>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingQuiz(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] text-sm font-semibold"
              >
                Simpan Kuis
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ==================== HALAMAN PERMAINAN UTAMA ====================
export const GamesPage: React.FC<GamesPageProps> = ({
  quizQuestions,
  isOwner,
  onSaveQuiz,
  onRequestUnlock,
}) => {
  const [activeGame, setActiveGame] = useState<GameTab>('catcher');

  return (
    <div className="min-h-screen pt-24 pb-28 px-4 sm:px-6 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#263C59]/65 dark:text-[#B3D9F2] font-semibold">
          Permainan Mini Berdua
        </p>
        <h1 className="mt-1 font-serif-display text-3xl sm:text-4xl font-bold text-[#263C59] dark:text-white flex items-center justify-center gap-2 text-balance">
          <span>Little Games</span>
          <Heart className="w-6 h-6 text-[#FFB6CB] fill-[#FFB6CB] shrink-0" />
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#263C59]/75 dark:text-slate-300">
          Tiga permainan romantis yang ringan dan nyaman disentuh di ponsel untuk momen seru berdua.
        </p>

        {/* Pemilih Game */}
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-[#263C59]/8 dark:bg-white/10">
          {(
            [
              ['catcher', 'Tangkap Hati', Heart],
              ['memory', 'Cocokkan Memori', Gamepad2],
              ['quiz', 'Kuis Kita', HelpCircle],
            ] as Array<[GameTab, string, React.ComponentType<{ className?: string }>]>
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveGame(id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeGame === id
                  ? 'bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] shadow-sm'
                  : 'text-[#263C59] dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeGame === 'catcher' && <HeartCatcherGame />}
      {activeGame === 'memory' && <MemoryMatchGame />}
      {activeGame === 'quiz' && (
        <OurQuizGame
          questions={quizQuestions}
          isOwner={isOwner}
          onSaveQuiz={onSaveQuiz}
          onRequestUnlock={onRequestUnlock}
        />
      )}
    </div>
  );
};
