import { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { SwipeCard } from './SwipeCard';
import { ActionButtons } from './ActionButtons';
import { MediaDetailModal } from './MediaDetailModal';
import { FilterSheet } from './FilterSheet';
import { ProgressTracker } from './ProgressTracker';
import { Button } from '@/components/ui/button';
import { maintainerrApi } from '@/lib/api';
import { addToSwipeHistory } from '@/lib/storage';
import type { SwipeDirection } from '@/types/maintainerr';
import { ArrowLeft, RefreshCw, Film, Loader2, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';

export function SwipeInterface() {
  const { 
    currentMedia, 
    filteredMedia, 
    currentIndex, 
    advanceToNext, 
    collections,
    selectedCollectionId,
    goBackToLibrary,
    refreshData,
    isLoading,
    remainingCount,
  } = useApp();

  const [showDetail, setShowDetail] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCollection = collections.find(c => c.id === selectedCollectionId);

  const handleSwipe = useCallback(async (direction: SwipeDirection) => {
    if (!currentMedia || isProcessing) return;

    setIsProcessing(true);
    console.log('[SwipeInterface] Swipe:', direction, 'Media:', currentMedia.title, 'PlexId:', currentMedia.plexId, 'CollectionId:', selectedCollectionId);

    try {
      if (direction === 'right' && selectedCollectionId) {
        // Validate library match before adding
        const collection = collections.find(c => c.id === selectedCollectionId);
        if (collection?.librarySectionId && currentMedia.librarySectionId) {
          if (collection.librarySectionId !== currentMedia.librarySectionId) {
            toast.error('Library mismatch — cannot add to this collection');
            setIsProcessing(false);
            return;
          }
        }
        
        // Add to collection
        console.log('[SwipeInterface] Adding to collection:', selectedCollectionId, 'PlexId:', currentMedia.plexId, 'TmdbId:', currentMedia.tmdbId);
        const result = await maintainerrApi.addToCollection(currentMedia.plexId, selectedCollectionId, currentMedia.tmdbId);
        console.log('[SwipeInterface] Add result:', result);
        if (result.success) {
          toast.success(`Added to ${selectedCollection?.name}`);
          // Refresh the collection after adding
          const refreshResult = await maintainerrApi.refreshCollection(selectedCollectionId);
          console.log('[SwipeInterface] Refresh result:', refreshResult);
        } else {
          toast.error(result.error || 'Failed to add to collection');
        }
      } else if (direction === 'down') {
        // Exclude
        console.log('[SwipeInterface] Excluding media:', currentMedia.plexId);
        const result = await maintainerrApi.excludeMedia(currentMedia.plexId);
        console.log('[SwipeInterface] Exclude result:', result);
        if (result.success) {
          toast.success('Marked as excluded');
        } else {
          toast.error(result.error || 'Failed to exclude');
        }
      }
      // Left swipe = skip, no API call needed

      // Record action
      addToSwipeHistory({
        mediaId: currentMedia.id,
        direction,
        collectionId: direction === 'right' ? selectedCollectionId || undefined : undefined,
        timestamp: Date.now(),
      });

      // Move to next
      advanceToNext();
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [currentMedia, selectedCollectionId, selectedCollection, advanceToNext, isProcessing]);

  const handleAction = useCallback((direction: SwipeDirection) => {
    if (direction === 'right' && !selectedCollectionId) {
      toast.warning('No collection selected - swiping right will just skip');
    }
    handleSwipe(direction);
  }, [handleSwipe, selectedCollectionId]);

  // Show next card underneath current
  const nextMedia = filteredMedia[currentIndex + 1];

  // Empty state
  if (!isLoading && remainingCount === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Film className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">All Done!</h2>
        <p className="text-muted-foreground mb-6">
          You've gone through all your media items.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="ghost" onClick={goBackToLibrary}>
            Change Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <header className="flex items-center justify-between p-4 gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goBackToLibrary}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {selectedCollection ? (
            <div className="flex items-center gap-2 text-sm">
              <FolderPlus className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Adding to:</span>
              <span className="font-medium">{selectedCollection.name}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Browse Only Mode</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <FilterSheet />
        </div>
      </header>

      {/* Progress */}
      <div className="px-4">
        <ProgressTracker />
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative p-4 overflow-hidden flex items-center justify-center">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="relative w-full max-w-sm mx-auto h-[min(70vh,36rem)]">
            {/* Background card (next) */}
            {nextMedia && (
              <SwipeCard
                key={nextMedia.id}
                item={nextMedia}
                onSwipe={() => {}}
                onTap={() => {}}
                isTop={false}
              />
            )}
            
            {/* Top card (current) */}
            {currentMedia && (
              <SwipeCard
                key={currentMedia.id}
                item={currentMedia}
                onSwipe={handleSwipe}
                onTap={() => setShowDetail(true)}
                isTop={true}
              />
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4">
        <ActionButtons
          onAction={handleAction}
          disabled={!currentMedia || isProcessing}
          selectedCollectionName={selectedCollection?.name}
        />
      </div>

      {/* Detail Modal */}
      <MediaDetailModal
        item={currentMedia}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onAction={handleAction}
        selectedCollectionName={selectedCollection?.name}
      />
    </div>
  );
}
