import { useApp } from '@/context/AppContext';
import { SetupScreen } from '@/components/SetupScreen';
import { LibrarySelector } from '@/components/LibrarySelector';
import { CollectionSetupScreen } from '@/components/CollectionSetupScreen';
import { SwipeInterface } from '@/components/SwipeInterface';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { appStep, isConnected, isLoading } = useApp();

  // Initial loading state
  if (isLoading && !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not connected, always show setup
  if (!isConnected) {
    return <SetupScreen />;
  }

  // Route based on app step
  switch (appStep) {
    case 'library':
      return <LibrarySelector />;
    case 'collection':
      return <CollectionSetupScreen />;
    case 'swipe':
      return <SwipeInterface />;
    default:
      return <SetupScreen />;
  }
};

export default Index;
