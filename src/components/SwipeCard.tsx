import { useEffect, useState, useRef } from 'react';
import { useSpring, animated, to } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import type { MediaItem, SwipeDirection } from '@/types/maintainerr';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Film, Tv, Check, X, Ban, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SwipeCardProps {
  item: MediaItem;
  onSwipe: (direction: SwipeDirection) => void;
  onTap: () => void;
  isTop: boolean;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY = 0.5;

export function SwipeCard({ item, onSwipe, onTap, isTop }: SwipeCardProps) {
  const { getPosterUrl, config } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasSwipedRef = useRef(false);

  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 300, friction: 20 },
  }));

  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] }) => {
      if (!isTop || hasSwipedRef.current) return;

      setIsDragging(active);

      if (active) {
        // During drag
        api.start({
          x: mx,
          y: my,
          rotate: mx / 15,
          scale: 1.02,
          immediate: true,
        });
      } else {
        // On release - check for swipe
        const absX = Math.abs(mx);
        const absY = my; // Only care about downward swipes
        const velocityX = Math.abs(vx);
        const velocityY = vy;

        let direction: SwipeDirection | null = null;

        // Swipe down (exclude)
        if (absY > SWIPE_THRESHOLD && velocityY > SWIPE_VELOCITY && my > 0) {
          direction = 'down';
        }
        // Swipe right (add to collection)
        else if (mx > SWIPE_THRESHOLD || (velocityX > SWIPE_VELOCITY && dx > 0)) {
          if (mx > 0) direction = 'right';
        }
        // Swipe left (skip)
        else if (mx < -SWIPE_THRESHOLD || (velocityX > SWIPE_VELOCITY && dx < 0)) {
          if (mx < 0) direction = 'left';
        }

        if (direction) {
          hasSwipedRef.current = true;
          // Animate off screen
          const exitX = direction === 'right' ? 500 : direction === 'left' ? -500 : 0;
          const exitY = direction === 'down' ? 500 : 0;

          api.start({
            x: exitX,
            y: exitY,
            rotate: direction === 'down' ? 0 : exitX / 10,
            scale: 0.8,
            config: { tension: 200, friction: 25 },
            onRest: () => onSwipe(direction!),
          });
        } else {
          // Snap back
          api.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
          });
        }
      }
    },
    {
      enabled: isTop,
      filterTaps: true,
      rubberband: true,
    }
  );

  const handleClick = () => {
    if (!isDragging && isTop) {
      onTap();
    }
  };

  const [posterSrc, setPosterSrc] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(true);
  const [posterError, setPosterError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch poster - try TMDB CDN first (no auth), fallback to Plex proxy with auth
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const load = async () => {
      setPosterLoading(true);
      setPosterError(false);

      // Try TMDB CDN first if we have tmdbId and posterPath
      if (item.tmdbId && item.posterPath) {
        const tmdbUrl = `https://image.tmdb.org/t/p/w500${item.posterPath}`;
        try {
          const res = await fetch(tmdbUrl);
          if (res.ok) {
            if (!cancelled) {
              setPosterSrc(tmdbUrl);
              setPosterLoading(false);
            }
            return;
          }
        } catch {
          // TMDB failed, try Plex proxy
        }
      }

      // Fallback to Plex proxy through Maintainerr (requires API key)
      const posterUrl = getPosterUrl(item.posterPath);
      if (!config?.apiKey || !posterUrl || posterUrl === '/placeholder.svg') {
        setPosterSrc('/placeholder.svg');
        setPosterLoading(false);
        return;
      }

      try {
        const res = await fetch(posterUrl, {
          headers: { 'X-Api-Key': config.apiKey },
        });

        if (!res.ok) throw new Error(`Poster fetch failed: ${res.status}`);

        const contentType = res.headers.get('content-type');
        // Check if response is actually an image
        if (!contentType?.startsWith('image/')) {
          throw new Error('Response is not an image');
        }

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setPosterSrc(objectUrl);
          setPosterLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPosterError(true);
          setPosterLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.posterPath, item.tmdbId, config?.apiKey, getPosterUrl, retryCount]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryCount(prev => prev + 1);
  };

  return (
    <animated.div
      ref={cardRef}
      {...bind()}
      onClick={handleClick}
      className={cn(
        'absolute inset-0 touch-action-none cursor-grab active:cursor-grabbing',
        !isTop && 'pointer-events-none'
      )}
      style={{
        x,
        y,
        rotate: to([rotate], (r) => `${r}deg`),
        scale,
        zIndex: isTop ? 10 : 5,
      }}
    >
      <div className="relative w-full h-full bg-card rounded-2xl overflow-hidden shadow-2xl">
        {/* Poster */}
        <div className="relative w-full h-[60%] bg-muted">
          {/* Loading/Error placeholder with title and year */}
          {(posterLoading || posterError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-muted">
              <div className="w-16 h-16 rounded-xl bg-background/50 flex items-center justify-center mb-3">
                {item.type === 'movie' ? (
                  <Film className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <Tv className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-1">
                {item.title}
              </h3>
              <span className="text-sm text-muted-foreground">{item.year}</span>
              
              {posterLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary mt-4" />
              ) : posterError ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="mt-4"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              ) : null}
            </div>
          )}
          
          {/* Actual poster image */}
          {posterSrc && !posterLoading && !posterError && (
            <img
              src={posterSrc}
              alt={`Poster for ${item.title}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
          
          {/* Swipe Indicators */}
          <animated.div
            className="absolute inset-0 bg-success/30 flex items-center justify-center"
            style={{
              opacity: to([x], (x) => Math.min(1, Math.max(0, x / 100))),
            }}
          >
            <div className="bg-success text-success-foreground rounded-full p-4">
              <Check className="w-12 h-12" />
            </div>
          </animated.div>
          
          <animated.div
            className="absolute inset-0 bg-muted/30 flex items-center justify-center"
            style={{
              opacity: to([x], (x) => Math.min(1, Math.max(0, -x / 100))),
            }}
          >
            <div className="bg-muted text-muted-foreground rounded-full p-4">
              <X className="w-12 h-12" />
            </div>
          </animated.div>
          
          <animated.div
            className="absolute inset-0 bg-destructive/30 flex items-center justify-center"
            style={{
              opacity: to([y], (y) => Math.min(1, Math.max(0, y / 100))),
            }}
          >
            <div className="bg-destructive text-destructive-foreground rounded-full p-4">
              <Ban className="w-12 h-12" />
            </div>
          </animated.div>

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              item.type === 'movie' 
                ? 'bg-primary/90 text-primary-foreground' 
                : 'bg-accent/90 text-accent-foreground'
            )}>
              {item.type === 'movie' ? (
                <>
                  <Film className="w-3 h-3" />
                  Movie
                </>
              ) : (
                <>
                  <Tv className="w-3 h-3" />
                  TV
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="p-4 h-[40%] flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="text-xl font-bold text-foreground leading-tight line-clamp-2">
              {item.title}
            </h2>
            <span className="text-muted-foreground text-sm shrink-0">
              {item.year}
            </span>
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-3 flex-1">
            {item.overview || 'No description available.'}
          </p>

          {/* Collections/Tags */}
          {item.collections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {item.collections.slice(0, 3).map((collection) => (
                <span
                  key={collection.id}
                  className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs"
                >
                  {collection.name}
                </span>
              ))}
              {item.collections.length > 3 && (
                <span className="text-muted-foreground text-xs">
                  +{item.collections.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </animated.div>
  );
}
