import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.offchat.messenger',
  appName: 'Offchat',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Searching for Offchat users...',
        cancel: 'Cancel',
        availableDevices: 'Nearby Offchat Users',
        noDeviceFound: 'No Offchat users found nearby'
      }
    }
  }
};

export default config;
