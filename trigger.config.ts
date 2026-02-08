import { defineConfig } from '@trigger.dev/sdk';
import { puppeteer } from '@trigger.dev/build/extensions/puppeteer';

export default defineConfig({
  project: 'proj_tokcabmhigyebcelkbfj',
  runtime: 'node',
  logLevel: 'log',
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
  dirs: ['./src/trigger'],
  machine: 'medium-2x',
  build: {
    extensions: [puppeteer()],
    // Disable keepNames to prevent __name helper injection in page.evaluate()
    esbuild: {
      keepNames: false,
    },
  },
});
