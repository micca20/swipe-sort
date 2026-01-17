import { useApp } from '@/context/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SlidersHorizontal } from 'lucide-react';
import type { FilterOptions } from '@/types/maintainerr';

export function FilterSheet() {
  const { filters, setFilters } = useApp();

  const handleMediaTypeChange = (value: FilterOptions['mediaType']) => {
    setFilters({ ...filters, mediaType: value });
  };

  const handleSortChange = (value: FilterOptions['sortBy']) => {
    setFilters({ ...filters, sortBy: value });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Filters & Sorting</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          {/* Media Type Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Show</Label>
            <RadioGroup
              value={filters.mediaType}
              onValueChange={handleMediaTypeChange}
              className="flex gap-2"
            >
              <Label
                htmlFor="all"
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors"
              >
                <RadioGroupItem value="all" id="all" className="sr-only" />
                All
              </Label>
              <Label
                htmlFor="movie"
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors"
              >
                <RadioGroupItem value="movie" id="movie" className="sr-only" />
                Movies
              </Label>
              <Label
                htmlFor="tv"
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors"
              >
                <RadioGroupItem value="tv" id="tv" className="sr-only" />
                TV Shows
              </Label>
            </RadioGroup>
          </div>

          {/* Sort Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sort by</Label>
            <RadioGroup
              value={filters.sortBy}
              onValueChange={handleSortChange}
              className="space-y-2"
            >
              <Label
                htmlFor="oldest"
                className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:bg-secondary has-[:checked]:border-primary transition-colors"
              >
                <RadioGroupItem value="oldest" id="oldest" />
                <div>
                  <div className="font-medium">Oldest Added</div>
                  <div className="text-xs text-muted-foreground">Items added longest ago first</div>
                </div>
              </Label>
              <Label
                htmlFor="lastWatched"
                className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:bg-secondary has-[:checked]:border-primary transition-colors"
              >
                <RadioGroupItem value="lastWatched" id="lastWatched" />
                <div>
                  <div className="font-medium">Least Recently Watched</div>
                  <div className="text-xs text-muted-foreground">Items you haven't watched in a while</div>
                </div>
              </Label>
              <Label
                htmlFor="uncollected"
                className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:bg-secondary has-[:checked]:border-primary transition-colors"
              >
                <RadioGroupItem value="uncollected" id="uncollected" />
                <div>
                  <div className="font-medium">Uncollected First</div>
                  <div className="text-xs text-muted-foreground">Items not in any collection</div>
                </div>
              </Label>
            </RadioGroup>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
