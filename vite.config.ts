import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const buildId = Date.now().toString()

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'generate-version-json',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ buildId }),
        })
      },
    },
  ],
})
