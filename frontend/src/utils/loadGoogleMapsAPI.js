/**
 * Utility to load Google Maps API for web platform
 */

// Function to load Google Maps API
function loadGoogleMapsAPI(callback) {
  // Check if we're running on web platform
  if (typeof window === 'undefined') {
    console.log('Not running in browser environment, skipping Google Maps API load');
    return;
  }

  try {
    if (window.google && window.google.maps) {
      // Google Maps API is already loaded, call the callback function
      console.log('Google Maps API already loaded, proceeding');
      callback();
    } else {
      // Google Maps API is not loaded, dynamically load it
      console.log('Loading Google Maps API dynamically');
      const apiKey = process.env.EXPO_PUBLIC_WEB_GOOGLE_MAPS_API_KEY || 'AIzaSyCOZ2LqiS0C3fxrtMujZQU8O-_o02Tvgnc';
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        callback();
      };
      
      script.onerror = (error) => {
        console.error('Error loading Google Maps API:', error);
      };
      
      // Append the script to the document
      document.head.appendChild(script);
    }
  } catch (error) {
    console.error('Exception during Google Maps API loading:', error);
  }
}

export default loadGoogleMapsAPI;