import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oxyvra.app',
  appName: 'Oxyvra',
  webDir: 'public',

  server: {
    url: 'https://oxyvra-shine-team.lovable.app',
    cleartext: false,
  },
};

export default config;
