/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { AmbientEffects } from './components/AmbientEffects';
import { Footer } from './components/Footer';
import { GlobalMusicBar } from './components/GlobalMusicBar';
import { HomeVideoSection } from './components/HomeVideoSection';
import { Navigation } from './components/Navigation';
import { OwnerModal } from './components/OwnerModal';
import { DEFAULT_UNIVERSE } from './data/defaultUniverse';
import { DreamSpacePage } from './pages/DreamSpacePage';
import { GamesPage } from './pages/GamesPage';
import { HomeHeroSection, HomePortalsSection } from './pages/HomePage';
import { JourneyPage } from './pages/JourneyPage';
import { LoveLetterPage } from './pages/LoveLetterPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { MusicPage } from './pages/MusicPage';
import { MusicProvider } from './services/musicService';
import { storageAdapter } from './services/storageService';
import type {
  DreamItem,
  JourneyData,
  LoveLetterData,
  MemoryItem,
  PageId,
  PlaylistSlot,
  QuizQuestion,
  SiteConfig,
  StorageStatus,
  UniverseData,
} from './types/universe';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [universe, setUniverse] = useState<UniverseData>(DEFAULT_UNIVERSE);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [petalsEnabled, setPetalsEnabled] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    mode: 'ephemeral-disk',
    isPersistent: false,
    ownerAuthConfigured: false,
    lastSavedAt: null,
  });

  // Muat data awal & periksa sesi pemilik dari server
  useEffect(() => {
    let mounted = true;
    Promise.all([
      storageAdapter.loadUniverse(),
      storageAdapter.checkAuthStatus(),
    ])
      .then(([loaded, auth]) => {
        if (!mounted) return;
        setUniverse(loaded.data);
        setIsOwner(auth.isOwner);
        setStorageStatus({
          mode: loaded.mode,
          isPersistent: loaded.isPersistent,
          ownerAuthConfigured: auth.ownerAuthConfigured,
          lastSavedAt: loaded.data.updatedAt || null,
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Sinkronkan kelas .dark Tailwind pada elemen <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const persistUniverse = useCallback(async (nextData: UniverseData) => {
    try {
      setSaveError(null);
      const res = await storageAdapter.saveUniverse(nextData);
      setUniverse(res.data);
      setStorageStatus((prev) => ({
        ...prev,
        mode: res.mode,
        isPersistent: res.isPersistent,
        lastSavedAt: res.data.updatedAt,
      }));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menyimpan perubahan ke server.';
      setSaveError(msg);
      throw err;
    }
  }, []);

  const handleUpdateMemories = useCallback(
    async (memories: MemoryItem[]) => {
      await persistUniverse({ ...universe, memories });
    },
    [universe, persistUniverse],
  );

  const handleUpdatePlaylist = useCallback(
    async (playlist: PlaylistSlot[]) => {
      await persistUniverse({ ...universe, playlist });
    },
    [universe, persistUniverse],
  );

  const handleSaveLetter = useCallback(
    async (letter: LoveLetterData) => {
      await persistUniverse({ ...universe, letter });
    },
    [universe, persistUniverse],
  );

  const handleSaveJourney = useCallback(
    async (journey: JourneyData) => {
      await persistUniverse({ ...universe, journey });
    },
    [universe, persistUniverse],
  );

  const handleSaveQuiz = useCallback(
    async (quizQuestions: QuizQuestion[]) => {
      await persistUniverse({ ...universe, quizQuestions });
    },
    [universe, persistUniverse],
  );

  const handleSaveDreams = useCallback(
    async (dreams: DreamItem[]) => {
      await persistUniverse({ ...universe, dreams });
    },
    [universe, persistUniverse],
  );

  const handleSaveSiteConfig = useCallback(
    async (siteConfig: SiteConfig) => {
      await persistUniverse({ ...universe, siteConfig });
    },
    [universe, persistUniverse],
  );

  const handleVerifyPasscode = useCallback(async (passcode: string) => {
    const res = await storageAdapter.verifyOwner(passcode);
    if (res.ok) {
      setIsOwner(true);
    }
    return res;
  }, []);

  const handleLockOwner = useCallback(() => {
    storageAdapter.lockOwner();
    setIsOwner(false);
  }, []);

  const publishedPlaylistCount = universe.playlist.filter(
    (s) => Boolean(s.videoId && s.title.trim()),
  ).length;
  const completedDreamsCount = universe.dreams.filter((d) => d.completed).length;

  const scrollToElement = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <MusicProvider playlist={universe.playlist}>
      <div className="min-h-screen flex flex-col bg-[#FFF7F0] dark:bg-[#0D1522] text-[#263C59] dark:text-slate-100 transition-colors duration-200">
        <AmbientEffects enabled={petalsEnabled} isDark={isDark} />

        <Navigation
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          isOwner={isOwner}
          onOpenOwnerStudio={() => setOwnerModalOpen(true)}
          siteTitle={universe.siteConfig.siteTitle}
        />

        <main className="flex-1 relative z-20">
          {loading ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="font-serif-display text-2xl font-bold">
                  OUR LITTLE UNIVERSE
                </p>
                <p className="text-sm opacity-70">
                  Menyiapkan dunia Alpen kita untuk Ityin...
                </p>
              </div>
            </div>
          ) : (
            currentPage === 'home' && (
              <HomeHeroSection
                siteConfig={universe.siteConfig}
                isDark={isDark}
                onEnterWorld={() => scrollToElement('home-video-section')}
                onNavigate={setCurrentPage}
              />
            )
          )}

          {/* Player B — Soundtrack: satu-satunya sumber audio resmi (default Slot 01), tetap hidup offscreen saat berpindah halaman */}
          <HomeVideoSection
            visible={!loading && currentPage === 'home'}
            isDark={isDark}
            onScrollToPortals={() => scrollToElement('home-portals-section')}
            onOpenSoundtrack={() => setCurrentPage('music')}
          />

          {!loading && (
            <>
              {currentPage === 'home' && (
                <HomePortalsSection
                  isDark={isDark}
                  journey={universe.journey}
                  memoriesCount={universe.memories.length}
                  playlistCount={publishedPlaylistCount}
                  dreamsCount={universe.dreams.length}
                  completedDreamsCount={completedDreamsCount}
                  onNavigate={setCurrentPage}
                />
              )}

              {currentPage === 'memories' && (
                <MemoriesPage
                  memories={universe.memories}
                  isOwner={isOwner}
                  onUpdateMemories={handleUpdateMemories}
                  onRequestUnlock={() => setOwnerModalOpen(true)}
                />
              )}

              {currentPage === 'music' && (
                <MusicPage
                  playlist={universe.playlist}
                  isOwner={isOwner}
                  onUpdatePlaylist={handleUpdatePlaylist}
                  onRequestUnlock={() => setOwnerModalOpen(true)}
                />
              )}

              {currentPage === 'letter' && (
                <LoveLetterPage
                  letter={universe.letter}
                  isOwner={isOwner}
                  isDark={isDark}
                  onSaveLetter={handleSaveLetter}
                  onRequestUnlock={() => setOwnerModalOpen(true)}
                />
              )}

              {currentPage === 'journey' && (
                <JourneyPage
                  journey={universe.journey}
                  isOwner={isOwner}
                  onSaveJourney={handleSaveJourney}
                  onRequestUnlock={() => setOwnerModalOpen(true)}
                />
              )}

              {currentPage === 'games' && (
                <GamesPage
                  quizQuestions={universe.quizQuestions}
                  isOwner={isOwner}
                  onSaveQuiz={handleSaveQuiz}
                  onRequestUnlock={() => setOwnerModalOpen(true)}
                />
              )}

              {currentPage === 'dreams' && (
                <DreamSpacePage
                  dreams={universe.dreams}
                  isOwner={isOwner}
                  onSaveDreams={handleSaveDreams}
                  onRequestUnlock={() => setOwnerModalOpen(true)}
                />
              )}
            </>
          )}
        </main>

        <Footer
          siteTitle={universe.siteConfig.siteTitle}
          onNavigate={setCurrentPage}
          hasBottomPlayer={true}
        />

        <GlobalMusicBar onOpenPage={setCurrentPage} />

        <OwnerModal
          open={ownerModalOpen}
          onClose={() => setOwnerModalOpen(false)}
          isOwner={isOwner}
          onVerifyPasscode={handleVerifyPasscode}
          onLockOwner={handleLockOwner}
          universe={universe}
          onSaveSiteConfig={handleSaveSiteConfig}
          onImportUniverse={persistUniverse}
          onNavigate={setCurrentPage}
          storageStatus={storageStatus}
          saveError={saveError}
          petalsEnabled={petalsEnabled}
          onTogglePetals={() => setPetalsEnabled((p) => !p)}
        />
      </div>
    </MusicProvider>
  );
}
