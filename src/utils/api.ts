import { Capacitor } from '@capacitor/core';

export function getApiBaseUrl(): string {
  // When running natively (Android/iOS), relative paths like '/api' will fail
  // because there is no Node server running locally inside the mobile app.
  if (Capacitor.isNativePlatform()) {
    // Check if the user has configured a custom backend URL in localStorage
    const savedUrl = localStorage.getItem('native_backend_url');
    if (savedUrl) return savedUrl.replace(/\/$/, '');
    
    // Default to the hosted AI Studio URL so it works out of the box.
    // IF YOU ARE HOSTING ON A LOCAL VPS: Change this to your VPS URL (e.g., 'http://your-vps-ip:3000') BEFORE building your APK!
    return 'https://ais-pre-czsxixhjbz5ued4kd2yx4i-219951265601.asia-southeast1.run.app';
  }
  
  // On the web, frontend and backend share the same hostname, so relative path is fine.
  return '';
}

export function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http')) return endpoint;
  
  // Ensure the endpoint starts with a slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${getApiBaseUrl()}${cleanEndpoint}`;
}
