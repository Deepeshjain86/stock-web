import { useState, useEffect } from 'react';

/**
 * Resolve relative image URL to absolute backend host URL if needed.
 */
export const getLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '';
  return `${backendBase}${cleanPath}`;
};

export const getImageUrl = getLogoUrl;

/**
 * Generate localStorage key per tenant
 */
export const getStorageKey = (user) => {
  const monitored = localStorage.getItem('monitoredTenant');
  if (monitored) {
    try {
      const parsed = JSON.parse(monitored);
      if (parsed && parsed.id) return `storeLogo_${parsed.id}`;
    } catch (e) {}
  }
  const tenantId = user?.tenant_id || 'default';
  return `storeLogo_${tenantId}`;
};

/**
 * Broadcast logo updates across all components in real-time
 */
export const setStoreLogo = (user, logoUrl) => {
  const key = getStorageKey(user);
  if (logoUrl) {
    localStorage.setItem(key, logoUrl);
    localStorage.setItem('storeLogo_active', logoUrl);
  } else {
    localStorage.removeItem(key);
    localStorage.removeItem('storeLogo_active');
  }
  window.dispatchEvent(new CustomEvent('storeLogoUpdated', { detail: { logoUrl } }));
};

/**
 * React hook to synchronize logo state in real time across components
 */
export const useStoreLogo = (user) => {
  const key = getStorageKey(user);
  const [logoUrl, setLogoState] = useState(() => {
    return localStorage.getItem(key) || localStorage.getItem('storeLogo_active') || null;
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      const updated = (e?.detail?.logoUrl) || localStorage.getItem(key) || localStorage.getItem('storeLogo_active') || null;
      setLogoState(updated);
    };

    window.addEventListener('storeLogoUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('storeLogoUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [key]);

  return [logoUrl, (newUrl) => setStoreLogo(user, newUrl)];
};
