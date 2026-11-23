import React from 'react';
import { Heart, Mountain } from 'lucide-react';
import type { PageId } from '../types/universe';

interface FooterProps {
  siteTitle: string;
  onNavigate: (page: PageId) => void;
  hasBottomPlayer: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  siteTitle,
  onNavigate,
  hasBottomPlayer,
}) => {
  return (
    <footer
      className={`border-t border-[#263C59]/10 dark:border-white/10 bg-[#FFF7F0]/90 dark:bg-[#0D1522]/95 text-[#263C59] dark:text-slate-200 transition-colors ${
        hasBottomPlayer ? 'pb-20' : 'pb-8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5 text-center md:text-left">
          <Mountain className="w-5 h-5 text-[#263C59] dark:text-[#B3D9F2] shrink-0" />
          <div>
            <p className="font-serif-display font-semibold text-base tracking-tight">
              {siteTitle}
            </p>
            <p className="text-xs text-[#263C59]/70 dark:text-slate-400">
              Dibuat penuh cinta dalam mimpi Pegunungan Swiss untuk Ityin
            </p>
          </div>
        </div>

        <nav
          aria-label="Navigasi footer"
          className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm"
        >
          {(
            [
              ['home', 'Beranda'],
              ['memories', 'Kenangan'],
              ['music', 'Musik'],
              ['letter', 'Surat'],
              ['journey', 'Perjalanan'],
              ['games', 'Permainan'],
              ['dreams', 'Ruang Impian'],
            ] as Array<[PageId, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onNavigate(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[#263C59]/80 dark:text-slate-300 hover:text-[#263C59] dark:hover:text-white hover:underline whitespace-nowrap shrink-0"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 text-xs text-[#263C59]/70 dark:text-slate-400 whitespace-nowrap shrink-0">
          <span>Khusus untuk Ityin</span>
          <Heart className="w-3.5 h-3.5 text-[#e11d48] fill-[#e11d48]" />
        </div>
      </div>
    </footer>
  );
};
