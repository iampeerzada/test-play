import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iptv.streamer',
  appName: 'IPTV Streamer',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
