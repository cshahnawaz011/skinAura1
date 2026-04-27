import { useState, useEffect, useCallback } from 'react';

/**
 * useRealLocation - Shared hook for GPS-first real browser location.
 * 1. Requests browser GPS permission (navigator.geolocation)
 * 2. Falls back to IP-based location if GPS denied/unavailable
 * Returns: { location, loading, error, source, refetch }
 * location: { city, lat, lon } | null
 * source: 'GPS' | 'IP' | null
 */
export function useRealLocation({ autoFetch = true } = {}) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLocation(null);
    setSource(null);

    // Step 1 — Request real GPS from browser
    const tryGPS = () => new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('no_geo'));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        enableHighAccuracy: true,
        maximumAge: 60000,
      });
    });

    try {
      const pos = await tryGPS();
      const { latitude, longitude } = pos.coords;
      let city = 'Your Location';
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const geoData = await geoRes.json();
        city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || 'Your Location';
      } catch { /* city stays as default */ }
      setLocation({ city, lat: latitude, lon: longitude });
      setSource('GPS');
      setLoading(false);
      return { city, lat: latitude, lon: longitude, source: 'GPS' };
    } catch {
      // GPS denied or unavailable — fall back to IP
    }

    // Step 2 — IP-based fallback
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      const ipData = await ipRes.json();
      if (ipData.latitude && ipData.longitude) {
        const loc = {
          city: ipData.city || ipData.region || 'Your Location',
          lat: ipData.latitude,
          lon: ipData.longitude,
        };
        setLocation(loc);
        setSource('IP');
        setLoading(false);
        return { ...loc, source: 'IP' };
      }
    } catch { /* IP also failed */ }

    setError('Location unavailable. Please allow location access in your browser.');
    setLoading(false);
    return null;
  }, []);

  useEffect(() => {
    if (autoFetch) fetchLocation();
  }, []);

  return { location, loading, error, source, refetch: fetchLocation };
}