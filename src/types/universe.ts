export type PageId =
  | 'home'
  | 'memories'
  | 'music'
  | 'letter'
  | 'journey'
  | 'games'
  | 'dreams';

export interface SiteConfig {
  siteTitle: string;
  subtitle: string;
  openingMessage: string;
  supportingMessage: string;
  heroCtaLabel: string;
  locationLabel: string;
}

export interface MemoryItem {
  id: string;
  slotNumber: number;
  imageUrl: string;
  title: string;
  date: string;
  description: string;
  frameStyle: 'polaroid' | 'linen' | 'vintage';
  isDefaultSlot?: boolean;
}

export interface PlaylistSlot {
  slotIndex: number; // 1 to 10
  youtubeUrl: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  addedAt: string | null;
}

export interface LoveLetterData {
  title: string;
  date: string;
  content: string;
  signature: string;
}

export interface MilestoneItem {
  id: string;
  date: string;
  title: string;
  location: string;
  description: string;
}

export interface JourneyData {
  startDate: string | null; // ISO date string YYYY-MM-DDTHH:mm or null until configured
  partnerName: string;
  milestones: MilestoneItem[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  note: string;
}

export type DreamCategory =
  | 'Travel'
  | 'Home'
  | 'Business'
  | 'Future'
  | 'Personal Dreams';

export interface DreamItem {
  id: string;
  title: string;
  category: DreamCategory;
  description: string;
  targetDate: string;
  completed: boolean;
  progress: number;
}

export interface UniverseData {
  siteConfig: SiteConfig;
  memories: MemoryItem[];
  playlist: PlaylistSlot[];
  letter: LoveLetterData;
  journey: JourneyData;
  quizQuestions: QuizQuestion[];
  dreams: DreamItem[];
  updatedAt: string;
}

export type PersistenceMode = 'supabase' | 'ephemeral-disk' | 'browser-local';

export interface StorageStatus {
  mode: PersistenceMode;
  isPersistent: boolean;
  ownerAuthConfigured: boolean;
  lastSavedAt: string | null;
}
