import type { MediaItem } from '@/types/maintainerr';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Film, Tv, Clock, Calendar, Check, X, Ban } from 'lucide-react';
import type { SwipeDirection } from '@/types/maintainerr';

interface MediaDetailModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (direction: SwipeDirection) => void;
  selectedCollectionName?: string;
}

export function MediaDetailModal({ 
  item, 
  isOpen, 
  onClose, 
  onAction,
  selectedCollectionName 
}: MediaDetailModalProps) {
  if (!item) return null;

  const posterUrl = item.posterPath
    ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
    : '/placeholder.svg';

  const handleAction = (direction: SwipeDirection) => {
    onAction(direction);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 overflow-hidden">
        {/* Poster Header */}
        <div className="relative h-64 w-full">
          <img
            src={posterUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Type Badge */}
          <div className="absolute top-4 left-4">
            <Badge variant={item.type === 'movie' ? 'default' : 'secondary'} className="gap-1">
              {item.type === 'movie' ? (
                <>
                  <Film className="w-3 h-3" />
                  Movie
                </>
              ) : (
                <>
                  <Tv className="w-3 h-3" />
                  TV Show
                </>
              )}
            </Badge>
          </div>
        </div>

        <ScrollArea className="max-h-[50vh]">
          <div className="p-4 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold pr-8">
                {item.title}
                <span className="text-muted-foreground font-normal ml-2">
                  ({item.year})
                </span>
              </DialogTitle>
            </DialogHeader>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {item.runtime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(item.runtime / 60)}h {item.runtime % 60}m
                </div>
              )}
              {item.seasons && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {item.seasons} Season{item.seasons > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Genres */}
            {item.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.genres.map((genre, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Overview */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.overview || 'No description available.'}
            </p>

            {/* Current Collections */}
            {item.collections.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">In Collections</h4>
                <div className="flex flex-wrap gap-1.5">
                  {item.collections.map((collection) => (
                    <Badge key={collection.id} variant="secondary" className="text-xs">
                      {collection.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 p-4 border-t border-border">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2"
            onClick={() => handleAction('left')}
          >
            <X className="w-4 h-4" />
            Skip
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => handleAction('down')}
          >
            <Ban className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            className="flex-1 gap-2"
            onClick={() => handleAction('right')}
            disabled={!selectedCollectionName}
          >
            <Check className="w-4 h-4" />
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
