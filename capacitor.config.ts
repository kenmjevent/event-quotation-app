import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mjevent.costing',
  appName: 'Event Costing',
  webDir: 'public',

  server: {
    url: 'https://bright-cuchufli-c01c36.netlify.app/',
    cleartext: false
  }
}

export default config