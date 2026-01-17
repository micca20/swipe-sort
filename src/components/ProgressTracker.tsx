import { useApp } from '@/context/AppContext';
import { Progress } from '@/components/ui/progress';

export function ProgressTracker() {
  const { currentIndex, totalCount, remainingCount } = useApp();

  if (totalCount === 0) return null;

  const progressPercent = ((totalCount - remainingCount) / totalCount) * 100;

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{remainingCount} remaining</span>
        <span>{totalCount - remainingCount} of {totalCount}</span>
      </div>
      <Progress value={progressPercent} className="h-1.5" />
    </div>
  );
}
