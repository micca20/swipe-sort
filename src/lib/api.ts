// Maintainerr API Service
// Note: This is a placeholder implementation. Update endpoints based on actual Maintainerr API docs.

import type { 
  MaintainerrConfig, 
  MediaItem, 
  Collection, 
  ApiResponse 
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
      const response = await fetch(`${this.getBaseUrl()}/api/status`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
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

  async getMedia(): Promise<ApiResponse<MediaItem[]>> {
    try {
      // Placeholder: Adjust endpoint based on actual Maintainerr API
      const response = await fetch(`${this.getBaseUrl()}/api/media`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { success: false, error: `Failed to fetch media: ${response.statusText}` };
      }

      const data = await response.json();
      
      // Transform API response to our MediaItem format
      // This mapping will need adjustment based on actual API response structure
      const mediaItems: MediaItem[] = (data.items || data || []).map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        year: item.year || new Date(item.releaseDate || item.firstAirDate).getFullYear(),
        type: item.mediaType === 'movie' ? 'movie' : 'tv',
        overview: item.overview || '',
        posterPath: item.posterPath || item.poster_path,
        backdropPath: item.backdropPath || item.backdrop_path,
        genres: item.genres || [],
        runtime: item.runtime,
        seasons: item.numberOfSeasons || item.seasons,
        addedAt: item.addedAt || item.createdAt,
        lastWatchedAt: item.lastWatchedAt,
        collections: item.collections || [],
        isExcluded: item.isExcluded || false,
      }));

      return { success: true, data: mediaItems };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch media' 
      };
    }
  }

  async getCollections(): Promise<ApiResponse<Collection[]>> {
    try {
      // Placeholder: Adjust endpoint based on actual Maintainerr API
      const response = await fetch(`${this.getBaseUrl()}/api/collections`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { success: false, error: `Failed to fetch collections: ${response.statusText}` };
      }

      const data = await response.json();
      return { success: true, data: data.items || data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch collections' 
      };
    }
  }

  async addToCollection(mediaId: number, collectionId: number): Promise<ApiResponse<boolean>> {
    try {
      // Placeholder: Adjust endpoint based on actual Maintainerr API
      const response = await fetch(`${this.getBaseUrl()}/api/collections/${collectionId}/media`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ mediaId }),
      });

      if (!response.ok) {
        return { success: false, error: `Failed to add to collection: ${response.statusText}` };
      }

      return { success: true, data: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add to collection' 
      };
    }
  }

  async excludeMedia(mediaId: number): Promise<ApiResponse<boolean>> {
    try {
      // Placeholder: Adjust endpoint based on actual Maintainerr API
      const response = await fetch(`${this.getBaseUrl()}/api/media/${mediaId}/exclude`, {
        method: 'POST',
        headers: this.getHeaders(),
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
}

export const maintainerrApi = new MaintainerrApi();
