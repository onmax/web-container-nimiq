export default {
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    fs: {
      allow: ['..']
    },
    https: false, // Force HTTP for localhost
  },
  optimizeDeps: {
    exclude: ['@webcontainer/api']
  },
  build: {
    target: 'es2022' // Ensure modern JS features are supported
  },
  esbuild: {
    target: 'es2022'
  }
} 
