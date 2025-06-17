import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    vue(),
    // Plugin to copy Nimiq worker dependencies
    {
      name: 'copy-nimiq-assets',
      generateBundle() {
        const nimiqCorePath = 'node_modules/.pnpm/@nimiq+core@2.1.0/node_modules/@nimiq/core/web'
        
        // Copy comlink.min.js
        this.emitFile({
          type: 'asset',
          fileName: 'assets/comlink.min.js',
          source: readFileSync(resolve(nimiqCorePath, 'comlink.min.js'))
        })
        
        // Copy worker-wasm files
        this.emitFile({
          type: 'asset',
          fileName: 'assets/worker-wasm/index.js',
          source: readFileSync(resolve(nimiqCorePath, 'worker-wasm/index.js'))
        })
        
        this.emitFile({
          type: 'asset',
          fileName: 'assets/worker-wasm/index_bg.wasm',
          source: readFileSync(resolve(nimiqCorePath, 'worker-wasm/index_bg.wasm'))
        })
      }
    }
  ],
  worker: {
    format: 'es',
    plugins: () => [
      wasm(),
    ],
    rollupOptions: {
      external: [], // Don't externalize anything for workers
      output: {
        format: 'es',
        inlineDynamicImports: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['@nimiq/core'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
})
