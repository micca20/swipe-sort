import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Film, Loader2, Server, Key, AlertCircle } from 'lucide-react';

export function SetupScreen() {
  const { connect, isLoading, error } = useApp();
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Basic validation
    if (!baseUrl.trim()) {
      setLocalError('Please enter your Maintainerr server URL');
      return;
    }

    if (!apiKey.trim()) {
      setLocalError('Please enter your API key');
      return;
    }

    // Validate URL format
    try {
      new URL(baseUrl);
    } catch {
      setLocalError('Please enter a valid URL (e.g., http://192.168.1.100:6246)');
      return;
    }

    await connect({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim() });
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-area-inset-top safe-area-inset-bottom">
      {/* Logo and Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Film className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Maintainarr Swipe</h1>
        <p className="text-muted-foreground text-center mt-2">
          Curate your media library with a swipe
        </p>
      </div>

      {/* Connection Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <Label htmlFor="baseUrl" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Server URL
          </Label>
          <Input
            id="baseUrl"
            type="url"
            placeholder="http://192.168.1.100:6246"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="h-12 text-base"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Key
          </Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="h-12 text-base"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        {displayError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect'
          )}
        </Button>
      </form>

      {/* Help Text */}
      <p className="text-muted-foreground text-sm text-center mt-8 max-w-xs">
        Enter your Maintainerr server URL and API key to get started. You can find these in your Maintainerr settings.
      </p>
    </div>
  );
}
