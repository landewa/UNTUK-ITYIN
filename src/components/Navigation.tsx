import React, { useState } from 'react';
import {
  CalendarHeart,
  Gamepad2,
  Home,
  Images,
  Lock,
  Mail,
  Menu,
  Moon,
  Mountain,
  Music,
  Sparkles,
  Sun,
  Unlock,
  X,
} from 'lucide-react';
import type { PageId } from '../types/universe';

interface NavigationProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isOwner: boolean;
  onOpenOwnerStudio: () => void;
  siteTitle: string;
}

const NAV_ITEMS: Array<{
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'memories', label: 'Kenangan', icon: Images },
  { id: 'music', label: 'Musik', icon: Music },
  { id: 'letter', label: 'Surat', icon: Mail },
  { id: 'journey', label: 'Perjalanan', icon: CalendarHeart },
  { id: 'games', label: 'Permainan', icon: Gamepad2 },
  { id: 'dreams', label: 'Ruang Impian', icon: Sparkles },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  isDark,
  onToggleTheme,
  isOwner,
  onOpenOwnerStudio,
  siteTitle,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (page: PageId) => {
    onNavigate(page);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-nav transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Merek */}
          <button
            type="button"
            onClick={() => handleSelect('home')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB] rounded-lg px-1.5 py-1"
          >
            <span className="w-8 h-8 rounded-lg bg-[#263C59] dark:bg-[#B3D9F2]/20 text-white dark:text-[#B3D9F2] flex items-center justify-center shadow-sm">
              <Mountain className="w-4 h-4" />
            </span>
            <span className="font-serif-display font-semibold text-base sm:text-lg tracking-tight text-[#263C59] dark:text-white whitespace-nowrap shrink-0">
              {siteTitle}
            </span>
          </button>

          {/* Tautan Navigasi Desktop */}
          <nav
            aria-label="Navigasi utama"
            className="hidden lg:flex items-center gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB] ${
                    isActive
                      ? 'bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59] shadow-sm'
                      : 'text-[#263C59]/80 dark:text-slate-200 hover:bg-[#263C59]/8 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Tombol Studio Pemilik + Tema + Menu Seluler */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenOwnerStudio}
              aria-label={isOwner ? 'Mode Pemilik Aktif' : 'Buka Studio Pemilik'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB] ${
                isOwner
                  ? 'bg-rose-100 text-[#263C59] dark:bg-[#FFB6CB]/25 dark:text-[#FFB6CB] border border-[#FFB6CB]/60'
                  : 'bg-[#263C59]/8 text-[#263C59] dark:bg-white/10 dark:text-slate-100 hover:bg-[#263C59]/15 dark:hover:bg-white/15'
              }`}
            >
              {isOwner ? (
                <Unlock className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {isOwner ? 'Mode Pemilik' : 'Studio Pemilik'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Ubah ke Tema Siang Swiss' : 'Ubah ke Tema Malam Berbintang'}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#263C59]/8 dark:bg-white/10 text-[#263C59] dark:text-[#B3D9F2] hover:bg-[#263C59]/15 dark:hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB] shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileOpen}
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-[#263C59]/8 dark:bg-white/10 text-[#263C59] dark:text-white hover:bg-[#263C59]/15 dark:hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6CB] shrink-0"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Laci Navigasi Seluler */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-[#263C59]/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <nav
            aria-label="Navigasi seluler"
            className="absolute top-14 sm:top-16 left-0 right-0 bg-[#FFF7F0] dark:bg-[#101928] border-b border-[#263C59]/10 dark:border-white/10 p-4 shadow-xl"
          >
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
                      isActive
                        ? 'bg-[#263C59] text-white dark:bg-[#FFB6CB] dark:text-[#263C59]'
                        : 'bg-white/80 dark:bg-white/5 text-[#263C59] dark:text-slate-100 hover:bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};
