import { useApp } from '@/context/AppContext';
import { SetupScreen } from '@/components/SetupScreen';
import { SwipeInterface } from '@/components/SwipeInterface';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { isConnected, isLoading } = useApp();

  // Initial loading state
  if (isLoading && !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show setup if not connected
  if (!isConnected) {
    return <SetupScreen />;
  }

  // Main swipe interface
  return <SwipeInterface />;
};

export default Index;
