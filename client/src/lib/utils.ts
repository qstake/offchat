import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves image URLs for proper display in both development and production environments
 * Environment-agnostic URL resolution for NFT media
 * @param url - The URL to resolve (can be relative or absolute)
 * @returns - The resolved absolute URL
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  // Return null for falsy values
  if (!url) return null;

  // If it's already an absolute URL (starts with http:// or https://), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For production environments, prioritize environment variables for base URL
  const getBaseUrl = (): string => {
    if (typeof window !== 'undefined') {
      // In production, use environment variable if available
      const envApiUrl = import.meta.env.VITE_API_URL;
      if (envApiUrl) {
        // Remove trailing /api if present to get base URL
        return envApiUrl.replace(/\/api$/, '');
      }
      
      // Fall back to window.location.origin for both dev and production
      // This ensures HTTPS compliance in production (offchatapp.com)
      return window.location.origin;
    }
    return '';
  };

  // If it's a relative URL starting with /objects/ (object storage paths)
  if (url.startsWith('/objects/')) {
    const baseUrl = getBaseUrl();
    return `${baseUrl}${url}`;
  }

  // If it's a relative URL starting with / (other relative paths)
  if (url.startsWith('/')) {
    const baseUrl = getBaseUrl();
    return `${baseUrl}${url}`;
  }

  // For any other cases, try to construct a full URL
  const baseUrl = getBaseUrl();
  return `${baseUrl}/${url}`;
}

/**
 * Resolves object storage URLs for production environments
 * Uses the API resolver to get direct cloud storage URLs when needed
 * @param objectPath - The object path (e.g., /objects/uploads/uuid)
 * @returns Promise that resolves to the accessible URL
 */
export async function resolveObjectStorageUrl(objectPath: string): Promise<string | null> {
  if (!objectPath) return null;

  // If it's already an absolute URL, return as-is
  if (objectPath.startsWith('http://') || objectPath.startsWith('https://')) {
    return objectPath;
  }

  // For object storage paths, check if we need production URL resolution
  if (objectPath.startsWith('/objects/')) {
    const getBaseUrl = (): string => {
      if (typeof window !== 'undefined') {
        const envApiUrl = import.meta.env.VITE_API_URL;
        if (envApiUrl) {
          return envApiUrl.replace(/\/api$/, '');
        }
        return window.location.origin;
      }
      return '';
    };

    const baseUrl = getBaseUrl();
    
    // Determine if we're likely in production based on the domain
    const isProduction = typeof window !== 'undefined' && (
      window.location.hostname === 'offchatapp.com' ||
      (window.location.hostname.includes('.') && !window.location.hostname.includes('.replit.dev'))
    );

    console.log('Object storage URL resolution:', {
      objectPath,
      baseUrl,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      isProduction
    });
    
    // For production environments, directly try the API resolver first
    if (isProduction) {
      try {
        console.log('Production detected, using API resolver...');
        const resolverResponse = await fetch(`${baseUrl}/api/objects/resolve?path=${encodeURIComponent(objectPath)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (resolverResponse.ok) {
          const resolved = await resolverResponse.json();
          console.log('API resolver response:', resolved);
          return resolved.url;
        } else {
          console.error('API resolver failed:', resolverResponse.status, resolverResponse.statusText);
          // Try to get response text for debugging
          try {
            const errorText = await resolverResponse.text();
            console.error('API resolver error response:', errorText);
          } catch {}
        }
      } catch (error) {
        console.error('Error with production API resolver:', error);
      }
    }
    
    // For development or fallback, try direct URL first
    const directUrl = `${baseUrl}${objectPath}`;
    
    try {
      // Try to fetch the direct URL with a HEAD request to check if it's accessible
      const response = await fetch(directUrl, { method: 'HEAD' });
      
      if (response.ok) {
        console.log('Direct URL works:', directUrl);
        return directUrl;
      } else {
        console.log('Direct URL failed, trying API resolver...');
        // Direct path doesn't work, use API resolver
        const resolverResponse = await fetch(`${baseUrl}/api/objects/resolve?path=${encodeURIComponent(objectPath)}`);
        
        if (resolverResponse.ok) {
          const resolved = await resolverResponse.json();
          console.log('Fallback API resolver response:', resolved);
          return resolved.url;
        } else {
          console.error('Fallback API resolver also failed:', resolverResponse.status);
        }
      }
    } catch (error) {
      console.error('Error resolving object storage URL:', error);
      
      // Final fallback: try the API resolver
      try {
        const resolverResponse = await fetch(`${baseUrl}/api/objects/resolve?path=${encodeURIComponent(objectPath)}`);
        if (resolverResponse.ok) {
          const resolved = await resolverResponse.json();
          console.log('Final fallback API resolver response:', resolved);
          return resolved.url;
        } else {
          console.error('Final fallback API resolver failed:', resolverResponse.status);
        }
      } catch (resolverError) {
        console.error('Error with final fallback resolver:', resolverError);
      }
    }
  }

  // Fallback to basic URL resolution
  return resolveImageUrl(objectPath);
}
