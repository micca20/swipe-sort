// Maintainerr API Service
// Updated to use correct Maintainerr API endpoints

import type { 
  MaintainerrConfig, 
  MediaItem, 
  Collection, 
  ApiResponse,
  PlexLibrary,
  PlexMediaItem,
  PlexLibraryContent,
  MaintainerrCollection
} from '@/types/maintainerr';

class MaintainerrApi {
  private config: MaintainerrConfig | null = null;

  setConfig(config: MaintainerrConfig) {
    this.config = config;
  }

  private getHeaders(): HeadersInit {
    if (!this.config) {
      throw new Error('API not configured');
    }
    return {
      'Content-Type': 'application/json',
      'X-Api-Key': this.config.apiKey,
    };
  }

  private getBaseUrl(): string {
    if (!this.config) {
      throw new Error('API not configured');
    }
    // Remove trailing slash if present
    return this.config.baseUrl.replace(/\/$/, '');
  }

  async testConnection(): Promise<ApiResponse<boolean>> {
    try {
      // Correct endpoint: /api/app/status
      const response = await fetch(`${this.getBaseUrl()}/api/app/status`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { success: false, error: 'Invalid API key' };
        }
        return { success: false, error: `Connection failed: ${response.statusText}` };
      }

      return { success: true, data: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to server' 
      };
    }
  }

  async getPlexLibraries(): Promise<ApiResponse<PlexLibrary[]>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/plex/libraries`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { success: false, error: `Failed to fetch libraries: ${response.statusText}` };
      }

      const data = await response.json();
      
      // Map raw API response (key, title) to our PlexLibrary format (id, name)
      const libraries: PlexLibrary[] = (data || []).map((lib: { key: string; title: string; type: string }) => ({
        id: lib.key,
        name: lib.title,
        type: lib.type as 'movie' | 'show',
      }));
      
      return { success: true, data: libraries };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch libraries' 
      };
    }
  }

  async getLibraryContent(libraryId: string, page: number = 0): Promise<ApiResponse<PlexLibraryContent>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/plex/library/${libraryId}/content/${page}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { success: false, error: `Failed to fetch library content: ${response.statusText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch library content' 
      };
    }
  }

  async getAllMedia(): Promise<ApiResponse<MediaItem[]>> {
    try {
      // First get all libraries
      const librariesResult = await this.getPlexLibraries();
      if (!librariesResult.success || !librariesResult.data) {
        return { success: false, error: librariesResult.error || 'Failed to fetch libraries' };
      }

      const allMedia: MediaItem[] = [];
      
      // Fetch content from each library
      for (const library of librariesResult.data) {
        let page = 0;
        let hasMore = true;
        
        while (hasMore) {
          const contentResult = await this.getLibraryContent(library.id, page);
          
          if (!contentResult.success || !contentResult.data) {
            console.warn(`Failed to fetch page ${page} from library ${library.name}`);
            break;
          }
          
          const { items, totalSize } = contentResult.data;
          
          // Map Plex items to our MediaItem format
          const mappedItems = items.map((item: PlexMediaItem) => this.mapPlexItemToMediaItem(item));
          allMedia.push(...mappedItems);
          
          // Check if there are more pages (assuming 100 items per page)
          const itemsPerPage = 100;
          hasMore = (page + 1) * itemsPerPage < totalSize;
          page++;
        }
      }

      return { success: true, data: allMedia };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch media' 
      };
    }
  }

  async getLibraryMedia(libraryId: string): Promise<ApiResponse<MediaItem[]>> {
    // Guard against invalid library IDs
    if (!libraryId || libraryId === 'undefined' || libraryId === 'null') {
      return { success: false, error: 'Invalid library ID provided' };
    }
    
    try {
      const allMedia: MediaItem[] = [];
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const contentResult = await this.getLibraryContent(libraryId, page);
        
        if (!contentResult.success || !contentResult.data) {
          if (page === 0) {
            return { success: false, error: contentResult.error || 'Failed to fetch library content' };
          }
          break;
        }
        
        const { items, totalSize } = contentResult.data;
        const mappedItems = items.map((item: PlexMediaItem) => this.mapPlexItemToMediaItem(item));
        allMedia.push(...mappedItems);
        
        // Check if there are more pages
        const itemsPerPage = 100;
        hasMore = (page + 1) * itemsPerPage < totalSize;
        page++;
      }

      return { success: true, data: allMedia };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch library media' 
      };
    }
  }

  private mapPlexItemToMediaItem(item: PlexMediaItem): MediaItem {
    // Extract TMDB ID from Guid array (format: "tmdb://12345")
    let tmdbId: number | undefined;
    if (item.Guid) {
      const tmdbGuid = item.Guid.find(g => g.id.startsWith('tmdb://'));
      if (tmdbGuid) {
        tmdbId = parseInt(tmdbGuid.id.replace('tmdb://', ''), 10);
      }
    }

    return {
      id: parseInt(item.ratingKey, 10),
      plexId: item.ratingKey,
      title: item.title,
      year: item.year || 0,
      type: item.type === 'show' ? 'tv' : 'movie',
      overview: item.summary || '',
      posterPath: item.thumb || null,
      backdropPath: item.art || null,
      tmdbId,
      genres: item.Genre?.map(g => g.tag) || [],
      runtime: item.duration ? Math.floor(item.duration / 60000) : undefined, // ms to minutes
      seasons: item.childCount,
      addedAt: new Date(item.addedAt * 1000).toISOString(),
      lastWatchedAt: item.lastViewedAt ? new Date(item.lastViewedAt * 1000).toISOString() : undefined,
      collections: [],
      isExcluded: false,
    };
  }

  // Legacy method - now calls getAllMedia
  async getMedia(): Promise<ApiResponse<MediaItem[]>> {
    return this.getAllMedia();
  }

  async getCollections(): Promise<ApiResponse<Collection[]>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/collections`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { success: false, error: `Failed to fetch collections: ${response.statusText}` };
      }

      const data: MaintainerrCollection[] = await response.json();
      
      // Map to our Collection format
      const collections: Collection[] = (data || []).map(col => ({
        id: col.id,
        name: col.title,
        description: col.description,
        mediaCount: col.media?.length || 0,
        isActive: col.isActive,
      }));
      
      return { success: true, data: collections };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch collections' 
      };
    }
  }

  async addToCollection(plexId: string, collectionId: number): Promise<ApiResponse<boolean>> {
    try {
      const requestBody = { 
        collectionId,
        plexId: parseInt(plexId, 10),
        isManual: true  // Mark as manually added
      };
      
      console.log('[API] addToCollection request:', {
        url: `${this.getBaseUrl()}/api/collections/add`,
        body: requestBody
      });

      // Correct endpoint: POST /api/collections/add
      const response = await fetch(`${this.getBaseUrl()}/api/collections/add`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('[API] addToCollection response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      if (!response.ok) {
        return { success: false, error: `Failed to add to collection: ${response.status} ${responseText}` };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('[API] addToCollection error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add to collection' 
      };
    }
  }

  async excludeMedia(plexId: string, ruleId?: number): Promise<ApiResponse<boolean>> {
    try {
      // Correct endpoint: POST /api/rules/exclusion
      const response = await fetch(`${this.getBaseUrl()}/api/rules/exclusion`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ 
          plexId: parseInt(plexId, 10),
          ruleId: ruleId || null
        }),
      });

      if (!response.ok) {
        return { success: false, error: `Failed to exclude media: ${response.statusText}` };
      }

      return { success: true, data: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to exclude media' 
      };
    }
  }

  // Get poster URL - use Plex proxy through Maintainerr
  getPosterUrl(posterPath: string | null): string {
    if (!posterPath) return '/placeholder.svg';
    if (!this.config) return '/placeholder.svg';
    
    // Always use the Plex proxy through Maintainerr since posterPath is a Plex path
    return `${this.getBaseUrl()}/api/plex/thumb?url=${encodeURIComponent(posterPath)}`;
  }
}

export const maintainerrApi = new MaintainerrApi();
