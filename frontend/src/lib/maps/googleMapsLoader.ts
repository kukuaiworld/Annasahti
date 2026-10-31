/**
 * FoodLoop - Google Maps JavaScript API Singleton Loader
 *
 * Dynamically loads the Google Maps JavaScript API on demand.
 * Ensures only one script tag is injected into the DOM.
 */

declare global {
  interface Window {
    google?: any;
    __google_maps_callback__?: () => void;
  }
}

let loadPromise: Promise<any> | null = null;

export interface GoogleMapsLoaderOptions {
  apiKey?: string;
  libraries?: string[];
}

export function loadGoogleMapsApi(options: GoogleMapsLoaderOptions = {}): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in a browser environment'));
  }

  // If already loaded on window, resolve immediately
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  // Return existing in-flight promise if loading
  if (loadPromise) {
    return loadPromise;
  }

  const apiKey =
    options.apiKey ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  if (!apiKey || apiKey.includes('your-') || apiKey.trim() === '') {
    return Promise.reject(
      new Error(
        'Google Maps API Key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in frontend/.env.local.'
      )
    );
  }

  const libraries = options.libraries || ['places', 'geometry'];

  loadPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script loaded but window.google.maps is undefined.'));
        }
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Google Maps script.'));
      });
      return;
    }

    const callbackName = '__google_maps_callback__';
    window[callbackName] = () => {
      delete window[callbackName];
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps callback triggered but maps object is missing.'));
      }
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey.trim()
    )}&libraries=${libraries.join(',')}&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      delete window[callbackName];
      loadPromise = null;
      reject(
        new Error(
          'Failed to load Google Maps script. Check network connection, referrer restrictions, and API key validity.'
        )
      );
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
