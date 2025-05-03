/**
 * Utility to load Google Maps API for web platform
 */

// Function to load Google Maps API
function loadGoogleMapsAPI(callback) {
  // Check if we're running on web platform
  if (typeof window === 'undefined') {
    return;
  }

  if (window.google && window.google.maps) {
    // Google Maps API is already loaded, call the callback function
    callback();
  } else {
    // Google Maps API is not loaded, dynamically load it
    const apiKey = process.env.EXPO_PUBLIC_WEB_GOOGLE_MAPS_API_KEY || 'YOUR_WEB_API_KEY_HERE';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    
    // Append the script to the document
    document.head.appendChild(script);
  }
}

export default loadGoogleMapsAPI;