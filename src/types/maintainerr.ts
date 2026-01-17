// Maintainerr API Types

export interface MaintainerrConfig {
  baseUrl: string;
  apiKey: string;
}

// Plex Library normalized for app use (mapped from API response)
export interface PlexLibrary {
  id: string;      // mapped from 'key'
  name: string;    // mapped from 'title'
  type: 'movie' | 'show';
}

// Raw Plex media item from API
export interface PlexMediaItem {
  ratingKey: string;
  title: string;
  year?: number;
  type: 'movie' | 'show';
  thumb?: string;
  art?: string;
  summary?: string;
  addedAt: number;
  lastViewedAt?: number;
  duration?: number;
  childCount?: number; // seasons for TV
  Genre?: Array<{ tag: string }>;
  Guid?: Array<{ id: string }>; // External IDs like tmdb://12345
}

// Plex library content response
export interface PlexLibraryContent {
  totalSize: number;
  items: PlexMediaItem[];
}

// Maintainerr Collection from API
export interface MaintainerrCollection {
  id: number;
  title: string;
  description?: string;
  isActive: boolean;
  arrAction: number;
  visibleOnHome: boolean;
  deleteAfterDays?: number;
  manualCollection: boolean;
  librarySectionId?: number;
  media?: Array<{ id: number; plexId: number }>;
}

// App's normalized MediaItem
export interface MediaItem {
  id: number;
  plexId: string;
  title: string;
  year: number;
  type: 'movie' | 'tv';
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  tmdbId?: number; // TMDB ID for fetching posters
  genres: string[];
  runtime?: number; // minutes for movies
  seasons?: number; // for TV shows
  addedAt: string;
  lastWatchedAt?: string;
  collections: Collection[];
  isExcluded: boolean;
  librarySectionId?: number;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  mediaCount: number;
  isActive: boolean;
  librarySectionId?: number;
}

export interface Rule {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  mediaType: 'movie' | 'tv' | 'both';
}

export type SwipeDirection = 'left' | 'right' | 'down';

export interface SwipeAction {
  mediaId: number;
  direction: SwipeDirection;
  collectionId?: number;
  timestamp: number;
}

export interface AppState {
  config: MaintainerrConfig | null;
  isConnected: boolean;
  selectedCollectionId: number | null;
  currentIndex: number;
  mediaItems: MediaItem[];
  filters: FilterOptions;
  swipeHistory: SwipeAction[];
}

export interface FilterOptions {
  mediaType: 'all' | 'movie' | 'tv';
  sortBy: 'oldest' | 'lastWatched' | 'uncollected';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
