import { ArrowLeft, FolderPlus, Eye, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const CollectionSetupScreen = () => {
  const { 
    collections, 
    selectedCollectionId, 
    setSelectedCollectionId, 
    goToSwipe,
    goBackToLibrary,
    isLoading,
    mediaItems,
    selectedLibraryId,
  } = useApp();

  // Get the librarySectionId from the current media or selected library
  const currentLibrarySectionId = mediaItems[0]?.librarySectionId ?? (selectedLibraryId ? parseInt(selectedLibraryId, 10) : undefined);
  
  // Filter collections to only show those compatible with the current library
  const compatibleCollections = collections.filter(
    c => !c.librarySectionId || !currentLibrarySectionId || c.librarySectionId === currentLibrarySectionId
  );
  
  const incompatibleCount = collections.length - compatibleCollections.length;

  const handleSelectCollection = (collectionId: number | null) => {
    setSelectedCollectionId(collectionId);
  };

  const handleContinue = () => {
    goToSwipe();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={goBackToLibrary}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Choose Collection</h1>
          <p className="text-sm text-muted-foreground">Where should swiped items go?</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading media...</p>
          </div>
        ) : (
          <div className="grid gap-3 max-w-md mx-auto">
            {/* Browse Only Option */}
            <Card
              className={`p-4 cursor-pointer transition-colors border-2 ${
                selectedCollectionId === null 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:bg-accent hover:border-primary/50'
              }`}
              onClick={() => handleSelectCollection(null)}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Browse Only</h3>
                  <p className="text-sm text-muted-foreground">
                    Just view media without adding to a collection
                  </p>
                </div>
                {selectedCollectionId === null && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </Card>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">Or add to collection</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Collections */}
            {compatibleCollections.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No compatible collections for this library
              </p>
            ) : (
              compatibleCollections.map((collection) => (
                <Card
                  key={collection.id}
                  className={`p-4 cursor-pointer transition-colors border-2 ${
                    selectedCollectionId === collection.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-accent hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectCollection(collection.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    {selectedCollectionId === collection.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </Card>
              ))
            )}
            
            {/* Incompatible collections notice */}
            {incompatibleCount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{incompatibleCount} collection{incompatibleCount > 1 ? 's' : ''} hidden (different library)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && (
        <div className="p-4 border-t border-border">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleContinue}
          >
            Continue to Swipe
          </Button>
        </div>
      )}
    </div>
  );
};
