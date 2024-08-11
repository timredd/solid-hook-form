/// <reference types="vitest" />
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
// import devtools from 'solid-devtools/vite';

export default defineConfig({
  plugins: [
    /* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
    solidPlugin(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  // [Maybe only needed for SolidStart](https://docs.solidjs.com/guides/testing#solidstart-configuration)
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    include: ['src/__tests__', '**/__tests__/**/*.(spec|test).ts?(x)'],
  },
})
