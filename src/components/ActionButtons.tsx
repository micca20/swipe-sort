import type { MediaItem, SwipeDirection } from '@/types/maintainerr';
import { Button } from '@/components/ui/button';
import { Check, X, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonsProps {
  onAction: (direction: SwipeDirection) => void;
  disabled?: boolean;
  selectedCollectionName?: string;
}

export function ActionButtons({ onAction, disabled, selectedCollectionName }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {/* Skip Button */}
      <Button
        variant="outline"
        size="icon"
        className="w-14 h-14 rounded-full border-2 border-muted-foreground/30 hover:border-muted-foreground hover:bg-muted"
        onClick={() => onAction('left')}
        disabled={disabled}
        aria-label="Skip"
      >
        <X className="w-6 h-6 text-muted-foreground" />
      </Button>

      {/* Exclude Button */}
      <Button
        variant="outline"
        size="icon"
        className="w-12 h-12 rounded-full border-2 border-destructive/30 hover:border-destructive hover:bg-destructive/10"
        onClick={() => onAction('down')}
        disabled={disabled}
        aria-label="Exclude"
      >
        <Ban className="w-5 h-5 text-destructive" />
      </Button>

      {/* Add to Collection Button */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          'w-14 h-14 rounded-full border-2',
          selectedCollectionName
            ? 'border-primary/50 hover:border-primary hover:bg-primary/10'
            : 'border-muted-foreground/20 opacity-50 cursor-not-allowed'
        )}
        onClick={() => onAction('right')}
        disabled={disabled || !selectedCollectionName}
        aria-label={selectedCollectionName ? `Add to ${selectedCollectionName}` : 'Select a collection first'}
      >
        <Check className={cn(
          'w-6 h-6',
          selectedCollectionName ? 'text-primary' : 'text-muted-foreground'
        )} />
      </Button>
    </div>
  );
}
