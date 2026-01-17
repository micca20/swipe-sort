import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { MaintainerrConfig, MediaItem, Collection, FilterOptions } from '@/types/maintainerr';
import { maintainerrApi } from '@/lib/api';
import * as storage from '@/lib/storage';

interface AppContextType {
  // Connection state
  config: MaintainerrConfig | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Data
  mediaItems: MediaItem[];
  collections: Collection[];
  currentIndex: number;
  selectedCollectionId: number | null;
  filters: FilterOptions;
  
  // Actions
  connect: (config: MaintainerrConfig) => Promise<boolean>;
  disconnect: () => void;
  setSelectedCollection: (id: number | null) => void;
  setFilters: (filters: FilterOptions) => void;
  advanceToNext: () => void;
  resetProgress: () => void;
  refreshData: () => Promise<void>;
  
  // Computed
  currentMedia: MediaItem | null;
  remainingCount: number;
  totalCount: number;
  filteredMedia: MediaItem[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<MaintainerrConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCollectionId, setSelectedCollectionIdState] = useState<number | null>(null);
  const [filters, setFiltersState] = useState<FilterOptions>({ mediaType: 'all', sortBy: 'oldest' });

  // Initialize from storage
  useEffect(() => {
    const storedConfig = storage.getConfig();
    const storedIndex = storage.getCurrentIndex();
    const storedCollection = storage.getSelectedCollection();
    const storedFilters = storage.getFilters();

    if (storedConfig) {
      setConfig(storedConfig);
      maintainerrApi.setConfig(storedConfig);
      setIsConnected(true);
    }
    
    setCurrentIndex(storedIndex);
    setSelectedCollectionIdState(storedCollection);
    setFiltersState(storedFilters);
    setIsLoading(false);
  }, []);

  // Filter and sort media
  const filteredMedia = useCallback(() => {
    let items = [...mediaItems];
    
    // Filter by type
    if (filters.mediaType !== 'all') {
      items = items.filter(item => item.type === filters.mediaType);
    }
    
    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        items.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
        break;
      case 'lastWatched':
        items.sort((a, b) => {
          if (!a.lastWatchedAt) return 1;
          if (!b.lastWatchedAt) return -1;
          return new Date(a.lastWatchedAt).getTime() - new Date(b.lastWatchedAt).getTime();
        });
        break;
      case 'uncollected':
        items.sort((a, b) => a.collections.length - b.collections.length);
        break;
    }
    
    return items;
  }, [mediaItems, filters]);

  const connect = useCallback(async (newConfig: MaintainerrConfig): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    maintainerrApi.setConfig(newConfig);
    
    const result = await maintainerrApi.testConnection();
    
    if (!result.success) {
      setError(result.error || 'Connection failed');
      setIsLoading(false);
      return false;
    }
    
    // Save config and update state
    storage.saveConfig(newConfig);
    setConfig(newConfig);
    setIsConnected(true);
    
    // Fetch initial data
    const [mediaResult, collectionsResult] = await Promise.all([
      maintainerrApi.getMedia(),
      maintainerrApi.getCollections(),
    ]);
    
    if (mediaResult.success && mediaResult.data) {
      setMediaItems(mediaResult.data);
    }
    
    if (collectionsResult.success && collectionsResult.data) {
      setCollections(collectionsResult.data);
    }
    
    setIsLoading(false);
    return true;
  }, []);

  const disconnect = useCallback(() => {
    storage.clearAllData();
    setConfig(null);
    setIsConnected(false);
    setMediaItems([]);
    setCollections([]);
    setCurrentIndex(0);
    setSelectedCollectionIdState(null);
    setFiltersState({ mediaType: 'all', sortBy: 'oldest' });
  }, []);

  const setSelectedCollection = useCallback((id: number | null) => {
    setSelectedCollectionIdState(id);
    storage.saveSelectedCollection(id);
  }, []);

  const setFilters = useCallback((newFilters: FilterOptions) => {
    setFiltersState(newFilters);
    storage.saveFilters(newFilters);
    // Reset index when filters change
    setCurrentIndex(0);
    storage.saveCurrentIndex(0);
  }, []);

  const advanceToNext = useCallback(() => {
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    storage.saveCurrentIndex(newIndex);
  }, [currentIndex]);

  const resetProgressAction = useCallback(() => {
    setCurrentIndex(0);
    storage.resetProgress();
  }, []);

  const refreshData = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    
    const [mediaResult, collectionsResult] = await Promise.all([
      maintainerrApi.getMedia(),
      maintainerrApi.getCollections(),
    ]);
    
    if (mediaResult.success && mediaResult.data) {
      setMediaItems(mediaResult.data);
    }
    
    if (collectionsResult.success && collectionsResult.data) {
      setCollections(collectionsResult.data);
    }
    
    setIsLoading(false);
  }, [isConnected]);

  const filtered = filteredMedia();
  const currentMedia = filtered[currentIndex] || null;
  const remainingCount = Math.max(0, filtered.length - currentIndex);
  const totalCount = filtered.length;

  return (
    <AppContext.Provider
      value={{
        config,
        isConnected,
        isLoading,
        error,
        mediaItems,
        collections,
        currentIndex,
        selectedCollectionId,
        filters,
        connect,
        disconnect,
        setSelectedCollection,
        setFilters,
        advanceToNext,
        resetProgress: resetProgressAction,
        refreshData,
        currentMedia,
        remainingCount,
        totalCount,
        filteredMedia: filtered,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
