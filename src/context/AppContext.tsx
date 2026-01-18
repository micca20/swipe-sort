import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { MaintainerrConfig, MediaItem, Collection, FilterOptions, PlexLibrary } from '@/types/maintainerr';
import { maintainerrApi } from '@/lib/api';
import * as storage from '@/lib/storage';
import { toast } from 'sonner';

type AppStep = 'setup' | 'library' | 'collection' | 'swipe';

interface AppContextType {
  // Connection state
  config: MaintainerrConfig | null;
  isConnected: boolean;
  isLoading: boolean;
  loadingProgress: { current: number; total: number } | null;
  error: string | null;
  
  // App step
  appStep: AppStep;
  
  // Data
  mediaItems: MediaItem[];
  collections: Collection[];
  libraries: PlexLibrary[];
  selectedLibraryId: string | null;
  currentIndex: number;
  selectedCollectionId: number | null;
  filters: FilterOptions;
  
  // Actions
  connect: (config: MaintainerrConfig) => Promise<boolean>;
  disconnect: () => void;
  selectLibrary: (libraryId: string) => Promise<void>;
  goBackToLibrary: () => void;
  goToSwipe: () => void;
  setSelectedCollectionId: (id: number | null) => void;
  setFilters: (filters: FilterOptions) => void;
  advanceToNext: () => void;
  resetProgress: () => void;
  refreshData: () => Promise<void>;
  getPosterUrl: (posterPath: string | null) => string;
  
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
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // App step
  const [appStep, setAppStep] = useState<AppStep>('setup');
  
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [libraries, setLibraries] = useState<PlexLibrary[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCollectionId, setSelectedCollectionIdState] = useState<number | null>(null);
  const [filters, setFiltersState] = useState<FilterOptions>({ mediaType: 'all', sortBy: 'oldest' });

  // Initialize from storage
  useEffect(() => {
    const storedConfig = storage.getConfig();
    const storedIndex = storage.getCurrentIndex();
    const storedCollection = storage.getSelectedCollection();
    const storedFilters = storage.getFilters();
    const storedStep = storage.getAppStep();
    const storedLibrary = storage.getSelectedLibrary();

    if (storedConfig) {
      setConfig(storedConfig);
      maintainerrApi.setConfig(storedConfig);
      setIsConnected(true);
      
      // Validate stored library - if it's falsy, "undefined", or "null", reset to library selection
      const isValidLibrary = storedLibrary && storedLibrary !== 'undefined' && storedLibrary !== 'null';
      
      // Restore step - but validate it
      if (storedStep === 'swipe' || storedStep === 'collection') {
        if (isValidLibrary) {
          setSelectedLibraryId(storedLibrary);
          setAppStep(storedStep);
        } else {
          // Invalid library stored, go back to library selection
          console.warn('Invalid stored library ID, resetting to library selection');
          setAppStep('library');
          storage.saveAppStep('library');
          storage.saveSelectedLibrary(null);
        }
      } else if (storedStep !== 'setup') {
        setAppStep(storedStep);
      } else {
        setAppStep('library');
      }
    }
    
    setCurrentIndex(storedIndex);
    setSelectedCollectionIdState(storedCollection);
    setFiltersState(storedFilters);
    setIsLoading(false);
  }, []);

  // Fetch libraries when we enter library step
  useEffect(() => {
    if (isConnected && appStep === 'library' && libraries.length === 0 && !isLoading) {
      fetchLibraries();
    }
  }, [isConnected, appStep, libraries.length, isLoading]);

  // Fetch media when library is selected and we enter collection step
  useEffect(() => {
    if (selectedLibraryId && appStep === 'collection' && mediaItems.length === 0 && !isLoading) {
      fetchLibraryMedia(selectedLibraryId);
    }
  }, [selectedLibraryId, appStep, mediaItems.length, isLoading]);

