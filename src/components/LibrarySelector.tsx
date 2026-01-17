import { Film, Tv, Music, Image, LogOut, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PlexLibrary } from '@/types/maintainerr';

const getLibraryIcon = (type: string) => {
  switch (type) {
    case 'movie':
      return Film;
    case 'show':
      return Tv;
    case 'artist':
      return Music;
    case 'photo':
      return Image;
    default:
      return Film;
  }
};

const getLibraryLabel = (type: string) => {
  switch (type) {
    case 'movie':
      return 'Movies';
    case 'show':
      return 'TV Shows';
    case 'artist':
      return 'Music';
    case 'photo':
      return 'Photos';
    default:
      return 'Media';
  }
};

export const LibrarySelector = () => {
  const { libraries, selectLibrary, disconnect, isLoading } = useApp();

  const handleSelectLibrary = (library: PlexLibrary) => {
    selectLibrary(library.id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">Select Library</h1>
        <Button variant="ghost" size="sm" onClick={disconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <p className="text-muted-foreground mb-6 text-center">
          Choose which Plex library you want to browse
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading libraries...</p>
          </div>
        ) : libraries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No libraries found</p>
            <Button variant="outline" className="mt-4" onClick={disconnect}>
              Go Back
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 max-w-md mx-auto">
            {libraries.map((library) => {
              const Icon = getLibraryIcon(library.type);
              return (
                <Card
                  key={library.id}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
                  onClick={() => handleSelectLibrary(library)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{library.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getLibraryLabel(library.type)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
