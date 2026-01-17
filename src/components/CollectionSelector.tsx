import { useApp } from '@/context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderPlus } from 'lucide-react';

export function CollectionSelector() {
  const { collections, selectedCollectionId, setSelectedCollection } = useApp();

  const selectedCollection = collections.find(c => c.id === selectedCollectionId);

  return (
    <div className="w-full max-w-xs">
      <Select
        value={selectedCollectionId?.toString() || ''}
        onValueChange={(value) => setSelectedCollection(value ? parseInt(value, 10) : null)}
      >
        <SelectTrigger className="h-10 bg-secondary border-none">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-primary" />
            <SelectValue placeholder="Select collection">
              {selectedCollection?.name || 'Select collection'}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {collections.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No collections available
            </div>
          ) : (
            collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id.toString()}>
                <div className="flex flex-col">
                  <span>{collection.name}</span>
                  {collection.mediaCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {collection.mediaCount} items
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
