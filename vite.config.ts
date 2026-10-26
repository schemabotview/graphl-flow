import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// simple-icons tree-shakes to the marks we import, but its 5 MB index.mjs would still ride in the
// sourcemap's sourcesContent. Keep our sources in the map; drop node_modules'.
const dropVendorSources = (): Plugin => ({
  name: 'drop-vendor-sources',
  writeBundle({ dir = 'dist' }, bundle) {
    for (const name of Object.keys(bundle).filter((f) => f.endsWith('.map'))) {
      const path = join(dir, name)
      const map = JSON.parse(readFileSync(path, 'utf8'))
      map.sourcesContent = map.sources.map((s: string, i: number) => (s.includes('node_modules') ? null : map.sourcesContent[i]))
      writeFileSync(path, JSON.stringify(map))
    }
  },
})

export default defineConfig({
  plugins: [react(), dropVendorSources()],
  server: { port: 5175 },
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react'],
    },
  },
})