  const fetchLibraries = async () => {
    setIsLoading(true);
    try {
      const librariesResponse = await maintainerrApi.getPlexLibraries();
      if (librariesResponse.success && librariesResponse.data) {
        setLibraries(librariesResponse.data);
      } else {
        toast.error('Failed to load libraries');
      }

      // Also fetch collections
      const collectionsResponse = await maintainerrApi.getCollections();
      if (collectionsResponse.success && collectionsResponse.data) {
        setCollections(collectionsResponse.data);
      }
    } catch (err) {
      toast.error('Failed to fetch libraries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLibraryMedia = async (libraryId: string) => {
    // Guard against invalid library IDs
    if (!libraryId || libraryId === 'undefined' || libraryId === 'null') {
      console.error('Invalid library ID:', libraryId);
      toast.error('Invalid library selected. Please select a library.');
      setAppStep('library');
      storage.saveAppStep('library');
      storage.saveSelectedLibrary(null);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await maintainerrApi.getLibraryMedia(libraryId);
      if (response.success && response.data) {
        setMediaItems(response.data);
        setCurrentIndex(0);
        toast.success(`Loaded ${response.data.length} media items`);
      } else {
        toast.error(response.error || 'Failed to load media');
      }
    } catch (err) {
      toast.error('Failed to fetch media');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort media
  const filteredMedia = useCallback(() => {
    let items = [...mediaItems];
    
    // Filter out media already in the selected collection
    if (selectedCollectionId) {
      const selectedCollection = collections.find(c => c.id === selectedCollectionId);
      if (selectedCollection?.mediaPlexIds?.length) {
        const existingPlexIds = new Set(selectedCollection.mediaPlexIds.map(id => String(id)));
        items = items.filter(item => !existingPlexIds.has(item.plexId));
      }
    }
    
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
  }, [mediaItems, filters, selectedCollectionId, collections]);

  const connect = useCallback(async (newConfig: MaintainerrConfig): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(null);
    
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
    
    // Fetch libraries
    toast.info('Fetching Plex libraries...');
    const librariesResult = await maintainerrApi.getPlexLibraries();
    
    if (librariesResult.success && librariesResult.data) {
      setLibraries(librariesResult.data);
    }
    
    // Fetch collections
    const collectionsResult = await maintainerrApi.getCollections();
    if (collectionsResult.success && collectionsResult.data) {
      setCollections(collectionsResult.data);
    }
    
    // Go to library selection step
    setAppStep('library');
    storage.saveAppStep('library');
    
    setIsLoading(false);
    return true;
  }, []);

  const disconnect = useCallback(() => {
    storage.clearAllData();
    setConfig(null);
    setIsConnected(false);
    setMediaItems([]);
    setCollections([]);
    setLibraries([]);
    setSelectedLibraryId(null);
    setCurrentIndex(0);
    setSelectedCollectionIdState(null);
    setFiltersState({ mediaType: 'all', sortBy: 'oldest' });
    setAppStep('setup');
  }, []);

  const selectLibrary = useCallback(async (libraryId: string) => {
    if (!libraryId) {
      toast.error('No library selected');
      return;
    }
    
    setSelectedLibraryId(libraryId);
    setMediaItems([]); // Clear old media
    setCurrentIndex(0);
    storage.saveSelectedLibrary(libraryId);
    storage.saveAppStep('collection');
    setAppStep('collection');
    
    // Fetch media for this library
    await fetchLibraryMedia(libraryId);
  }, []);

  const goBackToLibrary = useCallback(() => {
    setSelectedLibraryId(null);
    setMediaItems([]);
    setCurrentIndex(0);
    storage.saveSelectedLibrary(null);
    storage.saveAppStep('library');
    setAppStep('library');
  }, []);

  const goToSwipe = useCallback(() => {
    storage.saveAppStep('swipe');
    setAppStep('swipe');
  }, []);

  const setSelectedCollectionId = useCallback((id: number | null) => {
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
    if (!isConnected || !selectedLibraryId) return;
    
    setIsLoading(true);
    toast.info('Refreshing data...');
    
    const [mediaResult, collectionsResult] = await Promise.all([
      maintainerrApi.getLibraryMedia(selectedLibraryId),
      maintainerrApi.getCollections(),
    ]);
    
    if (mediaResult.success && mediaResult.data) {
      setMediaItems(mediaResult.data);
      toast.success(`Loaded ${mediaResult.data.length} media items`);
    }
    
    if (collectionsResult.success && collectionsResult.data) {
      setCollections(collectionsResult.data);
    }
    
    setIsLoading(false);
  }, [isConnected, selectedLibraryId]);

  const getPosterUrl = useCallback((posterPath: string | null) => {
    return maintainerrApi.getPosterUrl(posterPath);
  }, []);

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
        loadingProgress,
        error,
        appStep,
        mediaItems,
        collections,
        libraries,
        selectedLibraryId,
        currentIndex,
        selectedCollectionId,
        filters,
        connect,
        disconnect,
        selectLibrary,
        goBackToLibrary,
        goToSwipe,
        setSelectedCollectionId,
        setFilters,
        advanceToNext,
        resetProgress: resetProgressAction,
        refreshData,
        getPosterUrl,
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
