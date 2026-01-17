// Maintainerr API Types

export interface MaintainerrConfig {
  baseUrl: string;
  apiKey: string;
}

export interface MediaItem {
  id: number;
  title: string;
  year: number;
  type: 'movie' | 'tv';
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  genres: string[];
  runtime?: number; // minutes for movies
  seasons?: number; // for TV shows
  addedAt: string;
  lastWatchedAt?: string;
  collections: Collection[];
  isExcluded: boolean;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  mediaCount: number;
  isActive: boolean;
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
